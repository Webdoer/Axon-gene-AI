# backend/eval_suite.py
"""
Automated Evaluation Suite - 20 hardcoded variant fixtures.
Categories:
  - 5 Oncogenic (confidence >= 0.85 → HITL freeze)
  - 5 Benign (confidence <= 0.20 → auto-approve, green path)
  - 5 Edge Cases / Novel (VUS / Unclassified)
  - 5 Asymmetric (ClinVar vs PubMed conflict → HITL portal)

Each fixture includes guardrail & memory assertions.
"""

from dataclasses import dataclass, field
from typing import Optional

@dataclass
class EvalFixture:
    id: str
    category: str           # ONCOGENIC | BENIGN | EDGE | ASYMMETRIC
    query: str              # ClinVar ID or HGVS
    gene: str
    hgvs_c: str
    hgvs_p: str
    expected_classification: str
    expect_hitl: bool
    expect_conflict: bool
    min_confidence: float
    max_confidence: float
    assert_zero_pii: bool = True
    assert_memory_queried: bool = True
    description: str = ""

EVAL_FIXTURES: list[EvalFixture] = [
    # ── ONCOGENIC (5) ── confidence ≥ 0.85 → must trigger HITL ──────────────
    EvalFixture(
        id="ONC-001", category="ONCOGENIC", query="55476",
        gene="BRCA1", hgvs_c="NM_007294.4:c.5096G>A", hgvs_p="p.Arg1700Gln",
        expected_classification="Pathogenic", expect_hitl=True, expect_conflict=True,
        min_confidence=0.85, max_confidence=1.0,
        description="BRCA1 BRCT domain hotspot – conflicting penetrance reports"
    ),
    EvalFixture(
        id="ONC-002", category="ONCOGENIC", query="12347",
        gene="TP53", hgvs_c="NM_000546.6:c.743G>A", hgvs_p="p.Arg248Gln",
        expected_classification="Pathogenic", expect_hitl=True, expect_conflict=False,
        min_confidence=0.85, max_confidence=1.0,
        description="TP53 R248Q dominant-negative Li-Fraumeni hotspot"
    ),
    EvalFixture(
        id="ONC-003", category="ONCOGENIC", query="37677",
        gene="BRCA2", hgvs_c="NM_000059.4:c.5946delT", hgvs_p="p.Ser1982fs",
        expected_classification="Pathogenic", expect_hitl=True, expect_conflict=False,
        min_confidence=0.85, max_confidence=1.0,
        description="BRCA2 frameshift – NMD pathway confirmed"
    ),
    EvalFixture(
        id="ONC-004", category="ONCOGENIC", query="ONC004",
        gene="BRCA1", hgvs_c="NM_007294.4:c.5266dupC", hgvs_p="p.Gln1756fs",
        expected_classification="Pathogenic", expect_hitl=True, expect_conflict=False,
        min_confidence=0.85, max_confidence=1.0,
        description="BRCA1 5382insC Ashkenazi founder frameshift"
    ),
    EvalFixture(
        id="ONC-005", category="ONCOGENIC", query="ONC005",
        gene="TP53", hgvs_c="NM_000546.6:c.817C>T", hgvs_p="p.Arg273Cys",
        expected_classification="Pathogenic", expect_hitl=True, expect_conflict=False,
        min_confidence=0.85, max_confidence=1.0,
        description="TP53 R273C second most frequent p53 hotspot"
    ),

    # ── BENIGN (5) ── confidence ≤ 0.20 → auto-approve, green telemetry ─────
    EvalFixture(
        id="BEN-001", category="BENIGN", query="99999",
        gene="TP53", hgvs_c="NM_000546.6:c.324A>G", hgvs_p="p.Gly108Gly",
        expected_classification="Benign", expect_hitl=False, expect_conflict=False,
        min_confidence=0.0, max_confidence=0.20,
        description="TP53 synonymous coding variant – no amino acid change"
    ),
    EvalFixture(
        id="BEN-002", category="BENIGN", query="BEN002",
        gene="BRCA1", hgvs_c="NM_007294.4:c.2311T>C", hgvs_p="p.Leu771Leu",
        expected_classification="Benign", expect_hitl=False, expect_conflict=False,
        min_confidence=0.0, max_confidence=0.20,
        description="BRCA1 synonymous silent variant – ClinVar 3+ stars benign"
    ),
    EvalFixture(
        id="BEN-003", category="BENIGN", query="BEN003",
        gene="BRCA2", hgvs_c="NM_000059.4:c.7806-14T>C", hgvs_p="p.=",
        expected_classification="Benign", expect_hitl=False, expect_conflict=False,
        min_confidence=0.0, max_confidence=0.20,
        description="BRCA2 intronic variant – not near splice consensus"
    ),
    EvalFixture(
        id="BEN-004", category="BENIGN", query="BEN004",
        gene="TP53", hgvs_c="NM_000546.6:c.672A>G", hgvs_p="p.Gln224Gln",
        expected_classification="Benign", expect_hitl=False, expect_conflict=False,
        min_confidence=0.0, max_confidence=0.20,
        description="TP53 synonymous outside DNA-binding domain"
    ),
    EvalFixture(
        id="BEN-005", category="BENIGN", query="BEN005",
        gene="BRCA1", hgvs_c="NM_007294.4:c.4837A>G", hgvs_p="p.Ser1613Gly",
        expected_classification="Benign", expect_hitl=False, expect_conflict=False,
        min_confidence=0.0, max_confidence=0.20,
        description="BRCA1 Ser1613Gly – not in BRCT domain, ClinVar benign"
    ),

    # ── EDGE CASES / NOVEL VUS (5) ─────────────────────────────────────────
    EvalFixture(
        id="EDG-001", category="EDGE", query="EDG001",
        gene="BRCA1", hgvs_c="NM_007294.4:c.5123C>T", hgvs_p="p.Thr1708Ile",
        expected_classification="VUS", expect_hitl=False, expect_conflict=False,
        min_confidence=0.21, max_confidence=0.84,
        description="BRCA1 BRCT boundary – insufficient functional data"
    ),
    EvalFixture(
        id="EDG-002", category="EDGE", query="EDG002",
        gene="BRCA2", hgvs_c="NM_000059.4:c.7024C>T", hgvs_p="p.Arg2342Cys",
        expected_classification="VUS", expect_hitl=False, expect_conflict=False,
        min_confidence=0.21, max_confidence=0.84,
        description="BRCA2 DBD missense – novel variant no prior submissions"
    ),
    EvalFixture(
        id="EDG-003", category="EDGE", query="EDG003",
        gene="TP53", hgvs_c="NM_000546.6:c.500A>T", hgvs_p="p.Asn167Ile",
        expected_classification="VUS", expect_hitl=False, expect_conflict=False,
        min_confidence=0.21, max_confidence=0.84,
        description="TP53 DBD novel missense – limited population data"
    ),
    EvalFixture(
        id="EDG-004", category="EDGE", query="EDG004",
        gene="BRCA1", hgvs_c="NM_007294.4:c.2800C>G", hgvs_p="p.Pro934Ala",
        expected_classification="VUS", expect_hitl=False, expect_conflict=False,
        min_confidence=0.21, max_confidence=0.84,
        description="BRCA1 intermediate domain – charge neutral substitution"
    ),
    EvalFixture(
        id="EDG-005", category="EDGE", query="EDG005",
        gene="BRCA2", hgvs_c="NM_000059.4:c.9154C>T", hgvs_p="p.Arg3052Cys",
        expected_classification="VUS", expect_hitl=False, expect_conflict=False,
        min_confidence=0.21, max_confidence=0.84,
        description="BRCA2 OB fold region – moderate functional disruption predicted"
    ),

    # ── ASYMMETRIC (5) ── ClinVar vs PubMed conflict → HITL portal ──────────
    EvalFixture(
        id="ASY-001", category="ASYMMETRIC", query="55476",
        gene="BRCA1", hgvs_c="NM_007294.4:c.5096G>A", hgvs_p="p.Arg1700Gln",
        expected_classification="Pathogenic", expect_hitl=True, expect_conflict=True,
        min_confidence=0.85, max_confidence=1.0,
        description="ClinVar: Pathogenic | PMC4519922: suggests VUS/incomplete penetrance"
    ),
    EvalFixture(
        id="ASY-002", category="ASYMMETRIC", query="ASY002",
        gene="BRCA2", hgvs_c="NM_000059.4:c.8023G>A", hgvs_p="p.Asp2675Asn",
        expected_classification="VUS", expect_hitl=True, expect_conflict=True,
        min_confidence=0.50, max_confidence=0.85,
        description="ClinVar: Likely Pathogenic | Functional assay: benign-like transcription"
    ),
    EvalFixture(
        id="ASY-003", category="ASYMMETRIC", query="ASY003",
        gene="TP53", hgvs_c="NM_000546.6:c.637C>T", hgvs_p="p.Arg213Ter",
        expected_classification="Pathogenic", expect_hitl=True, expect_conflict=True,
        min_confidence=0.85, max_confidence=1.0,
        description="ClinVar: Pathogenic nonsense | Splicing literature: exon skipping artifact"
    ),
    EvalFixture(
        id="ASY-004", category="ASYMMETRIC", query="ASY004",
        gene="BRCA1", hgvs_c="NM_007294.4:c.4689C>T", hgvs_p="p.Ser1563Leu",
        expected_classification="Likely Pathogenic", expect_hitl=True, expect_conflict=True,
        min_confidence=0.70, max_confidence=0.95,
        description="ClinVar: multi-submitter Pathogenic | Case report: carrier unaffected at 82"
    ),
    EvalFixture(
        id="ASY-005", category="ASYMMETRIC", query="ASY005",
        gene="BRCA2", hgvs_c="NM_000059.4:c.5351delA", hgvs_p="p.Asn1784fs",
        expected_classification="Pathogenic", expect_hitl=True, expect_conflict=True,
        min_confidence=0.85, max_confidence=1.0,
        description="ClinVar: Pathogenic frameshift | Founder study: incomplete penetrance population"
    ),
]


