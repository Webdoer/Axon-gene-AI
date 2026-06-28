# Axon Gene AI

A production-grade, multi-agent genomic variant classification and interpretation engine. Axon Gene AI automates ACMG-tier interpretation of clinical variants by coordinating multiple specialized AI agents, backed by real-time safety guardrails, self-healing debuggers, semantic memories, and cryptographic audit chains.

---

## 🏗️ Architecture & Flowcharts

The following flowcharts detail the inner workings of the multi-agent system.

### 1. Multi-Agent Pipeline Orchestration
The core pipeline executes sequentially across specialized agents, monitored continuously by the `DebugAgent`.

```mermaid
graph TD
    Start([User Input Variant Query]) --> InGuardrail{Input Guardrail}
    
    %% Input Guardrail Check
    InGuardrail -- Fails (Prompt Injection) --> FailState[Fail Run & Terminate]
    InGuardrail -- Passes --> InitRepo[Initialize Run in Database]
    
    %% Monitor Agent
    InitRepo --> MonitorAgent[1. MonitorAgent]
    subgraph DebugAgent Monitoring [DebugAgent Context Wrapper]
        MonitorAgent --> |Fetch ClinVar & PubMed| CalcAgent[2. CalculationAgent]
        CalcAgent --> |Genomic Alignment Calculations| LoopAgent[3. LoopAgent]
        LoopAgent --> |Verify & Correct Transcript NM_xx| PolicyAgent[4. PolicyAgent]
    end
    
    %% Self Healing path
    DebugAgentMonitoring -. Catch Panic / Error .-> SelfHeal{Self-Healing Heuristics}
    SelfHeal -. Success .-> ApplySandboxPatch[Run Sandboxed Patch & Resume]
    ApplySandboxPatch -.-> DebugAgentMonitoring
    SelfHeal -. Failure / Max Retries .-> FailState
    
    %% Policy Agent outputs
    PolicyAgent --> OutGuardrail{Output Guardrail}
    OutGuardrail -- Fails (Hallucination/Formating) --> FailState
    OutGuardrail -- Passes --> HITLCheck{Requires HITL Review?}
    
    %% HITL Check
    HITLCheck -- Yes (Pathogenic >0.99 OR Lit Conflict) --> PauseState[Pause Run & Activate HITL Gate]
    PauseState --> |Technician Approves / Overrides| ResumePipeline[Resume Pipeline]
    ResumePipeline --> CompletePipeline[Complete Run & Persist to Graph Memory]
    
    HITLCheck -- No --> CompletePipeline
    
    CompletePipeline --> End([Final Output Stored])
```

---

### 2. Self-Healing & Code Patching Loop
When any agent encounters an exception (e.g., API timeout, bad JSON structure, or schema errors), the `DebugAgent` attempts to heal the execution context dynamically.

```mermaid
graph TD
    Exception[Agent Interrupted by Exception] --> IdentifyError{Identify Error Category}
    
    IdentifyError -->|JSON Decode Error| PatchJSON[Regex JSON Substring Matcher]
    IdentifyError -->|Network Timeout| PatchNetwork[Activate Offline Mock Data Cache]
    IdentifyError -->|MCP Transport Error| PatchMCP[Switch to Direct Mock Pipeline]
    IdentifyError -->|Schema Key/Attribute Error| PatchSchema[Apply Default-Key Fallback Patch]
    
    PatchJSON --> Sandbox[Execute Patch in Sandboxed Environment]
    PatchNetwork --> Sandbox
    PatchMCP --> Sandbox
    PatchSchema --> Sandbox
    
    Sandbox --> VerifyPatch{Patch Success?}
    VerifyPatch -->|Yes| Heal[Log HEALED State & Resume Agent]
    VerifyPatch -->|No / Max Retries Exceeded| Terminate[Log FATAL State & Terminate Pipeline]
```

---

### 3. Human-In-The-Loop (HITL) Gate Sequence
High-risk classifications or conflicting scientific literature require authorization by an authorized clinical technician or pathologist before reporting.

