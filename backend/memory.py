# backend/memory.py
"""
Graph-Based Long-Term Memory Architecture
- Episodic Memory: in-process TTL LRU cache (Redis-equivalent, no external deps)
- Semantic Memory: SQLite-backed persistent store for variant history, patch logs, HITL overrides
- Cross-Session Recall: MonitorAgent queries memory before any external scrape
"""

import json
import hashlib
import sqlite3
import os
from datetime import datetime
from backend.database import get_now_ist
from collections import OrderedDict
from threading import Lock


# ─────────────────────────────────────────────
#  EPISODIC MEMORY  (TTL LRU Cache – Redis substitute)
# ─────────────────────────────────────────────
class TTLCache:
    """Thread-safe in-process TTL LRU cache mimicking Redis GET/SET/TTL."""

    def __init__(self, maxsize: int = 256, ttl_seconds: int = 3600):
        self._cache: OrderedDict = OrderedDict()
        self._expiry: dict = {}
        self._maxsize = maxsize
        self._ttl = ttl_seconds
        self._lock = Lock()

    def set(self, key: str, value, ttl: int = None):
        import time
        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
            self._cache[key] = value
            self._expiry[key] = time.time() + (ttl or self._ttl)
            if len(self._cache) > self._maxsize:
                oldest = next(iter(self._cache))
                del self._cache[oldest]
                del self._expiry[oldest]

    def get(self, key: str):
        import time
        with self._lock:
            if key not in self._cache:
                return None
            if time.time() > self._expiry.get(key, 0):
                del self._cache[key]
                del self._expiry[key]
                return None
            self._cache.move_to_end(key)
            return self._cache[key]

    def delete(self, key: str):
        with self._lock:
            self._cache.pop(key, None)
            self._expiry.pop(key, None)

    def keys(self):
        with self._lock:
            return list(self._cache.keys())


# Global episodic cache (mimics Redis session store)
episodic_cache = TTLCache(maxsize=512, ttl_seconds=3600)


# ─────────────────────────────────────────────
#  SEMANTIC / LONG-TERM MEMORY  (SQLite)
# ─────────────────────────────────────────────
MEMORY_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cva_memory.db")