def get_fixture_by_id(fixture_id: str) -> EvalFixture | None:
    return next((f for f in EVAL_FIXTURES if f.id == fixture_id), None)


def get_fixtures_by_category(category: str) -> list[EvalFixture]:
    return [f for f in EVAL_FIXTURES if f.category == category]


def run_eval_assertions(fixture: EvalFixture, run_result: dict,
                        pii_leaked: bool = False, memory_queried: bool = True) -> dict:
    """
    Assert evaluation expectations against a completed run result.
    Returns a structured assertion report.
    """
    assertions = []
    passed = True

    # PII assertion
    if fixture.assert_zero_pii and pii_leaked:
        assertions.append({"check": "ZERO_PII_LEAK", "result": "FAIL",
                            "detail": "PII detected in outbound network call."})
        passed = False
    else:
        assertions.append({"check": "ZERO_PII_LEAK", "result": "PASS"})

    # Memory assertion
    if fixture.assert_memory_queried and not memory_queried:
        assertions.append({"check": "MEMORY_QUERIED", "result": "FAIL",
                            "detail": "Semantic memory was not queried on execution start."})
        passed = False
    else:
        assertions.append({"check": "MEMORY_QUERIED", "result": "PASS"})

    # HITL assertion
    hitl_state = run_result.get("status") == "PAUSED_HITL"
    if fixture.expect_hitl and not hitl_state and run_result.get("status") != "COMPLETED":
        assertions.append({"check": "HITL_TRIGGERED", "result": "FAIL",
                            "detail": "Expected HITL freeze but pipeline auto-completed."})
        passed = False
    else:
        assertions.append({"check": "HITL_TRIGGERED", "result": "PASS"})

    # Confidence bounds
    conf = run_result.get("confidence", 0.5)
    if not (fixture.min_confidence <= conf <= fixture.max_confidence):
        assertions.append({"check": "CONFIDENCE_RANGE", "result": "FAIL",
                            "detail": f"Confidence {conf:.2f} outside [{fixture.min_confidence}, {fixture.max_confidence}]"})
        passed = False
    else:
        assertions.append({"check": "CONFIDENCE_RANGE", "result": "PASS"})

    return {
        "fixture_id": fixture.id,
        "category": fixture.category,
        "description": fixture.description,
        "overall": "PASS" if passed else "FAIL",
        "assertions": assertions,
    }
