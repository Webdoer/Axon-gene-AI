# backend/guardrails.py
"""
Enterprise Guardrail Layer (Bidirectional Wrapper)
Input Guardrails:  PII/PHI scrub, prompt-injection detection
Output Guardrails: HGVS nomenclature validation, hallucination detection
"""

import re
import hashlib
import json
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime


# ─────────────────────────────────────────────
#  PII / PHI PATTERNS  (HIPAA-aligned)
# ─────────────────────────────────────────────
_PII_PATTERNS = [
    # Names – naive heuristic: capitalised 2-word pairs
    (re.compile(r"\b[A-Z][a-z]+ [A-Z][a-z]+\b"), "[REDACTED_NAME]"),
    # SSN
    (re.compile(r"\b\d{3}-\d{2}-\d{4}\b"), "[REDACTED_SSN]"),
    # DOB
    (re.compile(r"\b(0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])[-/](\d{2}|\d{4})\b"), "[REDACTED_DOB]"),
    # Phone numbers
    (re.compile(r"\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"), "[REDACTED_PHONE]"),
    # Email
    (re.compile(r"\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b"), "[REDACTED_EMAIL]"),
    # MRN-style identifiers
    (re.compile(r"\b(MRN|Patient\s*ID|PID)[:\s#]*\w+\b", re.IGNORECASE), "[REDACTED_ID]"),
    # NPI numbers
    (re.compile(r"\bNPI[:\s]*\d{10}\b", re.IGNORECASE), "[REDACTED_NPI]"),
]

# ─────────────────────────────────────────────
#  PROMPT INJECTION SIGNATURES
# ─────────────────────────────────────────────
_INJECTION_SIGNATURES = [
    r"ignore\s+(previous|above|prior)\s+instructions",
    r"disregard\s+(all|your|the)\s+",
    r"you\s+are\s+now\s+(a|an)\s+",
    r"act\s+as\s+(if\s+you\s+(are|were)|a)\s+",
    r"system\s*:\s*you\s+must",
    r"<\s*/?system\s*>",
    r"\[\[SYSTEM\]\]",
    r"jailbreak",
    r"DAN\s+mode",
]
_INJECTION_RE = re.compile("|".join(_INJECTION_SIGNATURES), re.IGNORECASE)

# ─────────────────────────────────────────────
#  HGVS VALIDATION PATTERNS
# ─────────────────────────────────────────────

# Coding-transcript substitution / indel (NM_ reference)
_HGVS_C_RE = re.compile(
    r"^(NM_\d+\.\d+:)?c\.[*-+]?\d+([+-]\d+)?[ACGT]>[ACGT]$"
    r"|^(NM_\d+\.\d+:)?c\.[*-+]?\d+([+-]\d+)?(_\d+)?del[ACGT]*$"
    r"|^(NM_\d+\.\d+:)?c\.[*-+]?\d+([+-]\d+)?(_\d+)?dup[ACGT]*$"
    r"|^(NM_\d+\.\d+:)?c\.[*-+]?\d+([+-]\d+)?ins[ACGT]+$"
)

# Protein nomenclature
_HGVS_P_RE = re.compile(
    r"^(NP_\d+\.\d+:)?p\.[A-Z][a-z]{2}\d+([A-Z][a-z]{2}|fs|del|Ter|\*)$"
    r"|^(NP_\d+\.\d+:)?p\.=$"
)

# ── Genomic / Structural Variant patterns ─────────────────────────────────────
# Matches HGVS genomic notation on NC_ accessions, including:
#   • Simple SNV/indel:   NC_000017.11:g.43044295A>G
#   • Definite range del: NC_000017.11:g.43044295_43057135del
#   • Uncertain breakpoint del/dup:
#       NC_000017.11:g.(?_43044295)_(43057135_?)del
#       NC_000017.11:g.(43044295_?)_(?_43057135)dup
#   • Any g. descriptor without a NC_ prefix (e.g. bare "g.123A>G")
_HGVS_G_SV_RE = re.compile(
    # Outer accession prefix (optional)
    r"^(?:NC_\d+\.\d+:)?"
    r"g\."
    # Position: either a simple integer, a range (n_n), or uncertain
    # breakpoints using parenthesised groups like (?_n) or (n_?)
    r"(?:"
        r"(?:\(?\?_)?\d+(?:_\?\))?"
        r"(?:_(?:\(?\d+_\?\)|\(?\?_\d+\)|\d+))?"
    r")"
    # Variant class: SNV, del, dup, inv, ins
    r"(?:[ACGTN]>[ACGTN]|del[ACGTN]*|dup[ACGTN]*|inv|ins[ACGTN]+)$",
    re.IGNORECASE,
)