def init_memory_db():
    """Create semantic memory schema if not present."""
    conn = sqlite3.connect(MEMORY_DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Historical variant classifications
    c.execute("""
    CREATE TABLE IF NOT EXISTS variant_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        variant_fingerprint TEXT NOT NULL,
        variant_query TEXT NOT NULL,
        gene_symbol TEXT,
        hgvs_c TEXT,
        hgvs_p TEXT,
        final_classification TEXT,
        confidence REAL,
        hitl_decision TEXT,
        hitl_rationale TEXT,
        run_id TEXT,
        created_at TEXT NOT NULL
    )""")

    # Self-debugging patch log
    c.execute("""
    CREATE TABLE IF NOT EXISTS debug_patches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL,
        agent_name TEXT NOT NULL,
        error_type TEXT,
        patch_code TEXT,
        patch_applied INTEGER DEFAULT 0,
        retry_attempt INTEGER DEFAULT 0,
        result TEXT,
        sha256_hash TEXT,
        created_at TEXT NOT NULL
    )""")

    # Audit trail (immutable ledger)
    c.execute("""
    CREATE TABLE IF NOT EXISTS audit_trail (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        agent_name TEXT,
        prev_state_hash TEXT NOT NULL,
        curr_state_hash TEXT NOT NULL,
        payload TEXT,
        actor TEXT DEFAULT 'SYSTEM',
        created_at TEXT NOT NULL
    )""")

    # Guardrail violations log
    c.execute("""
    CREATE TABLE IF NOT EXISTS guardrail_violations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL,
        direction TEXT NOT NULL,
        violation_type TEXT,
        severity TEXT,
        detail TEXT,
        created_at TEXT NOT NULL
    )""")

    conn.commit()
    conn.close()


def _get_conn():
    conn = sqlite3.connect(MEMORY_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def fingerprint_variant(hgvs_c: str, gene: str) -> str:
    """Canonical SHA-256 fingerprint for a variant for cross-session recall."""
    raw = f"{gene.upper()}:{hgvs_c.lower().strip()}"
    return hashlib.sha256(raw.encode()).hexdigest()


def recall_variant(hgvs_c: str, gene: str) -> dict | None:
    """
    Cross-session recall: look up prior classification for an identical variant.
    Returns the most recent HITL-override or completed run result if found.
    """
    fp = fingerprint_variant(hgvs_c, gene)

    # Check episodic cache first
    cached = episodic_cache.get(f"variant:{fp}")
    if cached:
        return cached

    conn = _get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT * FROM variant_history
        WHERE variant_fingerprint = ?
        ORDER BY id DESC LIMIT 1
    """, (fp,))
    row = c.fetchone()
    conn.close()

    if row:
        result = dict(row)
        episodic_cache.set(f"variant:{fp}", result)
        return result
    return None


def persist_variant_classification(run_id: str, variant_query: str, gene: str,
                                   hgvs_c: str, hgvs_p: str, classification: str,
                                   confidence: float, hitl_decision: str = None,
                                   hitl_rationale: str = None):
    """Persist a completed variant evaluation to semantic long-term memory."""
    fp = fingerprint_variant(hgvs_c or "", gene or "")
    now = get_now_ist()
    conn = _get_conn()
    conn.execute("""
        INSERT INTO variant_history
            (variant_fingerprint, variant_query, gene_symbol, hgvs_c, hgvs_p,
             final_classification, confidence, hitl_decision, hitl_rationale, run_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (fp, variant_query, gene, hgvs_c, hgvs_p, classification, confidence,
          hitl_decision, hitl_rationale, run_id, now))
    conn.commit()
    conn.close()
    # Invalidate cache so next recall gets fresh data
    episodic_cache.delete(f"variant:{fp}")


def log_debug_patch(run_id: str, agent_name: str, error_type: str,
                    patch_code: str, retry_attempt: int, result: str, applied: bool):
    """Persist self-debugging patch to long-term memory."""
    now = get_now_ist()
    sha = hashlib.sha256(patch_code.encode()).hexdigest()
    conn = _get_conn()
    conn.execute("""
        INSERT INTO debug_patches
            (run_id, agent_name, error_type, patch_code, patch_applied, retry_attempt, result, sha256_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (run_id, agent_name, error_type, patch_code, int(applied), retry_attempt, result, sha, now))
    conn.commit()
    conn.close()


def write_audit_entry(run_id: str, event_type: str, agent_name: str,
                      prev_state: dict, curr_state: dict,
                      payload: dict = None, actor: str = "SYSTEM"):
    """Write an immutable SHA-256-chained audit log entry."""
    prev_hash = hashlib.sha256(json.dumps(prev_state, sort_keys=True).encode()).hexdigest()
    curr_hash = hashlib.sha256(json.dumps(curr_state, sort_keys=True).encode()).hexdigest()
    now = get_now_ist()
    conn = _get_conn()
    conn.execute("""
        INSERT INTO audit_trail
            (run_id, event_type, agent_name, prev_state_hash, curr_state_hash, payload, actor, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (run_id, event_type, agent_name, prev_hash, curr_hash,
          json.dumps(payload) if payload else None, actor, now))
    conn.commit()
    conn.close()


def log_guardrail_violation(run_id: str, direction: str, violation: dict):
    """Record guardrail violations for audit and telemetry."""
    now = get_now_ist()
    conn = _get_conn()
    conn.execute("""
        INSERT INTO guardrail_violations
            (run_id, direction, violation_type, severity, detail, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (run_id, direction, violation.get("type", "UNKNOWN"),
          violation.get("severity", "INFO"), violation.get("detail", ""), now))
    conn.commit()
    conn.close()


def get_recent_patches(limit: int = 15) -> list:
    conn = _get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM debug_patches ORDER BY id DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows


def get_audit_trail(run_id: str = None, limit: int = 20) -> list:
    conn = _get_conn()
    c = conn.cursor()
    if run_id:
        c.execute("SELECT * FROM audit_trail WHERE run_id = ? ORDER BY id DESC LIMIT ?", (run_id, limit))
    else:
        c.execute("SELECT * FROM audit_trail ORDER BY id DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows


def get_guardrail_violations(run_id: str = None, limit: int = 20) -> list:
    conn = _get_conn()
    c = conn.cursor()
    if run_id:
        c.execute("SELECT * FROM guardrail_violations WHERE run_id = ? ORDER BY id DESC LIMIT ?", (run_id, limit))
    else:
        c.execute("SELECT * FROM guardrail_violations ORDER BY id DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return rows
