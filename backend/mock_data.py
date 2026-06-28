# backend/mock_data.py
"""
Mock database and remote cache for ClinVar (JSON) and PubMed (full-text HTML/XML) e-utilities.
Provides robust offline fallbacks and realistic test data for key variants.
"""

CLINVAR_MOCK_DATA = {
    # BRCA1 c.5096G>A (p.Arg1700Gln)
    "55476": {
        "uid": "55476",
        "title": "NM_007294.4(BRCA1):c.5096G>A (p.Arg1700Gln)",
        "gene": {"symbol": "BRCA1", "id": "672"},
        "hgvs": {
            "genomic": "NC_000017.11:g.43045678G>A",
            "coding": "NM_007294.4:c.5096G>A",
            "protein": "NP_007205.1:p.Arg1700Gln"
        },
        "clinical_significance": {
            "description": "Pathogenic/Likely Pathogenic",
            "last_evaluated": "2025-10-15",
            "review_status": "criteria provided, conflicting interpretations"
        },
        "statistics": {
            "submissions": 12,
            "pathogenic_count": 9,
            "vus_count": 3
        },
        "citations": ["PMC3012455", "PMC4519922"]
    },
    # BRCA2 c.5946delT (p.Ser1982fs)
    "37677": {
        "uid": "37677",
        "title": "NM_000059.4(BRCA2):c.5946delT (p.Ser1982fs)",
        "gene": {"symbol": "BRCA2", "id": "675"},
        "hgvs": {
            "genomic": "NC_000013.11:g.32338274delT",
            "coding": "NM_000059.4:c.5946delT",
            "protein": "NP_000050.2:p.Ser1982fs"
        },
        "clinical_significance": {
            "description": "Pathogenic",
            "last_evaluated": "2026-01-20",
            "review_status": "reviewed by expert panel"
        },
        "statistics": {
            "submissions": 45,
            "pathogenic_count": 45,
            "vus_count": 0
        },
        "citations": ["PMC1234567"]
    },
    # TP53 c.743G>A (p.Arg248Gln)
    "12347": {
        "uid": "12347",
        "title": "NM_000546.6(TP53):c.743G>A (p.Arg248Gln)",
        "gene": {"symbol": "TP53", "id": "7157"},
        "hgvs": {
            "genomic": "NC_000017.11:g.7675088C>T",
            "coding": "NM_000546.6:c.743G>A",
            "protein": "NP_000537.3:p.Arg248Gln"
        },
        "clinical_significance": {
            "description": "Pathogenic",
            "last_evaluated": "2025-12-01",
            "review_status": "reviewed by expert panel"
        },
        "statistics": {
            "submissions": 89,
            "pathogenic_count": 89,
            "vus_count": 0
        },
        "citations": ["PMC5678901", "PMC9988776"]
    },
    # TP53 c.324A>G (p.Gly108Gly)
    "99999": {
        "uid": "99999",
        "title": "NM_000546.6(TP53):c.324A>G (p.Gly108Gly)",
        "gene": {"symbol": "TP53", "id": "7157"},
        "hgvs": {
            "genomic": "NC_000017.11:g.7676100T>C",
            "coding": "NM_000546.6:c.324A>G",
            "protein": "NP_000537.3:p.Gly108Gly"
        },
        "clinical_significance": {
            "description": "Benign",
            "last_evaluated": "2025-08-11",
            "review_status": "criteria provided, single submitter"
        },
        "statistics": {
            "submissions": 3,
            "pathogenic_count": 0,
            "vus_count": 0
        },
        "citations": []
    },
    # BRCA1 c.5266dupC (p.Gln1756fs) - ONC-004
    "ONC004": {
        "uid": "ONC004",
        "title": "NM_007294.4(BRCA1):c.5266dupC (p.Gln1756fs)",
        "gene": {"symbol": "BRCA1", "id": "672"},
        "hgvs": {
            "genomic": "NC_000017.11:g.43044295dupC",
            "coding": "NM_007294.4:c.5266dupC",
            "protein": "NP_007205.1:p.Gln1756fs"
        },
        "clinical_significance": {
            "description": "Pathogenic",
            "last_evaluated": "2025-11-20",
            "review_status": "reviewed by expert panel"
        },
        "statistics": {
            "submissions": 56,
            "pathogenic_count": 56,
            "vus_count": 0
        },
        "citations": ["PMC1234567"]
    },
    # TP53 c.817C>T (p.Arg273Cys) - ONC-005
    "ONC005": {
        "uid": "ONC005",
        "title": "NM_000546.6(TP53):c.817C>T (p.Arg273Cys)",
        "gene": {"symbol": "TP53", "id": "7157"},
        "hgvs": {
            "genomic": "NC_000017.11:g.7673803G>A",
            "coding": "NM_000546.6:c.817C>T",
            "protein": "NP_000537.3:p.Arg273Cys"
        },
        "clinical_significance": {
            "description": "Pathogenic",
            "last_evaluated": "2025-12-05",
            "review_status": "reviewed by expert panel"
        },
        "statistics": {
            "submissions": 120,
            "pathogenic_count": 120,
            "vus_count": 0
        },
        "citations": ["PMC5678901"]
    },
    # BRCA1 c.2311T>C (p.Leu771Leu) - BEN-002
    "BEN002": {
        "uid": "BEN002",
        "title": "NM_007294.4(BRCA1):c.2311T>C (p.Leu771Leu)",
        "gene": {"symbol": "BRCA1", "id": "672"},
        "hgvs": {
            "genomic": "NC_000017.11:g.43094892A>G",
            "coding": "NM_007294.4:c.2311T>C",
            "protein": "NP_007205.1:p.Leu771Leu"
        },
        "clinical_significance": {
            "description": "Benign",
            "last_evaluated": "2025-09-10",
            "review_status": "reviewed by expert panel"
        },
        "statistics": {
            "submissions": 18,
            "pathogenic_count": 0,
            "vus_count": 0
        },
        "citations": []
    },
    # BRCA2 c.7806-14T>C (p.=) - BEN-003
    "BEN003": {
        "uid": "BEN003",
        "title": "NM_000059.4(BRCA2):c.7806-14T>C (p.=)",
        "gene": {"symbol": "BRCA2", "id": "675"},
        "hgvs": {
            "genomic": "NC_000013.11:g.32363294A>G",
            "coding": "NM_000059.4:c.7806-14T>C",
            "protein": "p.="
        },
        "clinical_significance": {
            "description": "Benign",
            "last_evaluated": "2025-08-05",
            "review_status": "criteria provided, multiple submitters"
        },
        "statistics": {
            "submissions": 7,
            "pathogenic_count": 0,
            "vus_count": 0
        },
        "citations": []
    },
    # TP53 c.672A>G (p.Gln224Gln) - BEN-004
    "BEN004": {
        "uid": "BEN004",
        "title": "NM_000546.6(TP53):c.672A>G (p.Gln224Gln)",
        "gene": {"symbol": "TP53", "id": "7157"},
        "hgvs": {
            "genomic": "NC_000017.11:g.7674230T>C",
            "coding": "NM_000546.6:c.672A>G",
            "protein": "NP_000537.3:p.Gln224Gln"
        },
        "clinical_significance": {
            "description": "Benign",
            "last_evaluated": "2025-07-20",
            "review_status": "criteria provided, single submitter"
        },
        "statistics": {
            "submissions": 4,
            "pathogenic_count": 0,
            "vus_count": 0
        },
        "citations": []
    },
    # BRCA1 c.4837A>G (p.Ser1613Gly) - BEN-005
    "BEN005": {
        "uid": "BEN005",
        "title": "NM_007294.4(BRCA1):c.4837A>G (p.Ser1613Gly)",
        "gene": {"symbol": "BRCA1", "id": "672"},
        "hgvs": {
            "genomic": "NC_000017.11:g.43057112T>C",
            "coding": "NM_007294.4:c.4837A>G",
            "protein": "NP_007205.1:p.Ser1613Gly"
        },
        "clinical_significance": {
            "description": "Benign",
            "last_evaluated": "2025-06-15",
            "review_status": "reviewed by expert panel"
        },
        "statistics": {
            "submissions": 35,
            "pathogenic_count": 0,
            "vus_count": 0
        },
        "citations": []
    },
    # BRCA1 c.5123C>T (p.Thr1708Ile) - EDG-001
    "EDG001": {
        "uid": "EDG001",
        "title": "NM_007294.4(BRCA1):c.5123C>T (p.Thr1708Ile)",
        "gene": {"symbol": "BRCA1", "id": "672"},
        "hgvs": {
            "genomic": "NC_000017.11:g.43045651G>A",
            "coding": "NM_007294.4:c.5123C>T",
            "protein": "NP_007205.1:p.Thr1708Ile"
        },
        "clinical_significance": {
            "description": "Uncertain significance",
            "last_evaluated": "2025-10-01",
            "review_status": "criteria provided, conflicting interpretations"
        },
        "statistics": {
            "submissions": 9,
            "pathogenic_count": 2,
            "vus_count": 7
        },
        "citations": []
    },
    # BRCA2 c.7024C>T (p.Arg2342Cys) - EDG-002
    "EDG002": {
        "uid": "EDG002",
        "title": "NM_000059.4(BRCA2):c.7024C>T (p.Arg2342Cys)",
        "gene": {"symbol": "BRCA2", "id": "675"},
        "hgvs": {
            "genomic": "NC_000013.11:g.32355294G>A",
            "coding": "NM_000059.4:c.7024C>T",
            "protein": "NP_000050.2:p.Arg2342Cys"
        },
        "clinical_significance": {
            "description": "Uncertain significance",
            "last_evaluated": "2025-09-15",
            "review_status": "no assertion criteria provided"
        },
        "statistics": {
            "submissions": 1,
            "pathogenic_count": 0,
            "vus_count": 1
        },
        "citations": []
    },
    # TP53 c.500A>T (p.Asn167Ile) - EDG-003
    "EDG003": {
        "uid": "EDG003",
        "title": "NM_000546.6(TP53):c.500A>T (p.Asn167Ile)",
        "gene": {"symbol": "TP53", "id": "7157"},
        "hgvs": {
            "genomic": "NC_000017.11:g.7675124T>A",
            "coding": "NM_000546.6:c.500A>T",
            "protein": "NP_000537.3:p.Asn167Ile"
        },
        "clinical_significance": {
            "description": "Uncertain significance",
            "last_evaluated": "2025-08-20",
            "review_status": "criteria provided, single submitter"
        },
        "statistics": {
            "submissions": 2,
            "pathogenic_count": 0,
            "vus_count": 2
        },
        "citations": []
    },
    # BRCA1 c.2800C>G (p.Pro934Ala) - EDG-004
    "EDG004": {
        "uid": "EDG004",
        "title": "NM_007294.4(BRCA1):c.2800C>G (p.Pro934Ala)",
        "gene": {"symbol": "BRCA1", "id": "672"},
        "hgvs": {
            "genomic": "NC_000017.11:g.43091492G>C",
            "coding": "NM_007294.4:c.2800C>G",
            "protein": "NP_007205.1:p.Pro934Ala"
        },
        "clinical_significance": {
            "description": "Uncertain significance",
            "last_evaluated": "2025-07-15",
            "review_status": "criteria provided, multiple submitters"
        },
        "statistics": {
            "submissions": 5,
            "pathogenic_count": 0,
            "vus_count": 5
        },
        "citations": []
    },
    # BRCA2 c.9154C>T (p.Arg3052Cys) - EDG-005
    "EDG005": {
        "uid": "EDG005",
        "title": "NM_000059.4(BRCA2):c.9154C>T (p.Arg3052Cys)",
        "gene": {"symbol": "BRCA2", "id": "675"},
        "hgvs": {
            "genomic": "NC_000013.11:g.32398294G>A",
            "coding": "NM_000059.4:c.9154C>T",
            "protein": "NP_000050.2:p.Arg3052Cys"
        },
        "clinical_significance": {
            "description": "Uncertain significance",
            "last_evaluated": "2025-06-20",
            "review_status": "criteria provided, conflicting interpretations"
        },
        "statistics": {
            "submissions": 8,
            "pathogenic_count": 1,
            "vus_count": 7
        },
        "citations": []
    },
    # BRCA2 c.8023G>A (p.Asp2675Asn) - ASY-002
    "ASY002": {
        "uid": "ASY002",
        "title": "NM_000059.4(BRCA2):c.8023G>A (p.Asp2675Asn)",
        "gene": {"symbol": "BRCA2", "id": "675"},
        "hgvs": {
            "genomic": "NC_000013.11:g.32368294C>T",
            "coding": "NM_000059.4:c.8023G>A",
            "protein": "NP_000050.2:p.Asp2675Asn"
        },
        "clinical_significance": {
            "description": "Likely Pathogenic",
            "last_evaluated": "2025-10-10",
            "review_status": "criteria provided, conflicting interpretations"
        },
        "statistics": {
            "submissions": 15,
            "pathogenic_count": 12,
            "vus_count": 3
        },
        "citations": ["PMC8023999"]
    },
    # TP53 c.637C>T (p.Arg213Ter) - ASY-003
    "ASY003": {
        "uid": "ASY003",
        "title": "NM_000546.6(TP53):c.637C>T (p.Arg213Ter)",
        "gene": {"symbol": "TP53", "id": "7157"},
        "hgvs": {
            "genomic": "NC_000017.11:g.7674220G>A",
            "coding": "NM_000546.6:c.637C>T",
            "protein": "NP_000537.3:p.Arg213Ter"
        },
        "clinical_significance": {
            "description": "Pathogenic",
            "last_evaluated": "2025-11-05",
            "review_status": "reviewed by expert panel"
        },
        "statistics": {
            "submissions": 45,
            "pathogenic_count": 45,
            "vus_count": 0
        },
        "citations": ["PMC6379999"]
    },
    # BRCA1 c.4689C>T (p.Ser1563Leu) - ASY-004
    "ASY004": {
        "uid": "ASY004",
        "title": "NM_007294.4(BRCA1):c.4689C>T (p.Ser1563Leu)",
        "gene": {"symbol": "BRCA1", "id": "672"},
        "hgvs": {
            "genomic": "NC_000017.11:g.43058294G>A",
            "coding": "NM_007294.4:c.4689C>T",
            "protein": "NP_007205.1:p.Ser1563Leu"
        },
        "clinical_significance": {
            "description": "Pathogenic",
            "last_evaluated": "2025-12-10",
            "review_status": "criteria provided, multiple submitters"
        },
        "statistics": {
            "submissions": 24,
            "pathogenic_count": 23,
            "vus_count": 1
        },
        "citations": ["PMC4689999"]
    },
    # BRCA2 c.5351delA (p.Asn1784fs) - ASY-005
    "ASY005": {
        "uid": "ASY005",
        "title": "NM_000059.4(BRCA2):c.5351delA (p.Asn1784fs)",
        "gene": {"symbol": "BRCA2", "id": "675"},
        "hgvs": {
            "genomic": "NC_000013.11:g.32328294delA",
            "coding": "NM_000059.4:c.5351delA",
            "protein": "NP_000050.2:p.Asn1784fs"
        },
        "clinical_significance": {
            "description": "Pathogenic",
            "last_evaluated": "2026-01-15",
            "review_status": "reviewed by expert panel"
        },
        "statistics": {
            "submissions": 38,
            "pathogenic_count": 38,
            "vus_count": 0
        },
        "citations": ["PMC5351999"]
    }
}