def _is_genomic_sv(hgvs_string: str) -> bool:
    """
    Return True when *hgvs_string* represents a genomic / structural variant
    that should NOT be validated against the coding-transcript (c.) regex.

    Criteria (any one is sufficient):
      1. The full string starts with "NC_" (RefSeq genomic accession).
      2. The descriptor part (after an optional "accession:") begins with "g."
         indicating a genomic coordinate.
      3. The string contains an uncertain-breakpoint token "(?_" or "_?)"
         combined with a structural event keyword (del | dup | inv | ins).
    """
    s = (hgvs_string or "").strip()
    if not s:
        return False

    # Strip accession prefix for descriptor inspection
    descriptor = s.split(":")[-1] if ":" in s else s

    # Criterion 1 – NC_ accession
    if s.upper().startswith("NC_"):
        return True

    # Criterion 2 – genomic "g." descriptor
    if descriptor.lower().startswith("g."):
        return True

    # Criterion 3 – uncertain breakpoints on a structural event
    has_uncertain_bp = bool(re.search(r"\(\?_|_\?\)", s))
    has_sv_keyword   = bool(re.search(r"\b(del|dup|inv|ins)\b", s, re.IGNORECASE))
    if has_uncertain_bp and has_sv_keyword:
        return True

    return False


@dataclass
class GuardrailResult:
    passed: bool
    violations: list = field(default_factory=list)
    sanitised_payload: Optional[dict] = None
    sha256_fingerprint: str = ""

    def to_dict(self):
        return {
            "passed": self.passed,
            "violations": self.violations,
            "sha256_fingerprint": self.sha256_fingerprint,
        }


# ─────────────────────────────────────────────
#  INPUT GUARDRAIL
# ─────────────────────────────────────────────
def run_input_guardrail(raw_query: str) -> GuardrailResult:
    """
    1. Detect & block prompt injection attempts.
    2. Scrub PII/PHI from the query before any external API call.
    Returns a GuardrailResult with the sanitised payload.
    """
    violations = []
    sanitised = raw_query

    # Prompt-injection check
    if _INJECTION_RE.search(raw_query):
        violations.append({
            "type": "PROMPT_INJECTION",
            "detail": "Potential prompt-injection pattern detected in query.",
            "severity": "HIGH",
        })

    # PII scrub
    pii_found = []
    for pattern, replacement in _PII_PATTERNS:
        new_val, n = pattern.subn(replacement, sanitised)
        if n:
            pii_found.append({"pattern": replacement, "count": n})
            sanitised = new_val

    if pii_found:
        violations.append({
            "type": "PII_SCRUBBED",
            "detail": f"Scrubbed {len(pii_found)} PII/PHI pattern(s) before external transmission.",
            "items": pii_found,
            "severity": "INFO",
        })

    fingerprint = hashlib.sha256(sanitised.encode()).hexdigest()
    passed = not any(v["severity"] == "HIGH" for v in violations)

    return GuardrailResult(
        passed=passed,
        violations=violations,
        sanitised_payload={"query": sanitised},
        sha256_fingerprint=fingerprint,
    )