```mermaid
sequenceDiagram
    autonumber
    participant PolicyAgent
    participant Database
    participant AuditTrail as SHA-256 Audit Trail
    participant Technician
    
    PolicyAgent->>PolicyAgent: Calibrate Classification & Check Lit Conflict
    Note over PolicyAgent: If classification is "Pathogenic" (conf > 0.99) OR literature conflict exists
    
    PolicyAgent->>Database: Set Status to PAUSED_HITL & hitl_state to PENDING
    PolicyAgent->>AuditTrail: Write Audit Entry (HITL_GATE_ACTIVATED)
    Note over Database, AuditTrail: System state is locked and immutable
    
    Technician->>Database: Submit Decision (APPROVED | OVERRIDDEN) with Rationale
    Note over Technician: Requires RBAC checks (TECHNICIAN / PATHOLOGIST role)
    Database->>AuditTrail: Write Audit Entry (HITL_Gate Resumed by Actor)
    
    Database->>PolicyAgent: Resume execution with technician-specified classification
    PolicyAgent->>Database: Persist final classification & set status to COMPLETED
```

---

## 🤖 The 5-Agent Orchestration Team

1. **MonitorAgent**: Connects to the local **BioMCP Server** via `stdio` transport. It retrieves raw NCBI ClinVar variant documentation and scrapes related PubMed/PMC literature citations. It also checks semantic memories for any prior variants.
2. **CalculationAgent**: Performs deterministic genomic alignment and consequence calculations (frameshift, missense, synonymous, nonsense, etc.) mapping genomic locations to transcript coordinates.
3. **LoopAgent (Analysis Integrity & Self-Correction)**: Assesses data completeness. If transcript references (e.g., `NM_x.x` versioning) are missing, it scans the literature text to recover the correct version and re-triggers the genomic alignment.
4. **PolicyAgent**: Implements clinical classification policies based on the ACMG Guidelines. It calibrates classification confidence and resolves discrepancies when PubMed articles show conflicting clinical claims.
5. **DebugAgent**: A meta-agent wrapper. It monitors every step, intercepts exceptions, generates sandboxed Python patches, logs code fixes to the long-term DB, and retries the failed agent up to 3 times.

---

## 🔒 Security, Safety, & Auditing

* **Input Guardrail**: Scans user inputs to detect and block prompt injection attempts, sanitizing strings before downstream ingestion.
* **Output Guardrail**: Validates generated variant names and transcripts against verified NCBI structures to prevent AI hallucinations.
* **Cryptographic Hash Chain**: Every state transition of a run generates a SHA-256 hash incorporating the previous state's hash, creating an immutable audit trail.
* **Sandboxed Patching**: Dynamically generated self-healing patches are executed within isolated scopes to prevent execution of malicious code.
* **Role-Based Access Control (RBAC)**: Enforces that only authorized accounts with appropriate credentials can review and approve paused clinical gates.

---

## 💻 Tech Stack

* **Backend**: FastAPI, Python 3.10+, SQLite (Episodic + Semantic recall storage), FastMCP.
* **Frontend**: HTML5, Vanilla CSS3 (Rich glassmorphic design system), Vanilla JS.
* **Protocols**: Model Context Protocol (MCP) for tool binding.

---

## 🚀 Getting Started

### Prerequisites
* Python 3.10+
* Git
* GitHub CLI (`gh`) (for repository management)

### Installation & Run
1. Clone this repository (if pulling down):
   ```bash
   git clone <your-repository-url>
   cd "capstone project 2"
   ```
2. Set up a virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate

   pip install -r requirements.txt
   ```
3. Run the application:
   * On Windows: Double-click or run `run_app.bat` (or use PowerShell `.\run_app.ps1`).
   * Alternatively, start it manually:
     ```bash
     uvicorn backend.main:app --reload --port 8000
     ```
4. Access the frontend dashboard at: `http://localhost:8000/static/index.html`