PUBMED_MOCK_DATA = {
    "PMC3012455": """<?xml version="1.0" encoding="UTF-8"?>
<article xmlns:mml="http://www.w3.org/1998/Math/MathML" xmlns:xlink="http://www.w3.org/1999/xlink" article-type="research-article">
    <front>
        <article-meta>
            <article-id pub-id-type="pmcid">PMC3012455</article-id>
            <title-group>
                <article-title>Functional Characterization of BRCA1 BRCT Domain Variants</article-title>
            </title-group>
            <abstract>
                <p>We analyze the structural impact of missense variants in the BRCA1 BRCT domain, particularly Arg1700Gln.</p>
            </abstract>
        </article-meta>
    </front>
    <body>
        <sec id="s1">
            <title>Introduction</title>
            <p>The breast cancer susceptibility gene 1 (BRCA1) plays a critical role in DNA double-strand break repair. The C-terminal BRCT domain is essential for binding phosphorylated partner proteins.</p>
        </sec>
        <sec id="s2">
            <title>Results</title>
            <p>We subjected the variant BRCA1 c.5096G>A (p.Arg1700Gln) to transcriptional activation assays. In our functional test, Arg1700Gln demonstrated a severe loss of transcriptional activation capability, similar to known pathogenic controls. The arginine at position 1700 is highly conserved across vertebrates and forms critical salt bridges stabilizing the hydrophobic pocket of the BRCT domain. The substitution of a charged arginine for a polar glutamine (R1700Q) leads to protein misfolding, disruption of peptide binding, and complete loss of homology-directed repair activity. Thus, this variant is classified as pathogenic.</p>
        </sec>
    </body>
</article>""",

    "PMC4519922": """<!DOCTYPE html>
<html>
<head>
    <title>Clinical Observations of BRCA1 R1700Q in Diverse Cohorts</title>
</head>
<body>
    <article id="pmc4519922">
        <header>
            <h1>Clinical Observations of BRCA1 R1700Q in Diverse Cohorts</h1>
            <p>PMCID: PMC4519922</p>
        </header>
        <section id="abstract">
            <h2>Abstract</h2>
            <p>This study evaluates the clinical penetrance of BRCA1 variants in patients. We identified a cohort of patients carrying the NM_007294.4:c.5096G>A (p.Arg1700Gln) alteration.</p>
        </section>
        <section id="discussion">
            <h2>Discussion & Findings</h2>
            <p>The BRCA1 Arg1700Gln variant was identified in three individuals from a single family. Interestingly, one female carrier aged 76 remained free of breast or ovarian cancer, suggesting incomplete penetrance. Additionally, a secondary review in a control database noted the variant in two healthy elderly individuals, raising questions regarding its high-penetrance pathogenic classification. However, biochemical assays support functional disruption. We tentatively categorize this variant as a Variant of Uncertain Significance (VUS) due to conflicting pedigree evaluations, despite the functional assays indicating loss of function.</p>
        </section>
    </body>
</html>""",

    "PMC1234567": """<?xml version="1.0" encoding="UTF-8"?>
<article>
    <front>
        <article-meta>
            <article-id pub-id-type="pmcid">PMC1234567</article-id>
            <title-group>
                <article-title>Prevalence of BRCA2 Founder Mutations</article-title>
            </title-group>
        </article-meta>
    </front>
    <body>
        <sec>
            <title>Results</title>
            <p>The BRCA2 c.5946delT mutation leads to a frameshift starting at codon serine 1982, creating a premature translation stop codon (p.Ser1982fs*22). This frameshift results in a truncated, non-functional protein product that undergoes nonsense-mediated mRNA decay. This mutation is highly pathogenic and dramatically increases risk for breast, ovarian, and prostate cancers.</p>
        </sec>
    </body>
</article>""",

    "PMC5678901": """<?xml version="1.0" encoding="UTF-8"?>
<article>
    <front>
        <article-meta>
            <article-id pub-id-type="pmcid">PMC5678901</article-id>
            <title-group>
                <article-title>TP53 Mutation Profiling in Li-Fraumeni Syndrome</article-title>
            </title-group>
        </article-meta>
    </front>
    <body>
        <sec>
            <title>Abstract</title>
            <p>TP53 c.743G>A (p.Arg248Gln) is a major DNA-binding hotspot mutation. It exhibits a dominant-negative oncogenic effect, destabilizing the p53 core domain and preventing sequence-specific DNA binding, which leads to early-onset Li-Fraumeni syndrome. Clinical databases confirm 100% penetrance in families examined, making this a Class 5 Pathogenic variant.</p>
        </sec>
    </body>
</article>""",

    "PMC9988776": """<?xml version="1.0" encoding="UTF-8"?>
<article>
    <front>
        <article-meta>
            <article-id pub-id-type="pmcid">PMC9988776</article-id>
            <title-group>
                <article-title>Structural destabilization of p53 DNA binding domain</article-title>
            </title-group>
        </article-meta>
    </front>
    <body>
        <sec>
            <title>Structure Analysis</title>
            <p>The Arg248 residue in p53 is positioned directly in the minor groove of the target DNA. The positive charge of arginine is critical for coordinating with the negative phosphate backbone. When mutated to glutamine (R248Q), the loss of charge and structural rearrangement disrupts target gene activation, verifying its highly pathogenic and destructive structural effect.</p>
        </sec>
    </body>
</article>""",

    "PMC8023999": """<?xml version="1.0" encoding="UTF-8"?>
<article>
    <front>
        <article-meta>
            <article-id pub-id-type="pmcid">PMC8023999</article-id>
            <title-group>
                <article-title>Asymmetric evaluation of BRCA2 Asp2675Asn variant</article-title>
            </title-group>
        </article-meta>
    </front>
    <body>
        <sec>
            <title>Discussion</title>
            <p>The BRCA2 c.8023G>A (p.Asp2675Asn) variant is classified as likely pathogenic in ClinVar. However, a recent biochemical assay of transcriptional activity showed benign-like activation, suggesting incomplete penetrance or a benign significance.</p>
        </sec>
    </body>
</article>""",

    "PMC6379999": """<?xml version="1.0" encoding="UTF-8"?>
<article>
    <front>
        <article-meta>
            <article-id pub-id-type="pmcid">PMC6379999</article-id>
            <title-group>
                <article-title>TP53 Arg213Ter alternative splicing insights</article-title>
            </title-group>
        </article-meta>
    </front>
    <body>
        <sec>
            <title>Results</title>
            <p>While TP53 c.637C>T (p.Arg213Ter) introduces a premature stop codon and is classically considered highly pathogenic, expression studies demonstrate that it triggers alternative splicing, resulting in an in-frame exon skipping event that acts as a benign-like rescue mechanism.</p>
        </sec>
    </body>
</article>""",

    "PMC4689999": """<?xml version="1.0" encoding="UTF-8"?>
<article>
    <front>
        <article-meta>
            <article-id pub-id-type="pmcid">PMC4689999</article-id>
            <title-group>
                <article-title>Clinical follow-up of BRCA1 Ser1563Leu</article-title>
            </title-group>
        </article-meta>
    </front>
    <body>
        <sec>
            <title>Introduction</title>
            <p>The BRCA1 c.4689C>T (p.Ser1563Leu) variant is reported as pathogenic. However, we identified an active carrier of the Ser1563Leu mutation who remains entirely healthy at age 82 with no family history of malignancy, indicating a VUS classification might be more appropriate.</p>
        </sec>
    </body>
</article>""",

    "PMC5351999": """<?xml version="1.0" encoding="UTF-8"?>
<article>
    <front>
        <article-meta>
            <article-id pub-id-type="pmcid">PMC5351999</article-id>
            <title-group>
                <article-title>Population study of BRCA2 Asn1784fs</article-title>
            </title-group>
        </article-meta>
    </front>
    <body>
        <sec>
            <title>Discussion</title>
            <p>Our founder mutation analysis of BRCA2 c.5351delA (p.Asn1784fs) demonstrates incomplete penetrance in the studied cohort, which challenges the universal high-penetrance pathogenic consensus. We tentatively mark it as benign-like under specific modifiers.</p>
        </sec>
    </body>
</article>"""
}


def lookup_clinvar_mock(variant_id: str) -> dict:
    """Helper to query mock ClinVar JSON data by ID or HGVS syntax."""
    variant_id = str(variant_id).strip()
    if variant_id in CLINVAR_MOCK_DATA:
        return CLINVAR_MOCK_DATA[variant_id]
    
    # Try searching the titles/HGVS
    for key, data in CLINVAR_MOCK_DATA.items():
        if variant_id.lower() in data["title"].lower() or variant_id.lower() in data["hgvs"]["coding"].lower():
            return data
            
    return None


def lookup_pubmed_mock(pmid_or_pmcid: str) -> str:
    """Helper to query mock PubMed XML/HTML paper by ID."""
    clean_id = str(pmid_or_pmcid).strip().upper()
    if not clean_id.startswith("PMC") and not clean_id.startswith("PMID"):
        # Assume PMCID
        clean_id = f"PMC{clean_id}"
    return PUBMED_MOCK_DATA.get(clean_id) or PUBMED_MOCK_DATA.get(clean_id.replace("PMC", ""))
