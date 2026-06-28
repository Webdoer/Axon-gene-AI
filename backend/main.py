# backend/main.py
"""
FastAPI gateway for Axon gene AI (Enhanced).
Adds: eval suite runner, memory/audit APIs, guardrail telemetry, RBAC-aware HITL.
"""

import sys, os, uuid, asyncio, json
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend import database
from backend.orchestrator import run_pipeline
from backend.memory import (
    init_memory_db, get_recent_patches, get_audit_trail,
    get_guardrail_violations, recall_variant
)
from backend.eval_suite import EVAL_FIXTURES, run_eval_assertions
from backend.security import check_permission

app = FastAPI(
    title="Axon gene AI API Gateway",
    description="Production-ready multi-agent variant classification engine.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware, allow_origins=["*"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    database.init_db()
    init_memory_db()

# ─── Pydantic Schemas ───────────────────────────────────────────────────────
class AnalysisRequest(BaseModel):
    query: str

class HITLResponse(BaseModel):
    run_id: str
    decision: str          # APPROVED | OVERRIDDEN
    classification: str
    actor: str = "TECHNICIAN"
    rationale: str = ""

class EvalRunRequest(BaseModel):
    fixture_ids: list[str] = []   # empty = run all 20

# ─── Core Pipeline Endpoints ────────────────────────────────────────────────
@app.post("/api/analyze")
def start_analysis(request: AnalysisRequest, background_tasks: BackgroundTasks):
    query_clean = request.query.strip()
    if not query_clean:
        raise HTTPException(400, "Variant query cannot be empty.")
    run_id = f"run_{uuid.uuid4().hex[:12]}"
    database.create_run(run_id, query_clean)
    background_tasks.add_task(_run_bg, run_id)
    return {"success": True, "run_id": run_id, "status": "RUNNING",
            "message": f"Pipeline triggered for: {query_clean}"}

async def _run_bg(run_id: str):
    try:
        await run_pipeline(run_id)
    except Exception as e:
        database.update_run(run_id, status="FAILED")
        database.add_agent_log(run_id, "Orchestrator", "FAILED",
                                f"Critical loop failure: {str(e)}")

@app.get("/api/status/{run_id}")
def get_run_status(run_id: str):
    run = database.get_run(run_id)
    if not run:
        raise HTTPException(404, f"Run '{run_id}' not found.")
    logs = database.get_run_logs(run_id)
    audit = get_audit_trail(run_id)
    guardrail_events = get_guardrail_violations(run_id)
    return {"run": run, "logs": logs, "audit": audit, "guardrail_events": guardrail_events}

@app.post("/api/hitl/respond")
def submit_hitl(response: HITLResponse, background_tasks: BackgroundTasks):
    # RBAC check
    if not check_permission(response.actor, "hitl_respond"):
        raise HTTPException(403, f"Role '{response.actor}' is not authorised to respond to HITL gates.")
    run = database.get_run(response.run_id)
    if not run:
        raise HTTPException(404, "Run not found.")
    if run["status"] != "PAUSED_HITL":
        raise HTTPException(400, "Run is not in PAUSED_HITL state.")

    database.update_run(response.run_id, status="RUNNING",
                        hitl_state=response.decision,
                        final_classification=response.classification)
    database.add_agent_log(
        response.run_id, "PolicyAgent", "INFO",
        f"HITL decision '{response.decision}' from {response.actor}. "
        f"Classification: {response.classification}. Rationale: {response.rationale}"
    )
    background_tasks.add_task(_resume_bg, response.run_id,
                               response.classification, response.actor)
    return {"success": True, "run_id": response.run_id, "status": "RESUMED"}

async def _resume_bg(run_id: str, classification: str, actor: str):
    try:
        await run_pipeline(run_id, resume_classification=classification)
    except Exception as e:
        database.update_run(run_id, status="FAILED")
        database.add_agent_log(run_id, "Orchestrator", "FAILED",
                                f"Resume failure: {str(e)}")

@app.get("/api/variants")
def list_variants():
    return database.get_all_runs()

# ─── Enhanced Diagnostics ────────────────────────────────────────────────────
@app.get("/api/diagnostics")
def get_diagnostics():
    metrics = database.get_diagnostics_metrics()
    conn = database.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT run_id, agent_name, status, message, timestamp
        FROM agent_logs WHERE status IN ('ERROR','WARNING','FATAL','HEALED')
        ORDER BY id DESC LIMIT 15
    """)
    recent_events = [dict(r) for r in cursor.fetchall()]
    conn.close()

    patches = get_recent_patches(10)
    guardrail_events = get_guardrail_violations(limit=10)
    audit_entries = get_audit_trail(limit=10)

    return {
        "system_status": "OPERATIONAL",
        "cpu_usage_pct": 2.4,
        "ram_usage_pct": 42.1,
        "metrics": metrics,
        "recent_diagnostic_events": recent_events,
        "debug_patches": patches,
        "guardrail_violations": guardrail_events,
        "audit_trail": audit_entries,
    }

# ─── Memory / Audit APIs ────────────────────────────────────────────────────
@app.get("/api/memory/recall")
def recall(hgvs_c: str = Query(...), gene: str = Query(...)):
    """Cross-session semantic recall for a variant fingerprint."""
    result = recall_variant(hgvs_c, gene)
    if result:
        return {"found": True, "record": result}
    return {"found": False, "record": None}

@app.get("/api/memory/audit")
def get_audit(run_id: str = Query(None), limit: int = 30):
    return get_audit_trail(run_id, limit)

@app.get("/api/memory/patches")
def get_patches(limit: int = 20):
    return get_recent_patches(limit)

@app.get("/api/memory/guardrails")
def get_guardrails(run_id: str = Query(None), limit: int = 20):
    return get_guardrail_violations(run_id, limit)

# ─── Evaluation Suite ───────────────────────────────────────────────────────
@app.get("/api/eval/fixtures")
def list_fixtures():
    """Return all 20 evaluation fixtures."""
    return [
        {
            "id": f.id, "category": f.category, "query": f.query,
            "gene": f.gene, "hgvs_c": f.hgvs_c, "hgvs_p": f.hgvs_p,
            "expected_classification": f.expected_classification,
            "expect_hitl": f.expect_hitl, "expect_conflict": f.expect_conflict,
            "min_confidence": f.min_confidence, "max_confidence": f.max_confidence,
            "description": f.description,
        }
        for f in EVAL_FIXTURES
    ]

@app.post("/api/eval/run")
def run_eval_suite(request: EvalRunRequest, background_tasks: BackgroundTasks):
    """
    Trigger evaluation runs for specified fixture IDs (or all 20 if empty).
    Each fixture spawns a separate pipeline run.
    """
    from backend.eval_suite import get_fixture_by_id
    targets = request.fixture_ids or [f.id for f in EVAL_FIXTURES]
    spawned = []

    for fid in targets:
        fixture = get_fixture_by_id(fid)
        if not fixture:
            continue
        run_id = f"eval_{fid.lower()}_{uuid.uuid4().hex[:6]}"
        database.create_run(run_id, fixture.query)
        background_tasks.add_task(_run_bg, run_id)
        spawned.append({"fixture_id": fid, "run_id": run_id, "query": fixture.query})

    return {
        "success": True,
        "spawned": spawned,
        "total": len(spawned),
        "message": f"Evaluation suite triggered: {len(spawned)} fixture run(s) queued."
    }

# ─── Static Frontend ────────────────────────────────────────────────────────
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
for d in [static_dir, os.path.join(static_dir, "css"), os.path.join(static_dir, "js")]:
    os.makedirs(d, exist_ok=True)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def read_index():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Axon gene AI v2 API running. Static files initializing."}
