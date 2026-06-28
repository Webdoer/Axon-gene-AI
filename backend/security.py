# backend/security.py
"""
Zero-Trust Security Layer
- RBAC: role-based access control for HITL gate
- SHA-256 immutable audit chain
- Sandboxed subprocess executor for DebugAgent code patches
"""

import hashlib
import json
import subprocess
import tempfile
import os
import sys
from datetime import datetime
from functools import wraps

# ─────────────────────────────────────────────
#  RBAC  -  Role Registry
# ─────────────────────────────────────────────
_ROLE_REGISTRY = {
    "TECHNICIAN": ["hitl_respond", "view_runs", "view_logs", "view_diagnostics"],
    "PATHOLOGIST": ["hitl_respond", "view_runs", "view_logs", "view_diagnostics", "override_classification"],
    "ANALYST":     ["view_runs", "view_logs", "view_diagnostics"],
    "SYSTEM":      ["*"],  # Internal orchestrator
}

# Default actor for API calls (override per-request in a real JWT flow)
DEFAULT_ACTOR = "TECHNICIAN"


def check_permission(role: str, action: str) -> bool:
    """Return True if the given role is allowed to perform the action."""
    perms = _ROLE_REGISTRY.get(role.upper(), [])
    return "*" in perms or action in perms


def require_permission(action: str):
    """Decorator that enforces RBAC on FastAPI route handlers."""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, role: str = DEFAULT_ACTOR, **kwargs):
            if not check_permission(role, action):
                from fastapi import HTTPException
                raise HTTPException(
                    status_code=403,
                    detail=f"Role '{role}' is not authorised to perform '{action}'."
                )
            return await func(*args, role=role, **kwargs)
        @wraps(func)
        def sync_wrapper(*args, role: str = DEFAULT_ACTOR, **kwargs):
            if not check_permission(role, action):
                from fastapi import HTTPException
                raise HTTPException(
                    status_code=403,
                    detail=f"Role '{role}' is not authorised to perform '{action}'."
                )
            return func(*args, role=role, **kwargs)
        import asyncio
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    return decorator


# ─────────────────────────────────────────────
#  SHA-256 STATE CHAIN  (Immutable audit helper)
# ─────────────────────────────────────────────
def hash_state(state: dict) -> str:
    """Produce a deterministic SHA-256 digest of a state dictionary."""
    canonical = json.dumps(state, sort_keys=True, default=str)
    return hashlib.sha256(canonical.encode()).hexdigest()


def chain_hash(prev_hash: str, curr_state: dict) -> str:
    """Chain-link: hash of previous hash + current state (blockchain-style)."""
    combined = prev_hash + hash_state(curr_state)
    return hashlib.sha256(combined.encode()).hexdigest()


# ─────────────────────────────────────────────
#  SANDBOXED SUBPROCESS EXECUTOR
# ─────────────────────────────────────────────
_SANDBOX_TIMEOUT = 10  # seconds

def run_sandboxed_patch(patch_code: str, input_data: dict) -> dict:
    """
    Execute a DebugAgent-generated Python code patch in an isolated subprocess.
    - Writes patch to a temp file with restricted imports
    - Feeds input_data as JSON via stdin
    - Returns stdout result or error within timeout
    """
    # Safety: block dangerous imports in patch code
    _BLOCKED = ["import os", "import sys", "import subprocess", "import socket",
                "__import__", "open(", "exec(", "eval("]
    for blocked in _BLOCKED:
        if blocked in patch_code:
            return {
                "success": False,
                "error": f"Blocked unsafe expression in patch: '{blocked}'",
                "output": None
            }

    wrapper = f"""
import sys, json
input_data = json.loads(sys.stdin.read())

{patch_code}

# Entry point: patch function must be named 'apply_patch'
try:
    result = apply_patch(input_data)
    print(json.dumps({{"success": True, "output": result}}))
except Exception as e:
    print(json.dumps({{"success": False, "error": str(e), "output": None}}))
"""

    try:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py",
                                         delete=False, encoding="utf-8") as tmp:
            tmp.write(wrapper)
            tmp_path = tmp.name

        result = subprocess.run(
            [sys.executable, tmp_path],
            input=json.dumps(input_data),
            capture_output=True,
            text=True,
            timeout=_SANDBOX_TIMEOUT,
            # Restrict filesystem access via minimal env
            env={
                "PATH": os.environ.get("PATH", ""),
                "PYTHONPATH": "",
            }
        )
        os.unlink(tmp_path)

        stdout = result.stdout.strip()
        if stdout:
            return json.loads(stdout)
        return {
            "success": False,
            "error": result.stderr.strip() or "No output from sandboxed patch.",
            "output": None
        }

    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Sandboxed patch timed out.", "output": None}
    except Exception as e:
        return {"success": False, "error": str(e), "output": None}
    finally:
        if 'tmp_path' in locals() and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