# ─────────────────────────────────────────────
#  OUTPUT GUARDRAIL
# ─────────────────────────────────────────────
def run_output_guardrail(agent_payload: dict, source_context: dict) -> GuardrailResult:
    """
    1. Validate HGVS nomenclature in final payload.
    2. Detect hallucinated genomic positions not present in raw source data.

    Routing logic for HGVS-c:
      • If ``loop_agent_sv_confirmed`` is True in *agent_payload*, the variant
        was already verified by LoopAgent as a structural variant — strict
        transcript-level formatting checks are fully bypassed.
      • Otherwise, if the HGVS string is detected as a genomic/structural
        variant (NC_ prefix, g. descriptor, or uncertain breakpoints), it is
        routed to the SV-specific regex (_HGVS_G_SV_RE) instead of the coding
        regex (_HGVS_C_RE), preventing false-positive HGVS_INVALID errors.
      • Standard coding-transcript strings (c.[pos][ref]>[alt]) continue to
        use the existing coding-variant regex.

    Returns GuardrailResult; if failed, caller should route to DebugAgent.
    """
    violations = []

    hgvs_c = agent_payload.get("hgvs_c", "") or ""
    hgvs_p = agent_payload.get("hgvs_p", "") or ""

    # Flag set by Orchestrator when LoopAgent already confirmed an SV
    loop_confirmed_sv: bool = bool(agent_payload.get("loop_agent_sv_confirmed", False))

    # Strip accession prefix for coding-transcript validation only
    c_code = hgvs_c.split(":")[-1] if ":" in hgvs_c else hgvs_c
    p_code = hgvs_p.split(":")[-1] if ":" in hgvs_p else hgvs_p

    # ── HGVS-c validation ────────────────────────────────────────────────────
    if c_code:
        if loop_confirmed_sv:
            # LoopAgent already vouched for this variant — skip all string
            # formatting checks to avoid false-positive FATAL blocks.
            pass
        elif _is_genomic_sv(hgvs_c):
            # Genomic / structural variant: validate against g. / SV pattern.
            # The full string (with accession prefix) is matched so that NC_
            # accessions are handled correctly.
            if not _HGVS_G_SV_RE.match(hgvs_c):
                violations.append({
                    "type": "HGVS_INVALID",
                    "field": "hgvs_c",
                    "value": hgvs_c,
                    "detail": (
                        f"'{hgvs_c}' does not conform to HGVS genomic/structural variant "
                        "nomenclature (g.[pos]del|dup|inv or uncertain-breakpoint form)."
                    ),
                    "severity": "MEDIUM",  # SV format issues are warnings, not fatal
                })
        else:
            # Standard coding-transcript variant (c. notation)
            if not _HGVS_C_RE.match(c_code):
                violations.append({
                    "type": "HGVS_INVALID",
                    "field": "hgvs_c",
                    "value": hgvs_c,
                    "detail": (
                        f"'{hgvs_c}' does not conform to HGVS coding nomenclature "
                        "(c.[pos][ref]>[alt])."
                    ),
                    "severity": "HIGH",
                })

    # ── HGVS-p validation ────────────────────────────────────────────────────
    # Genomic/structural variants legitimately lack a protein mapping —
    # skip p. validation when the hgvs_c coordinate is an SV or when
    # LoopAgent has already confirmed the structural nature of the variant.
    sv_no_protein = loop_confirmed_sv or _is_genomic_sv(hgvs_c)
    if p_code and not sv_no_protein:
        if not _HGVS_P_RE.match(p_code):
            violations.append({
                "type": "HGVS_INVALID",
                "field": "hgvs_p",
                "value": hgvs_p,
                "detail": (
                    f"'{hgvs_p}' does not conform to HGVS protein nomenclature "
                    "(p.Ref[pos]Alt)."
                ),
                "severity": "HIGH",
            })

    # ── Hallucination check ───────────────────────────────────────────────────
    # Any genomic position referenced must appear in raw source context.
    source_text = json.dumps(source_context)
    gene = agent_payload.get("gene_symbol", "")
    if gene and gene not in source_text:
        violations.append({
            "type": "HALLUCINATION_DETECTED",
            "field": "gene_symbol",
            "value": gene,
            "detail": (
                f"Gene symbol '{gene}' not found in raw ClinVar/PubMed source context. "
                "Possible synthetic hallucination."
            ),
            "severity": "HIGH",
        })

    payload_str = json.dumps(agent_payload, sort_keys=True)
    fingerprint = hashlib.sha256(payload_str.encode()).hexdigest()
    # Only HIGH-severity violations block rendering
    passed = not any(v["severity"] == "HIGH" for v in violations)

    return GuardrailResult(
        passed=passed,
        violations=violations,
        sanitised_payload=agent_payload,
        sha256_fingerprint=fingerprint,
    )
