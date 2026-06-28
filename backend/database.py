# backend/database.py
"""
SQLite database interface for storing variant analysis runs, detailed multi-agent logs,
and human-in-the-loop (HITL) gate states.
"""

import sqlite3
import os
import json
from datetime import datetime, timezone, timedelta

def get_now_ist() -> str:
    # IST is UTC+5:30
    ist_tz = timezone(timedelta(hours=5, minutes=30))
    return datetime.now(ist_tz).isoformat()


DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cva.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database schema if it does not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Runs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        variant_query TEXT NOT NULL,
        gene_symbol TEXT,
        hgvs_c TEXT,
        hgvs_p TEXT,
        clinvar_id TEXT,
        status TEXT NOT NULL,
        confidence REAL,
        final_classification TEXT,
        hitl_state TEXT DEFAULT 'NONE',
        hitl_reason TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    """)
    
    # Agent logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS agent_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL,
        agent_name TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT NOT NULL,
        details TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (run_id) REFERENCES runs (id) ON DELETE CASCADE
    )
    """)
    
    conn.commit()
    conn.close()

def create_run(run_id: str, variant_query: str) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    now = get_now_ist()
    cursor.execute(
        "INSERT INTO runs (id, variant_query, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        (run_id, variant_query, "RUNNING", now, now)
    )
    conn.commit()
    conn.close()
    return {
        "id": run_id,
        "variant_query": variant_query,
        "status": "RUNNING",
        "created_at": now,
        "updated_at": now
    }

def update_run(run_id: str, **kwargs) -> bool:
    """Updates fields on a run record dynamically."""
    if not kwargs:
        return False
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    kwargs["updated_at"] = get_now_ist()
    fields = []
    values = []
    for k, v in kwargs.items():
        fields.append(f"{k} = ?")
        values.append(v)
    values.append(run_id)
    
    query = f"UPDATE runs SET {', '.join(fields)} WHERE id = ?"
    cursor.execute(query, tuple(values))
    conn.commit()
    success = cursor.rowcount > 0
    conn.close()
    return success

def add_agent_log(run_id: str, agent_name: str, status: str, message: str, details=None) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    now = get_now_ist()
    
    details_str = None
    if details is not None:
        try:
            details_str = json.dumps(details)
        except Exception:
            details_str = str(details)
            
    cursor.execute(
        "INSERT INTO agent_logs (run_id, agent_name, status, message, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
        (run_id, agent_name, status, message, details_str, now)
    )
    log_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return log_id

def get_run(run_id: str) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM runs WHERE id = ?", (run_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_run_logs(run_id: str) -> list:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM agent_logs WHERE run_id = ? ORDER BY id ASC", (run_id,))
    rows = cursor.fetchall()
    conn.close()
    
    logs = []
    for r in rows:
        d = dict(r)
        if d["details"]:
            try:
                d["details"] = json.loads(d["details"])
            except Exception:
                pass
        logs.append(d)
    return logs

def get_all_runs() -> list:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM runs ORDER BY updated_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_diagnostics_metrics() -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT count(*) FROM runs")
    total_runs = cursor.fetchone()[0]
    
    cursor.execute("SELECT count(*) FROM runs WHERE status = 'COMPLETED'")
    completed_runs = cursor.fetchone()[0]
    
    cursor.execute("SELECT count(*) FROM runs WHERE status = 'PAUSED_HITL'")
    paused_hitl = cursor.fetchone()[0]
    
    cursor.execute("SELECT count(*) FROM runs WHERE status = 'FAILED'")
    failed_runs = cursor.fetchone()[0]
    
    cursor.execute("SELECT count(*) FROM agent_logs WHERE status = 'ERROR' OR status = 'FAILED'")
    error_logs = cursor.fetchone()[0]
    
    conn.close()
    
    return {
        "total_runs": total_runs,
        "completed_runs": completed_runs,
        "paused_hitl": paused_hitl,
        "failed_runs": failed_runs,
        "error_count": error_logs,
        "db_size_bytes": os.path.exists(DB_PATH) and os.path.getsize(DB_PATH) or 0
    }
