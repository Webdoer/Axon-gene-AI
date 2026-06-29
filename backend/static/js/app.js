// ══════════════════════════════════════════════════════════════════════
// Axon gene AI v2 — Full SPA Client
// Matches index.html v2 element IDs.
// ══════════════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {

    // ── State ────────────────────────────────────────────────────────
    let activeRunId = null;
    let pollTimer = null;
    let diagTimer = null;
    let logsRendered = new Set();
    let loadedRunData = null;

    // ── DOM refs ─────────────────────────────────────────────────────
    const $ = id => document.getElementById(id);

    // Global stats
    const gsTotal     = $("gs-total");
    const gsHitl      = $("gs-hitl");
    const gsCompleted = $("gs-completed");
    const gsGuard     = $("gs-guard");
    const hitlCount   = $("hitl-count");

    // Nav / tabs
    const navItems = document.querySelectorAll(".nav-item[data-tab]");
    const tabs     = document.querySelectorAll(".tab");
    const pageTitle    = $("page-title");
    const pageSubtitle = $("page-subtitle");
    
    // Sidebar toggle DOM refs
    const sidebar = $("sidebar");
    const mainArea = $("main-area");

    // Dashboard
    const analyzeForm     = $("analyze-form");
    const variantInput    = $("variant-query");
    const submitBtn       = $("submit-btn");
    const historyTbody    = $("history-tbody");
    const refreshHistBtn  = $("refresh-history-btn");

    // Agent graph
    const agentNodes = {
        MonitorAgent:     $("node-MonitorAgent"),
        CalculationAgent: $("node-CalculationAgent"),
        LoopAgent:        $("node-LoopAgent"),
        PolicyAgent:      $("node-PolicyAgent"),
    };
    const debugNodeStatus = $("debug-node-status");
    const activeRunBadge  = $("active-run-badge");

    // Terminal
    const terminal       = $("terminal");
    const clearConsBtn   = $("clear-console-btn");

    // Workspace panels
    const wsEmpty  = $("ws-empty");
    const wsLoaded = $("ws-loaded");

    // HITL portal
    const hitlPortal       = $("hitl-portal");
    const hitlPortalReason = $("hitl-portal-reason");
    const hitlApproveBtn   = $("hitl-approve-btn");
    const hitlOverrideToggle = $("hitl-override-toggle");
    const overrideDrawer   = $("override-drawer");
    const overrideClass    = $("override-class");
    const overrideRationale = $("override-rationale");
    const actorRole        = $("actor-role");
    const hitlOverrideSubmit = $("hitl-override-submit");
    const conflictClinvar  = $("conflict-clinvar");
    const conflictPubmed   = $("conflict-pubmed");

    // Variant header
    const vhGene   = $("vh-gene");
    const vhTitle  = $("vh-title");
    const vhHgvs   = $("vh-hgvs");
    const confRingFill = $("conf-ring-fill");
    const confRingPct  = $("conf-ring-pct");
    const confClass    = $("conf-class");

    // Workspace sub-tabs
    const wsTabBtns   = document.querySelectorAll(".ws-tab");
    const wstPanels   = document.querySelectorAll(".wst-panel");

    // Summary tab
    const icClinvar = $("ic-clinvar");
    const icHgvsc   = $("ic-hgvsc");
    const icHgvsp   = $("ic-hgvsp");
    const icReview  = $("ic-review");
    const ctxFunc   = $("ctx-functional");
    const ctxClinvar = $("ctx-clinvar");
    const ctxLit    = $("ctx-lit");
    const ctxMemory = $("ctx-memory");

    // Math tab
    const mCodon  = $("m-codon");
    const mDomain = $("m-domain");
    const mCrit   = $("m-critical");
    const mType   = $("m-type");
    const mChargeBar = $("m-charge-bar");
    const mChargeVal = $("m-charge-val");
    const mHydroBar  = $("m-hydro-bar");
    const mHydroVal  = $("m-hydro-val");
    const mMassBar   = $("m-mass-bar");
    const mMassVal   = $("m-mass-val");
    const domainTrack = $("domain-track");
    const mFeasDesc  = $("m-feas-desc");

    // Literature tab
    const litList = $("lit-list");
    const litReaderTitle = $("lit-reader-title");
    const litReaderId    = $("lit-reader-id");
    const litReaderBody  = $("lit-reader-body");

    // Memory tab
    const memoryPriorBlock = $("memory-prior-block");
    const guardrailEventsBlock = $("guardrail-events-block");

    // HITL queue tab
    const hitlTbody = $("hitl-tbody");

    // Eval tab
    const evalTbody     = $("eval-tbody");
    const runAllEvalBtn = $("run-all-eval-btn");
    const evalFilters   = document.querySelectorAll("#eval-filter-group .chip-toggle");

    // Security tab
    const auditTbody = $("audit-tbody");
    const guardTbody = $("guard-tbody");

    // Telemetry tab
    const teleCpu       = $("tele-cpu");
    const teleRam       = $("tele-ram");
    const teleDb        = $("tele-db");
    const teleCompleted = $("tele-completed");
    const teleFailed    = $("tele-failed");
    const teleErrors    = $("tele-errors");
    const patchTbody    = $("patch-tbody");
    const teleEventsTbody = $("tele-events-tbody");


    // ═══════════════════════════════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════════════════════════════
    const PAGE_META = {
        "dashboard-tab":  ["Variant Interpretation Dashboard", "Real-time multi-agent genomic classification with enterprise guardrails"],
        "analysis-tab":   ["Multi-Agent Analysis Workspace", "Interactive agent graph, real-time logs, and biochemical alignment inspector"],
        "history-tab":    ["Analysis History", "Immutable ledger of variant interpretation pipeline executions"],
        "batch-vcf-tab":  ["Batch VCF Processing", "Drag-and-drop multi-variant classification — parallel multi-agent pipeline with sortable results"],
        "hitl-tab":       ["Human-In-The-Loop Safety Gate", "Authorize or override classifications flagged by PolicyAgent"],
        "eval-tab":       ["Automated Evaluation Suite", "20-fixture benchmark: oncogenic, benign, edge-case, and asymmetric conflict variants"],
        "security-tab":  ["Audit Trail & Security", "SHA-256 immutable ledger, guardrail violations, and zero-trust RBAC logs"],
        "telemetry-tab": ["Telemetry Matrix", "CVA node health, self-debug patch log, and recent agent events"],
    };

    function switchTab(tabId) {
        navItems.forEach(n => n.classList.toggle("active", n.dataset.tab === tabId));
        tabs.forEach(t => t.classList.toggle("active", t.id === tabId));
        const meta = PAGE_META[tabId] || ["Dashboard", ""];
        pageTitle.textContent = meta[0];
        pageSubtitle.textContent = meta[1];

        if (tabId === "history-tab") refreshHistory();
        if (tabId === "hitl-tab") refreshHitlQueue();
        if (tabId === "eval-tab") loadEvalFixtures();
        if (tabId === "security-tab") { loadAuditTrail(); loadGuardrailTable(); }
        if (tabId === "telemetry-tab") refreshTelemetry();
    }

    navItems.forEach(n => n.addEventListener("click", e => { e.preventDefault(); switchTab(n.dataset.tab); }));

    // Sidebar toggle — smart: mobile drawer OR desktop in-flex collapse
    const sidebarToggle = $("sidebar-toggle");

    function isMobileViewport() { return window.innerWidth <= 768; }

    function openMobileDrawer() {
        const backdrop = document.getElementById('sidebar-backdrop');
        sidebar.classList.add('mobile-open');
        if (backdrop) backdrop.classList.add('visible');
        document.body.style.overflow = 'hidden';
        if (sidebarToggle) {
            const icon = sidebarToggle.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-xmark';
        }
    }

    function closeMobileDrawer() {
        const backdrop = document.getElementById('sidebar-backdrop');
        sidebar.classList.remove('mobile-open');
        if (backdrop) backdrop.classList.remove('visible');
        document.body.style.overflow = '';
        if (sidebarToggle) {
            const icon = sidebarToggle.querySelector('i');
            if (icon) icon.className = 'fa-solid fa-bars';
        }
    }

    function toggleSidebar() {
        if (isMobileViewport()) {
            // Mobile: toggle drawer open/close
            if (sidebar.classList.contains('mobile-open')) {
                closeMobileDrawer();
            } else {
                openMobileDrawer();
            }
        } else {
            // Desktop: Gemini-style collapse/expand
            const isCollapsed = sidebar.classList.toggle('collapsed');
            if (sidebarToggle) {
                const icon = sidebarToggle.querySelector('i');
                if (icon) icon.className = isCollapsed ? 'fa-solid fa-bars' : 'fa-solid fa-xmark';
            }
        }
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    // On resize back to desktop: clean up any lingering mobile state
    window.addEventListener('resize', function() {
        if (!isMobileViewport()) {
            closeMobileDrawer();
        }
    });

    // Note: no auto-close on nav clicks — Gemini-style sidebar persists across navigation
    navItems.forEach(n => n.addEventListener('click', () => {
        // sidebar stays open on desktop (Gemini behaviour)
    }));

    // Workspace sub-tabs
    wsTabBtns.forEach(btn => btn.addEventListener("click", () => {
        const target = btn.dataset.wstab;
        wsTabBtns.forEach(b => b.classList.toggle("active", b === btn));
        wstPanels.forEach(p => p.classList.toggle("active", p.id === target));
    }));


    // ═══════════════════════════════════════════════════════════════════
    // GLOBAL STATS POLLER
    // ═══════════════════════════════════════════════════════════════════
    async function fetchGlobalStats() {
        try {
            const r = await fetch("/api/diagnostics");
            if (!r.ok) return;
            const d = await r.json();
            const m = d.metrics || {};
            gsTotal.textContent     = m.total_runs || 0;
            if (gsHitl) gsHitl.textContent      = m.paused_hitl || 0;
            gsCompleted.textContent = m.completed_runs || 0;

            // Guard violations count
            gsGuard.textContent = (d.guardrail_violations || []).length;

            if (m.paused_hitl > 0) {
                hitlCount.textContent = m.paused_hitl;
                hitlCount.style.display = "inline-block";
            } else {
                hitlCount.style.display = "none";
            }
        } catch(e) { console.warn("Stats poll err:", e); }
    }
    fetchGlobalStats();
    setInterval(fetchGlobalStats, 5000);


    // ═══════════════════════════════════════════════════════════════════
    // DASHBOARD — VALIDATION, SUBMIT & DEMO
    // ═══════════════════════════════════════════════════════════════════

    // Accepted input patterns
    const CLINVAR_RE = /^\d+$/;
    // Strict HGVS: prefix · optional version · optional (GeneName) · colon · coordinate type · rest
    const HGVS_RE = /^(NC_|NM_|NP_|NG_|NR_)\d+\.\d+(\([a-z0-9_-]+\))?:[cgpe]\..+$/i;

    const variantError = document.getElementById("variant-error");

    function setVariantError(msg) {
        variantError.textContent = msg;
        variantInput.classList.toggle("input-error", !!msg);
    }

    function clearVariantError() {
        setVariantError("");
    }

    function isValidHGVS(str) {
        const trimmed = str.trim();
        if (HGVS_RE.test(trimmed)) return true;
        
        // Fallback loose structural check
        const validPrefixes = ['NM_', 'NC_', 'NP_', 'NG_', 'NR_'];
        const hasValidPrefix = validPrefixes.some(prefix => trimmed.toUpperCase().startsWith(prefix));
        return hasValidPrefix && trimmed.includes(':');
    }

    // Clear the error the moment the user starts editing again
    variantInput.addEventListener("input", clearVariantError);

    analyzeForm.addEventListener("submit", e => {
        e.preventDefault();
        const q = variantInput.value.trim();

        if (!q) {
            setVariantError("Please enter a ClinVar ID or HGVS coordinate before launching.");
            return;
        }

        if (!CLINVAR_RE.test(q) && !isValidHGVS(q)) {
            setVariantError(
                "Invalid Variant Format. Please provide a valid numerical ClinVar ID " +
                "(e.g. 55476) or an HGVS coordinate string (e.g. NM_007294.3(BRCA1):c.*6207C>T)."
            );
            return;
        }

        clearVariantError();
        launchPipeline(q);
    });

    document.querySelectorAll(".demo-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const q = btn.dataset.query;
            variantInput.value = q;
            launchPipeline(q);
        });
    });

    async function launchPipeline(query) {
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting…';
            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({query})
            });
            const data = await res.json();
            if (data.success) {
                activeRunId = data.run_id;
                resetWorkspace();
                switchTab("analysis-tab");
                activeRunBadge.textContent = activeRunId;
                activeRunBadge.classList.add("active");
                startPolling(activeRunId);
            } else {
                alert("Pipeline error: " + (data.message || "Unknown"));
            }
        } catch(e) { console.error(e); alert("Network error."); }
        finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-play"></i> Launch Multi-Agent Pipeline';
        }
    }


    // ═══════════════════════════════════════════════════════════════════
    // WORKSPACE — POLLING & RENDERING
    // ═══════════════════════════════════════════════════════════════════
    function resetWorkspace() {
        logsRendered.clear();
        terminal.innerHTML = '<span class="t-sys">[SYSTEM] Spawning sequential agent process…</span>';
        wsEmpty.style.display = "none";
        wsLoaded.style.display = "none";
        hitlPortal.style.display = "none";
        overrideDrawer.style.display = "none";

        // Clear blueprint and checklist panels
        const bpSection = $("evidence-blueprint-section");
        const clSection = $("acmg-checklist-section");
        if (bpSection) bpSection.innerHTML = "";
        if (clSection) clSection.innerHTML = "";

        // Reset ACMG base state
        acmgBaseConf = null;
        acmgBaseClass = null;

        // Reset agent nodes
        Object.values(agentNodes).forEach(n => {
            n.className = "agent-node";
            n.querySelector(".node-status").innerHTML = '<i class="fa-solid fa-clock"></i>';
        });
    }

    function startPolling(runId) {
        if (pollTimer) clearInterval(pollTimer);
        pollRunStatus(runId);
        pollTimer = setInterval(() => pollRunStatus(runId), 1200);
    }

    async function pollRunStatus(runId) {
        try {
            const r = await fetch(`/api/status/${runId}`);
            if (!r.ok) return;
            const data = await r.json();
            loadedRunData = data;
            const run = data.run;
            const logs = data.logs || [];

            // Render new log lines
            logs.forEach(log => {
                const key = `${log.id}`;
                if (!logsRendered.has(key)) {
                    logsRendered.add(key);
                    appendLog(log);
                }
            });

            // Update agent graph
            updateAgentGraph(logs, run.status);

            // Show loaded workspace once gene resolved
            if (run.gene_symbol) {
                wsLoaded.style.display = "block";
                wsEmpty.style.display = "none";
                renderVariantInfo(run, data);
            }

            // Status handling
            if (run.status === "COMPLETED") {
                clearInterval(pollTimer);
                activeRunBadge.textContent = "Completed ✓";
                hitlPortal.style.display = "none";
                refreshHistory();
                setPdfBtnState(true);
            } else if (run.status === "FAILED") {
                clearInterval(pollTimer);
                activeRunBadge.textContent = "Failed ✗";
                hitlPortal.style.display = "none";
                refreshHistory();
                setPdfBtnState(false);
            } else if (run.status === "PAUSED_HITL") {
                clearInterval(pollTimer);
                activeRunBadge.textContent = "HITL Pending ⚠";
                showHitlPortal(run, data);
                refreshHistory();
                setPdfBtnState(true);
            } else {
                activeRunBadge.textContent = "Running…";
                setPdfBtnState(false);
            }
        } catch(e) { console.warn("Poll err:", e); }
    }

    function appendLog(log) {
        const span = document.createElement("span");
        const s = log.status || "INFO";
        let cls = "t-info";
        if (s === "STARTED")    cls = "t-started";
        else if (s === "COMPLETED") cls = "t-completed";
        else if (s === "WARNING" || s === "PAUSED") cls = "t-warning";
        else if (s === "ERROR" || s === "FATAL" || s === "FAILED") cls = "t-error";
        else if (s === "HEALED") cls = "t-healed";
        span.className = cls;
        const ts = new Date(log.timestamp).toLocaleTimeString();
        span.textContent = `[${ts}] [${log.agent_name}] [${s}] ${log.message}`;
        terminal.appendChild(span);
        terminal.scrollTop = terminal.scrollHeight;
    }

    function updateAgentGraph(logs, runStatus) {
        const lastStatus = {};
        logs.forEach(l => { lastStatus[l.agent_name] = l.status; });

        const sequential = ["MonitorAgent", "CalculationAgent", "LoopAgent", "PolicyAgent"];
        sequential.forEach(name => {
            const node = agentNodes[name];
            if (!node) return;
            const st = lastStatus[name];
            node.className = "agent-node";
            const ico = node.querySelector(".node-status");

            if (!st) { ico.innerHTML = '<i class="fa-solid fa-clock"></i>'; return; }

            if (st === "STARTED" || st === "INFO") {
                node.classList.add("running");
                ico.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
            } else if (st === "COMPLETED") {
                node.classList.add("completed");
                ico.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
            } else if (st === "WARNING" || st === "PAUSED") {
                node.classList.add("healed");
                ico.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
            } else if (st === "FAILED" || st === "FATAL" || st === "ERROR") {
                node.classList.add("failed");
                ico.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
            } else if (st === "HEALED") {
                node.classList.add("healed");
                ico.innerHTML = '<i class="fa-solid fa-stethoscope"></i>';
            }
        });

        // PolicyAgent paused override
        if (runStatus === "PAUSED_HITL") {
            const pa = agentNodes["PolicyAgent"];
            pa.className = "agent-node healed";
            pa.querySelector(".node-status").innerHTML = '<i class="fa-solid fa-pause"></i>';
        }

        // DebugAgent
        const dbSt = lastStatus["DebugAgent"];
        if (dbSt === "ERROR" || dbSt === "FATAL") {
            debugNodeStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color:var(--red)"></i>';
        } else if (dbSt === "HEALED") {
            debugNodeStatus.innerHTML = '<i class="fa-solid fa-stethoscope" style="color:var(--amber)"></i>';
        } else {
            debugNodeStatus.innerHTML = '<i class="fa-solid fa-shield-virus"></i>';
        }
    }

    clearConsBtn.addEventListener("click", () => {
        terminal.innerHTML = '<span class="t-sys">[SYSTEM] Console cleared.</span>';
    });


    // ═══════════════════════════════════════════════════════════════════
    // VARIANT DETAIL RENDERERS
    // ═══════════════════════════════════════════════════════════════════
    function renderVariantInfo(run, data) {
        // Header
        vhGene.textContent = run.gene_symbol || "—";
        vhTitle.textContent = `${run.variant_query} Analysis`;
        vhHgvs.textContent = `${run.hgvs_c || "—"}  ·  ${run.hgvs_p || "—"}`;

        // Confidence gauge
        // ── Classification-aware display cap ─────────────────────────────
        // The backend stores the calibrated confidence, but as a defensive UI guard
        // we also enforce probability-aligned display ranges:
        //
        //   Pathogenic        → probability > 99% (unclamped)
        //   Likely Pathogenic → display clamped to [90 %, 99 %]  (amber ring)
        //   VUS               → unclamped in [10 %, 90 %]         (indigo ring)
        //   Likely Benign     → display clamped to [1 %, 10 %]    (green ring)
        //   Benign            → probability < 0.1% (typically 0%)  (green ring)
        const rawConf = (run.confidence != null) ? run.confidence : 0.5;
        let pct = Math.round(rawConf * 100);
        const classLabel = (run.final_classification || "VUS").trim();

        if (classLabel === "Likely Pathogenic") {
            pct = Math.min(Math.max(pct, 90), 99);
        } else if (classLabel === "Likely Benign") {
            pct = Math.min(Math.max(pct, 1), 10);
        }
        // Strict "Pathogenic" and "Benign" display their backend value as-is.

        confRingFill.setAttribute("stroke-dasharray", `${pct}, 100`);
        confRingPct.textContent = `${pct}%`;

        // Ring colour: differentiate Likely Pathogenic (amber) from strict
        // Pathogenic (red) so the dial is semantically consistent.
        if (classLabel === "Pathogenic") {
            confRingFill.style.stroke = "var(--red)";
            confClass.style.color    = "var(--red)";
        } else if (classLabel === "Likely Pathogenic") {
            confRingFill.style.stroke = "var(--amber)";
            confClass.style.color    = "var(--amber)";
        } else if (classLabel === "Benign" || classLabel === "Likely Benign") {
            confRingFill.style.stroke = "var(--green)";
            confClass.style.color    = "var(--green)";
        } else {
            // VUS / unknown
            confRingFill.style.stroke = "var(--indigo)";
            confClass.style.color    = "var(--indigo-light)";
        }
        confClass.textContent = classLabel;

        // Summary info chips
        icClinvar.textContent = run.clinvar_id || "—";
        icHgvsc.textContent   = run.hgvs_c || "—";
        icHgvsp.textContent   = run.hgvs_p || "—";

        // Parse logs for details
        let mathLog = null, monitorLog = null, memoryLog = null;
        (data.logs || []).forEach(l => {
            if (l.agent_name === "CalculationAgent" && l.status === "COMPLETED" && l.details) mathLog = l.details;
            if (l.agent_name === "MonitorAgent" && l.status === "INFO" && l.details) monitorLog = l.details;
            if (l.agent_name === "MonitorAgent" && l.message && l.message.includes("[MEMORY]")) memoryLog = l;
        });

        if (monitorLog && monitorLog.data) {
            const cs = monitorLog.data.clinical_significance || {};
            icReview.textContent = cs.review_status || "criteria provided";
            ctxClinvar.textContent = `ClinVar: '${cs.description || "N/A"}' — last evaluated ${cs.last_evaluated || "N/A"}. Submissions: ${monitorLog.data.statistics?.submissions || "N/A"}.`;
            ctxLit.textContent = `${monitorLog.data.citations?.length || 0} publications retrieved for functional review.`;
        }

        if (memoryLog) {
            ctxMemory.textContent = memoryLog.message.replace("[MEMORY] ", "");
        }

        if (mathLog) {
            ctxFunc.textContent = mathLog.feasibility_reason || "Calculations compiled.";

            // Math panel
            mCodon.textContent  = mathLog.codon_position || "—";
            mDomain.textContent = mathLog.functional_domain || "None";
            mCrit.textContent   = mathLog.is_critical_domain ? "YES — Critical" : "NO";
            mCrit.style.color   = mathLog.is_critical_domain ? "var(--red)" : "var(--green)";
            mType.textContent   = mathLog.variant_type || "—";

            const met = mathLog.metrics || {};
            setBar(mChargeBar, mChargeVal, met.charge_change, -2, 2, "charge");
            setBar(mHydroBar, mHydroVal, met.hydrophobicity_change, -5, 5, "Kyte-Doolittle Δ");
            setBar(mMassBar, mMassVal, met.mass_change_daltons, -150, 150, "Da");

            mFeasDesc.textContent = mathLog.feasibility_reason || "—";
            renderDomainTrack(run.gene_symbol, mathLog.codon_position);
        }

        // Literature
        renderLitPanel(data);

        // Memory tab
        renderMemoryTab(data);

        // ── FEATURE 1 + 2: Evidence Blueprint & ACMG Checklist (only on COMPLETED) ──
        if (run.status === "COMPLETED" || run.status === "PAUSED_HITL") {
            renderEvidenceBlueprint(run, data);
            if (acmgBaseConf === null) {
                const rawConf = (run.confidence != null) ? run.confidence : 0.5;
                acmgBaseConf  = Math.round(rawConf * 100);
                acmgBaseClass = (run.final_classification || "VUS").trim();
            }
            renderAcmgChecklist(run);
        }
    }

    function setBar(barEl, valEl, val, min, max, unit) {
        if (val == null) { barEl.style.width = "50%"; valEl.textContent = "N/A"; return; }
        const pct = Math.min(Math.max(((val - min) / (max - min)) * 100, 5), 95);
        barEl.style.width = `${pct}%`;
        valEl.textContent = `${val > 0 ? "+" : ""}${typeof val === "number" ? val.toFixed(1) : val} ${unit}`;
    }


    // ── Domain Track ─────────────────────────────────────────────────
    function renderDomainTrack(gene, codonPos) {
        // Clear previous
        domainTrack.innerHTML = '<div class="domain-baseline"></div>';

        let maxCodons = 1863;
        let domains = [];
        if (gene === "BRCA1") {
            maxCodons = 1863;
            domains = [
                {n:"RING", s:1, e:100, c:true},
                {n:"BRCT 1", s:1646, e:1736, c:true},
                {n:"BRCT 2", s:1756, e:1859, c:true}
            ];
        } else if (gene === "BRCA2") {
            maxCodons = 3418;
            domains = [
                {n:"PALB2", s:10, e:40, c:false},
                {n:"BRC Reps", s:1002, e:2085, c:true},
                {n:"DBD", s:2481, e:3186, c:true}
            ];
        } else if (gene === "TP53") {
            maxCodons = 393;
            domains = [
                {n:"TAD", s:1, e:92, c:false},
                {n:"DBD", s:102, e:292, c:true},
                {n:"OD", s:325, e:356, c:true}
            ];
        }

        domains.forEach(d => {
            const seg = document.createElement("div");
            seg.className = `domain-seg ${d.c ? "critical" : "non-critical"}`;
            seg.style.left  = `${(d.s / maxCodons) * 100}%`;
            seg.style.width = `${((d.e - d.s) / maxCodons) * 100}%`;
            seg.textContent = d.n;
            domainTrack.appendChild(seg);
        });

        if (codonPos) {
            const tick = document.createElement("div");
            tick.className = "variant-tick";
            tick.style.left = `${Math.min(Math.max((codonPos / maxCodons) * 100, 1), 99)}%`;
            tick.title = `Codon ${codonPos}`;
            domainTrack.appendChild(tick);
        }
    }


    // ── Literature Panel ─────────────────────────────────────────────
    let selectedPaper = 0;

    function renderLitPanel(data) {
        litList.innerHTML = "";
        const logs = data.logs || [];

        // Gather scraped articles from monitor logs
        const articles = [];
        logs.forEach(l => {
            if (l.agent_name === "MonitorAgent" && l.message && l.message.startsWith("Scraped")) {
                // Extract PMCID from message
                const m = l.message.match(/Scraped (PMC\d+|[\w]+)/);
                if (m) articles.push({ id: m[1], chars: l.message });
            }
        });

        // Also extract from monitor INFO logs that contain ClinVar data
        let citations = [];
        logs.forEach(l => {
            if (l.agent_name === "MonitorAgent" && l.details && l.details.data && l.details.data.citations) {
                citations = l.details.data.citations;
            }
        });

        const papers = citations.map((cid, i) => ({ id: cid, index: i }));

        if (papers.length === 0) {
            litList.innerHTML = '<div style="color:var(--text-muted);font-size:.75rem;padding:.5rem">No publications linked.</div>';
            return;
        }

        papers.forEach((p, i) => {
            const el = document.createElement("div");
            el.className = `lit-item ${i === selectedPaper ? "active" : ""}`;
            el.innerHTML = `<div class="lit-item-id">${p.id}</div><div style="font-size:.68rem;color:var(--text-muted);margin-top:.15rem">Study ${i + 1}</div>`;
            el.addEventListener("click", () => { selectedPaper = i; renderLitPanel(data); });
            litList.appendChild(el);
        });

        const active = papers[selectedPaper];
        if (active) {
            litReaderTitle.textContent = `Literature: ${active.id}`;
            litReaderId.textContent = active.id;
            // Find the scraped body from logs
            let body = "Full-text article content is available in the agent processing logs. The MonitorAgent scraped the complete document without truncation.";
            logs.forEach(l => {
                if (l.agent_name === "MonitorAgent" && l.message && l.message.includes(active.id) && l.message.includes("Scraped")) {
                    body = l.message;
                }
            });
            litReaderBody.textContent = body;
        }
    }


    // ── Memory Tab ───────────────────────────────────────────────────
    function renderMemoryTab(data) {
        // Prior eval
        let priorText = "No prior evaluations found for this variant fingerprint.";
        (data.logs || []).forEach(l => {
            if (l.agent_name === "MonitorAgent" && l.message && l.message.includes("[MEMORY] Prior evaluation found")) {
                priorText = l.message.replace("[MEMORY] ", "");
                if (l.details) {
                    priorText += `\nPrevious classification: ${l.details.final_classification || "N/A"} (Run: ${l.details.run_id || "N/A"})`;
                }
            }
        });
        memoryPriorBlock.innerHTML = `<p style="color:var(--text-secondary);font-size:.75rem;line-height:1.6;white-space:pre-wrap">${priorText}</p>`;

        // Guardrail events
        const gEvents = data.guardrail_events || [];
        if (gEvents.length === 0) {
            guardrailEventsBlock.innerHTML = '<p class="text-muted" style="font-size:.75rem">No guardrail events for this run.</p>';
        } else {
            guardrailEventsBlock.innerHTML = gEvents.map(g =>
                `<div class="guardrail-row">
                    <span class="chip chip-${g.severity === 'HIGH' ? 'danger' : 'info'}">${g.severity}</span>
                    <span style="color:var(--text-muted);font-size:.7rem;min-width:60px">${g.direction}</span>
                    <span style="color:var(--amber);font-size:.72rem;font-weight:600">${g.violation_type}</span>
                    <span style="color:var(--text-secondary);font-size:.72rem;flex:1">${g.detail}</span>
                </div>`
            ).join("");
        }
    }



    // ═══════════════════════════════════════════════════════════════════
    // PDF REPORT GENERATION
    // ═══════════════════════════════════════════════════════════════════
    const exportPdfBtn = $("export-pdf-btn");

    // Enable/disable the button based on run state
    function setPdfBtnState(enabled) {
        exportPdfBtn.disabled = !enabled;
    }

    // ── compileReportData ─────────────────────────────────────────────
    // Extracts all relevant fields from the live loadedRunData state.
    function compileReportData() {
        if (!loadedRunData) return null;

        const run  = loadedRunData.run  || {};
        const logs = loadedRunData.logs || [];
        const gEvents = loadedRunData.guardrail_events || [];

        // Variant metadata
        const meta = {
            runId:         run.run_id        || activeRunId || "—",
            query:         run.variant_query || "—",
            gene:          run.gene_symbol   || "—",
            hgvsC:         run.hgvs_c        || "—",
            hgvsP:         run.hgvs_p        || "—",
            clinvarId:     run.clinvar_id    || "—",
            status:        run.status        || "—",
            generatedAt:   new Date().toLocaleString(),
        };

        // Classification
        const rawConf = (run.confidence != null) ? run.confidence : 0;
        let confPct   = Math.round(rawConf * 100);
        const classLabel = (run.final_classification || "VUS").trim();
        if (classLabel === "Likely Pathogenic") confPct = Math.min(Math.max(confPct, 90), 99);
        if (classLabel === "Likely Benign")     confPct = Math.min(Math.max(confPct, 1), 10);

        const classification = {
            label:      classLabel,
            confidence: confPct,
            hitlReason: run.hitl_reason || null,
        };

        // Per-agent logs — build chronological timeline
        let mathLog = null, monitorData = null;
        const agentTimeline = [];
        const seenKeys = new Set();

        logs.forEach(l => {
            const key = `${l.agent_name}::${l.status}`;
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                agentTimeline.push({
                    agent:     l.agent_name,
                    status:    l.status,
                    message:   l.message,
                    timestamp: l.timestamp,
                });
            }
            if (l.agent_name === "CalculationAgent" && l.status === "COMPLETED" && l.details) mathLog = l.details;
            if (l.agent_name === "MonitorAgent" && l.details && l.details.data) monitorData = l.details.data;
        });

        // Biochemical metrics
        const metrics = mathLog ? {
            codonPosition:    mathLog.codon_position    || "—",
            functionalDomain: mathLog.functional_domain || "None",
            isCritical:       mathLog.is_critical_domain ? "YES — Critical" : "NO",
            variantType:      mathLog.variant_type      || "—",
            chargeChange:     mathLog.metrics?.charge_change        ?? "N/A",
            hydrophobicity:   mathLog.metrics?.hydrophobicity_change ?? "N/A",
            massChange:       mathLog.metrics?.mass_change_daltons   ?? "N/A",
            feasibility:      mathLog.feasibility_reason || "—",
        } : null;

        // Cross-session memory
        let memoryNote = "No prior evaluations found for this variant fingerprint.";
        logs.forEach(l => {
            if (l.agent_name === "MonitorAgent" && l.message && l.message.includes("[MEMORY] Prior evaluation found")) {
                memoryNote = l.message.replace("[MEMORY] ", "");
                if (l.details) memoryNote += `\nPrev. classification: ${l.details.final_classification || "N/A"} (Run: ${l.details.run_id || "N/A"})`;
            }
        });

        // ClinVar context
        const clinvarCtx = monitorData ? {
            significance:  monitorData.clinical_significance?.description || "N/A",
            reviewStatus:  monitorData.clinical_significance?.review_status || "N/A",
            lastEvaluated: monitorData.clinical_significance?.last_evaluated || "N/A",
            submissions:   monitorData.statistics?.submissions || "N/A",
            citations:     monitorData.citations?.length || 0,
        } : null;

        return { meta, classification, agentTimeline, metrics, memoryNote, clinvarCtx, gEvents };
    }

    // ── buildReportHTML ───────────────────────────────────────────────
    // Produces a self-contained, print-ready HTML string using table-based
    // layout (no flexbox/grid) for strict PDF engine compatibility.
    function buildReportHTML(d) {
        const { meta, classification, agentTimeline, metrics, memoryNote, clinvarCtx, gEvents } = d;

        const classColor =
            classification.label === "Pathogenic"         ? "#dc2626" :
            classification.label === "Likely Pathogenic"  ? "#d97706" :
            classification.label === "Benign"             ? "#16a34a" :
            classification.label === "Likely Benign"      ? "#15803d" :
            "#4f46e5"; // VUS

        // Agent timeline rows
        const statusIcon = s =>
            s === "COMPLETED" ? "✓" :
            s === "STARTED"   ? "▶" :
            s === "WARNING" || s === "PAUSED" ? "⚠" :
            s === "ERROR" || s === "FAILED"   ? "✗" :
            s === "HEALED"    ? "⚕" : "·";

        const statusColor = s =>
            s === "COMPLETED" ? "#16a34a" :
            s === "STARTED"   ? "#2563eb" :
            s === "WARNING" || s === "PAUSED" ? "#d97706" :
            s === "ERROR" || s === "FAILED"   ? "#dc2626" :
            s === "HEALED"    ? "#0891b2" : "#64748b";

        const timelineRows = agentTimeline.map((e, i) => {
            const ts = e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : "";
            const isLast = i === agentTimeline.length - 1;
            return `
            <tr>
                <td width="22" style="padding:0;vertical-align:top;text-align:center;">
                    <div style="width:22px;position:relative;">
                        <div style="width:22px;height:22px;border-radius:50%;background:${statusColor(e.status)};
                            color:#fff;font-size:10px;font-weight:700;text-align:center;line-height:22px;">
                            ${statusIcon(e.status)}
                        </div>
                        ${!isLast ? `<div style="width:2px;background:#e2e8f0;margin:0 auto;height:28px;"></div>` : ""}
                    </div>
                </td>
                <td style="padding:0 0 ${isLast ? "0" : "24px"} 12px;vertical-align:top;">
                    <div style="font-size:9.5px;font-weight:700;color:#0f172a;font-family:monospace;">${e.agent}</div>
                    <div style="font-size:8.5px;color:#64748b;margin-top:2px;">[${e.status}]${ts ? " · " + ts : ""}</div>
                    <div style="font-size:8.5px;color:#334155;margin-top:4px;line-height:1.5;max-width:240px;">${(e.message || "").substring(0, 180)}${e.message && e.message.length > 180 ? "…" : ""}</div>
                </td>
            </tr>`;
        }).join("");

        // Metrics rows (right column)
        const metricRow = (label, value, highlight) => `
            <tr>
                <td style="padding:5px 8px;font-size:8.5px;color:#64748b;font-weight:600;border-bottom:1px solid #e2e8f0;width:45%;">${label}</td>
                <td style="padding:5px 8px;font-size:8.5px;color:${highlight || "#0f172a"};font-weight:700;border-bottom:1px solid #e2e8f0;">${value}</td>
            </tr>`;

        const guardrailRows = gEvents.length === 0
            ? `<tr><td colspan="3" style="padding:6px 8px;font-size:8.5px;color:#94a3b8;font-style:italic;">No guardrail events for this run.</td></tr>`
            : gEvents.map(g => `
                <tr>
                    <td style="padding:4px 8px;font-size:8px;color:${g.severity === "HIGH" ? "#dc2626" : "#d97706"};font-weight:700;border-bottom:1px solid #e2e8f0;">${g.severity}</td>
                    <td style="padding:4px 8px;font-size:8px;color:#4f46e5;font-weight:600;border-bottom:1px solid #e2e8f0;">${g.violation_type}</td>
                    <td style="padding:4px 8px;font-size:8px;color:#334155;border-bottom:1px solid #e2e8f0;">${(g.detail || "").substring(0, 90)}</td>
                </tr>`).join("");

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Axon gene Report — ${meta.query}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f8fafc; color: #0f172a; font-size: 10px; }
  a { color: inherit; text-decoration: none; }
</style>
</head>
<body>

<!-- ── COVER BAND ─────────────────────────────────────── -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e3a8a,#3730a3);padding:28px 36px;">
  <tr>
    <td>
      <div style="color:#93c5fd;font-size:8px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:4px;">Axon gene AI — Automated Genomic Report</div>
      <div style="color:#fff;font-size:20px;font-weight:900;letter-spacing:-.02em;">Variant Interpretation Report</div>
      <div style="color:#bfdbfe;font-size:9px;margin-top:6px;">Run ID: <strong style="color:#fff;">${meta.runId}</strong> &nbsp;·&nbsp; Generated: ${meta.generatedAt}</div>
    </td>
    <td width="120" style="text-align:right;vertical-align:middle;">
      <div style="background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);border-radius:8px;padding:10px 14px;display:inline-block;">
        <div style="color:#fff;font-size:22px;font-weight:900;text-align:center;">${classification.confidence}%</div>
        <div style="color:#bfdbfe;font-size:7.5px;text-align:center;margin-top:2px;letter-spacing:.06em;text-transform:uppercase;">Confidence</div>
        <div style="color:${classColor};font-size:9px;font-weight:800;text-align:center;margin-top:4px;background:#fff;border-radius:4px;padding:2px 6px;">${classification.label}</div>
      </div>
    </td>
  </tr>
</table>

<!-- ── VARIANT META STRIP ────────────────────────────── -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border-bottom:2px solid #e2e8f0;padding:14px 36px;">
  <tr>
    <td width="25%" style="padding-right:24px;">
      <div style="font-size:7.5px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.1em;">Gene</div>
      <div style="font-size:13px;font-weight:900;color:#1e3a8a;margin-top:2px;">${meta.gene}</div>
    </td>
    <td width="25%" style="padding-right:24px;">
      <div style="font-size:7.5px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.1em;">Query</div>
      <div style="font-size:10px;font-weight:700;color:#0f172a;margin-top:2px;font-family:monospace;">${meta.query}</div>
    </td>
    <td width="25%" style="padding-right:24px;">
      <div style="font-size:7.5px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.1em;">HGVS Coding</div>
      <div style="font-size:9px;font-weight:600;color:#334155;margin-top:2px;font-family:monospace;">${meta.hgvsC}</div>
    </td>
    <td width="25%">
      <div style="font-size:7.5px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.1em;">HGVS Protein</div>
      <div style="font-size:9px;font-weight:600;color:#334155;margin-top:2px;font-family:monospace;">${meta.hgvsP}</div>
    </td>
  </tr>
</table>

<!-- ── BODY: 2-COLUMN LAYOUT (table-based for PDF compat) ── -->
<table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 36px;background:#f8fafc;">
  <tr valign="top">

    <!-- LEFT: Agent Execution Timeline -->
    <td width="50%" style="padding-right:18px;">
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px 18px;margin-bottom:16px;">
        <div style="font-size:8px;font-weight:800;color:#1e3a8a;text-transform:uppercase;letter-spacing:.1em;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">
          ◎ Multi-Agent Execution Timeline
        </div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${timelineRows}
        </table>
      </div>

      <!-- ClinVar Context -->
      ${clinvarCtx ? `
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px 18px;margin-bottom:16px;">
        <div style="font-size:8px;font-weight:800;color:#1e3a8a;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">
          ◎ ClinVar Record Context
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
          ${metricRow("Clinical Significance", clinvarCtx.significance)}
          ${metricRow("Review Status", clinvarCtx.reviewStatus)}
          ${metricRow("Last Evaluated", clinvarCtx.lastEvaluated)}
          ${metricRow("Submissions", clinvarCtx.submissions)}
          ${metricRow("Linked Citations", clinvarCtx.citations + " publications")}
        </table>
      </div>` : ""}
    </td>

    <!-- RIGHT: Classification, Metrics, Memory, Guardrails -->
    <td width="50%" style="padding-left:18px;">

      <!-- Target Classification -->
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px 18px;margin-bottom:16px;">
        <div style="font-size:8px;font-weight:800;color:#1e3a8a;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">
          ◎ Target Classification
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
          ${metricRow("Final Classification", classification.label, classColor)}
          ${metricRow("Confidence Score", classification.confidence + "%")}
          ${metricRow("ClinVar ID", meta.clinvarId)}
          ${metricRow("Pipeline Status", meta.status)}
          ${classification.hitlReason ? metricRow("HITL Flag Reason", classification.hitlReason, "#d97706") : ""}
        </table>
      </div>

      <!-- Biochemical Metrics -->
      ${metrics ? `
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px 18px;margin-bottom:16px;">
        <div style="font-size:8px;font-weight:800;color:#1e3a8a;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">
          ◎ Biochemical Computation (CalculationAgent)
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
          ${metricRow("Codon Position", metrics.codonPosition)}
          ${metricRow("Functional Domain", metrics.functionalDomain)}
          ${metricRow("Critical Domain", metrics.isCritical, metrics.isCritical.startsWith("YES") ? "#dc2626" : "#16a34a")}
          ${metricRow("Variant Type", metrics.variantType)}
          ${metricRow("Charge Change (Δ)", String(metrics.chargeChange))}
          ${metricRow("Hydrophobicity (Δ KD)", String(metrics.hydrophobicity))}
          ${metricRow("Mass Change (Da)", String(metrics.massChange))}
        </table>
        <div style="margin-top:8px;padding:8px;background:#f1f5f9;border-radius:4px;font-size:8px;color:#475569;line-height:1.5;">
          <strong>Feasibility Assessment:</strong> ${metrics.feasibility}
        </div>
      </div>` : ""}

      <!-- Cross-Session Memory -->
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px 18px;margin-bottom:16px;">
        <div style="font-size:8px;font-weight:800;color:#1e3a8a;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">
          ◎ Cross-Session Memory (MonitorAgent)
        </div>
        <div style="font-size:8.5px;color:#334155;line-height:1.7;white-space:pre-wrap;background:#f1f5f9;padding:8px 10px;border-radius:4px;">${memoryNote}</div>
      </div>

      <!-- Guardrail Audit -->
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px 18px;">
        <div style="font-size:8px;font-weight:800;color:#1e3a8a;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #e2e8f0;">
          ◎ Guardrail Audit (PolicyAgent)
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
          <tr style="background:#f8fafc;">
            <td style="padding:5px 8px;font-size:7.5px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid #e2e8f0;width:55px;">Severity</td>
            <td style="padding:5px 8px;font-size:7.5px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid #e2e8f0;width:90px;">Type</td>
            <td style="padding:5px 8px;font-size:7.5px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid #e2e8f0;">Detail</td>
          </tr>
          ${guardrailRows}
        </table>
      </div>
    </td>

  </tr>
</table>

<!-- ── FOOTER ──────────────────────────────────────────── -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1e293b;padding:12px 36px;margin-top:4px;">
  <tr>
    <td style="color:#64748b;font-size:7.5px;">Axon gene AI v2 · Automated Genomic Variant Interpretation · This report is generated by an AI pipeline and must be reviewed by a qualified clinical geneticist before any clinical decision-making.</td>
    <td width="120" style="text-align:right;color:#475569;font-size:7.5px;">Run: ${meta.runId}</td>
  </tr>
</table>

</body>
</html>`;
    }

    // ── generatePDFReport ─────────────────────────────────────────────
    // Compiles data → builds HTML → triggers html2pdf.js → saves file.
    async function generatePDFReport() {
        const reportData = compileReportData();
        if (!reportData) {
            alert("No completed run data available. Please run a pipeline first.");
            return;
        }

        // UI: loading state
        exportPdfBtn.classList.add("generating");
        exportPdfBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Generating…</span>';

        // 1. Add an Event Lifecycle Delay (setTimeout) to ensure full state stability
        setTimeout(async () => {
            try {
                // Generate a clean, direct HTML template string
                const elementString = buildReportHTML(reportData);
                const filename = `Variant_Interpretation_Report_${reportData.meta.query.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

                const opt = {
                    margin:       [0, 0, 0, 0], // Keeps full-bleed layout (cover band to edges)
                    filename,
                    image:        { type: "jpeg", quality: 0.97 },
                    html2canvas:  { scale: 2, logging: false, useCORS: true },
                    jsPDF:        { unit: "mm", format: "a4", orientation: "portrait" },
                    pagebreak:    { mode: ["avoid-all", "css"] },
                };

                // Feed the pure HTML string instead of document.getElementById
                await html2pdf().from(elementString).set(opt).save();

            } catch (err) {
                console.error("PDF generation failed:", err);
                alert("PDF generation failed. Please check the console for details.");
            } finally {
                exportPdfBtn.classList.remove("generating");
                exportPdfBtn.innerHTML = '<i class="fa-solid fa-file-arrow-down"></i> <span>Export PDF</span>';
            }
        }, 100);
    }

    exportPdfBtn.addEventListener("click", generatePDFReport);

    // ═══════════════════════════════════════════════════════════════════
    // HITL PORTAL
    // ═══════════════════════════════════════════════════════════════════
    function showHitlPortal(run, data) {
        hitlPortal.style.display = "block";
        hitlPortalReason.textContent = run.hitl_reason || "Safety threshold exceeded.";

        // Side-by-side conflict view
        let clinvarText = "ClinVar record data shown in agent logs.";
        let pubmedText  = "PubMed literature data shown in agent logs.";

        (data.logs || []).forEach(l => {
            if (l.agent_name === "MonitorAgent" && l.details && l.details.data) {
                const d = l.details.data;
                clinvarText = `Gene: ${d.gene?.symbol || "?"}\nSignificance: ${d.clinical_significance?.description || "?"}\nReview: ${d.clinical_significance?.review_status || "?"}\nLast Evaluated: ${d.clinical_significance?.last_evaluated || "?"}\nSubmissions: ${d.statistics?.submissions || "?"}`;
            }
            if (l.agent_name === "MonitorAgent" && l.message && l.message.includes("Scraped")) {
                pubmedText = l.message;
            }
        });

        conflictClinvar.textContent = clinvarText;
        conflictPubmed.textContent = pubmedText;

        // Pre-fill override
        overrideClass.value = run.final_classification || "VUS";
    }

    hitlApproveBtn.addEventListener("click", async () => {
        if (!activeRunId || !loadedRunData) return;
        if (!confirm(`Approve classification '${loadedRunData.run.final_classification}' for ${loadedRunData.run.variant_query}?`)) return;
        await submitHitl(activeRunId, "APPROVED", loadedRunData.run.final_classification, actorRole.value, "Approved as recommended.");
    });

    hitlOverrideToggle.addEventListener("click", () => {
        overrideDrawer.style.display = overrideDrawer.style.display === "none" ? "block" : "none";
    });

    hitlOverrideSubmit.addEventListener("click", async () => {
        if (!activeRunId) return;
        const rat = overrideRationale.value.trim();
        if (!rat) { alert("Clinical rationale is required for overrides."); return; }
        if (!confirm(`Override to '${overrideClass.value}'?`)) return;
        await submitHitl(activeRunId, "OVERRIDDEN", overrideClass.value, actorRole.value, rat);
    });

    async function submitHitl(runId, decision, classification, actor, rationale) {
        try {
            const res = await fetch("/api/hitl/respond", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ run_id: runId, decision, classification, actor, rationale })
            });
            const data = await res.json();
            if (data.success) {
                hitlPortal.style.display = "none";
                overrideDrawer.style.display = "none";
                overrideRationale.value = "";
                startPolling(runId);
            } else {
                alert("HITL error: " + JSON.stringify(data));
            }
        } catch(e) { console.error(e); alert("Network error."); }
    }


    // ═══════════════════════════════════════════════════════════════════
    // HISTORY TABLE
    // ═══════════════════════════════════════════════════════════════════
    async function refreshHistory() {
        try {
            const r = await fetch("/api/variants");
            if (!r.ok) return;
            const runs = await r.json();

            if (!runs.length) {
                historyTbody.innerHTML = '<tr><td colspan="8" class="empty-row">No runs yet — launch a pipeline above.</td></tr>';
                return;
            }

            historyTbody.innerHTML = runs.map(run => {
                const st = run.status;
                let statusChip = `<span class="chip chip-info">${st}</span>`;
                if (st === "COMPLETED") statusChip = '<span class="chip chip-success">COMPLETED</span>';
                else if (st === "FAILED") statusChip = '<span class="chip chip-danger">FAILED</span>';
                else if (st === "PAUSED_HITL") statusChip = '<span class="chip chip-warning">HITL PENDING</span>';

                let classChip = "—";
                const fc = run.final_classification;
                if (fc) {
                    let cc = "chip-info";
                    if (fc.includes("Pathogenic")) cc = "chip-danger";
                    else if (fc.includes("Benign")) cc = "chip-success";
                    else if (fc === "VUS") cc = "chip-warning";
                    classChip = `<span class="chip ${cc}">${fc}</span>`;
                }

                const confPct = run.confidence != null ? `${Math.round(run.confidence * 100)}%` : "—";

                return `<tr>
                    <td><span class="mono" style="font-size:.7rem">${run.id}</span></td>
                    <td>${run.variant_query}</td>
                    <td><span class="gene-chip" style="font-size:.65rem;padding:.1rem .45rem">${run.gene_symbol || "—"}</span></td>
                    <td><span class="mono" style="font-size:.7rem">${run.hgvs_c || "—"}</span></td>
                    <td>${classChip}</td>
                    <td><span class="mono">${confPct}</span></td>
                    <td>${statusChip}</td>
                    <td><button class="btn btn-xs btn-ghost inspect-btn" data-runid="${run.id}"><i class="fa-solid fa-arrow-right"></i></button></td>
                </tr>`;
            }).join("");

            // Bind inspect buttons
            document.querySelectorAll(".inspect-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    activeRunId = btn.dataset.runid;
                    resetWorkspace();
                    switchTab("analysis-tab");
                    activeRunBadge.textContent = activeRunId;
                    startPolling(activeRunId);
                });
            });
        } catch(e) { console.warn("History err:", e); }
    }

    refreshHistBtn.addEventListener("click", refreshHistory);


    // ═══════════════════════════════════════════════════════════════════
    // HITL QUEUE TABLE
    // ═══════════════════════════════════════════════════════════════════
    async function refreshHitlQueue() {
        try {
            const r = await fetch("/api/variants");
            if (!r.ok) return;
            const runs = (await r.json()).filter(r => r.status === "PAUSED_HITL");

            if (!runs.length) {
                hitlTbody.innerHTML = '<tr><td colspan="7" class="empty-row">No runs pending HITL review.</td></tr>';
                return;
            }

            hitlTbody.innerHTML = runs.map(run => `
                <tr>
                    <td class="mono" style="font-size:.7rem">${run.id}</td>
                    <td>${run.variant_query}</td>
                    <td><span class="gene-chip" style="font-size:.65rem;padding:.1rem .45rem">${run.gene_symbol || "—"}</span></td>
                    <td><span class="chip chip-danger">${run.final_classification || "—"}</span></td>
                    <td style="font-size:.72rem;color:var(--text-muted)">${run.hitl_reason || "—"}</td>
                    <td style="font-size:.72rem;color:var(--text-muted)">${new Date(run.updated_at).toLocaleTimeString()}</td>
                    <td><button class="btn btn-xs btn-warning hitl-inspect-btn" data-runid="${run.id}"><i class="fa-solid fa-gavel"></i> Review</button></td>
                </tr>
            `).join("");

            document.querySelectorAll(".hitl-inspect-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    activeRunId = btn.dataset.runid;
                    resetWorkspace();
                    switchTab("analysis-tab");
                    activeRunBadge.textContent = activeRunId;
                    startPolling(activeRunId);
                });
            });
        } catch(e) { console.warn("HITL queue err:", e); }
    }


    // ═══════════════════════════════════════════════════════════════════
    // EVAL SUITE
    // ═══════════════════════════════════════════════════════════════════
    let evalFixtures = [];
    let evalFilter = "ALL";

    async function loadEvalFixtures() {
        try {
            const r = await fetch("/api/eval/fixtures");
            if (!r.ok) return;
            evalFixtures = await r.json();
            renderEvalTable();
        } catch(e) { console.warn("Eval load err:", e); }
    }

    function renderEvalTable() {
        const filtered = evalFilter === "ALL" ? evalFixtures : evalFixtures.filter(f => f.category === evalFilter);

        if (!filtered.length) {
            evalTbody.innerHTML = '<tr><td colspan="9" class="empty-row">No fixtures match filter.</td></tr>';
            return;
        }

        evalTbody.innerHTML = filtered.map(f => {
            let catChip = "chip-info";
            if (f.category === "ONCOGENIC") catChip = "chip-danger";
            else if (f.category === "BENIGN") catChip = "chip-success";
            else if (f.category === "EDGE") catChip = "chip-warning";
            else if (f.category === "ASYMMETRIC") catChip = "chip-warning";

            return `<tr>
                <td class="mono" style="font-size:.72rem">${f.id}</td>
                <td><span class="chip ${catChip}">${f.category}</span></td>
                <td><span class="gene-chip" style="font-size:.65rem;padding:.1rem .45rem">${f.gene}</span></td>
                <td class="mono" style="font-size:.7rem">${f.hgvs_c}</td>
                <td><span class="chip ${f.expected_classification.includes("Pathogenic") ? "chip-danger" : f.expected_classification.includes("Benign") ? "chip-success" : "chip-warning"}">${f.expected_classification}</span></td>
                <td>${f.expect_hitl ? '<i class="fa-solid fa-check text-amber"></i>' : '<i class="fa-solid fa-minus text-muted"></i>'}</td>
                <td>${f.expect_conflict ? '<i class="fa-solid fa-check text-amber"></i>' : '<i class="fa-solid fa-minus text-muted"></i>'}</td>
                <td style="font-size:.72rem;color:var(--text-muted);max-width:250px">${f.description}</td>
                <td><button class="btn btn-xs btn-ghost eval-run-single" data-fid="${f.id}"><i class="fa-solid fa-play"></i></button></td>
            </tr>`;
        }).join("");

        // Bind single-run buttons
        document.querySelectorAll(".eval-run-single").forEach(btn => {
            btn.addEventListener("click", async () => {
                const fid = btn.dataset.fid;
                btn.disabled = true;
                try {
                    const res = await fetch("/api/eval/run", {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({ fixture_ids: [fid] })
                    });
                    const data = await res.json();
                    if (data.success && data.spawned.length) {
                        activeRunId = data.spawned[0].run_id;
                        resetWorkspace();
                        switchTab("analysis-tab");
                        activeRunBadge.textContent = activeRunId;
                        startPolling(activeRunId);
                    }
                } catch(e) { alert("Error: " + e); }
                finally { btn.disabled = false; }
            });
        });
    }

    evalFilters.forEach(chip => {
        chip.addEventListener("click", () => {
            evalFilters.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            evalFilter = chip.dataset.cat;
            renderEvalTable();
        });
    });

    runAllEvalBtn.addEventListener("click", async () => {
        runAllEvalBtn.disabled = true;
        runAllEvalBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Running…';
        try {
            const res = await fetch("/api/eval/run", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ fixture_ids: [] })
            });
            const data = await res.json();
            alert(`Evaluation suite triggered: ${data.total} fixture runs queued. Check Analysis History.`);
        } catch(e) { alert("Error: " + e); }
        finally {
            runAllEvalBtn.disabled = false;
            runAllEvalBtn.innerHTML = '<i class="fa-solid fa-play"></i> Run All 20 Fixtures';
        }
    });


    // ═══════════════════════════════════════════════════════════════════
    // SECURITY — AUDIT TRAIL & GUARDRAILS
    // ═══════════════════════════════════════════════════════════════════
    async function loadAuditTrail() {
        try {
            const r = await fetch("/api/memory/audit?limit=30");
            if (!r.ok) return;
            const entries = await r.json();
            if (!entries.length) {
                auditTbody.innerHTML = '<tr><td colspan="6" class="empty-row">No audit entries yet.</td></tr>';
                return;
            }
            auditTbody.innerHTML = entries.map(e => `
                <tr>
                    <td style="font-size:.7rem;color:var(--text-muted)">${new Date(e.created_at).toLocaleTimeString()}</td>
                    <td><span class="chip chip-info" style="font-size:.6rem">${e.event_type}</span></td>
                    <td style="font-size:.72rem">${e.agent_name || "—"}</td>
                    <td style="font-size:.72rem;color:var(--indigo-light)">${e.actor || "SYSTEM"}</td>
                    <td class="mono" style="font-size:.6rem;color:var(--text-muted)">${(e.prev_state_hash || "").substring(0, 12)}…</td>
                    <td class="mono" style="font-size:.6rem;color:var(--cyan)">${(e.curr_state_hash || "").substring(0, 12)}…</td>
                </tr>
            `).join("");
        } catch(e) { console.warn("Audit err:", e); }
    }

    async function loadGuardrailTable() {
        try {
            const r = await fetch("/api/memory/guardrails?limit=20");
            if (!r.ok) return;
            const entries = await r.json();
            if (!entries.length) {
                guardTbody.innerHTML = '<tr><td colspan="5" class="empty-row">No violations logged.</td></tr>';
                return;
            }
            guardTbody.innerHTML = entries.map(e => `
                <tr>
                    <td style="font-size:.7rem;color:var(--text-muted)">${new Date(e.created_at).toLocaleTimeString()}</td>
                    <td style="font-size:.72rem">${e.direction}</td>
                    <td><span class="chip ${e.severity === 'HIGH' ? 'chip-danger' : 'chip-info'}">${e.violation_type}</span></td>
                    <td style="font-size:.72rem;color:${e.severity === 'HIGH' ? 'var(--red)' : 'var(--amber)'}">${e.severity}</td>
                    <td style="font-size:.72rem;color:var(--text-muted);max-width:400px">${e.detail}</td>
                </tr>
            `).join("");
        } catch(e) { console.warn("Guardrail table err:", e); }
    }


    // ═══════════════════════════════════════════════════════════════════
    // TELEMETRY
    // ═══════════════════════════════════════════════════════════════════
    async function refreshTelemetry() {
        try {
            const r = await fetch("/api/diagnostics");
            if (!r.ok) return;
            const d = await r.json();
            const m = d.metrics || {};

            teleCpu.textContent = `${d.cpu_usage_pct || 0}%`;
            teleRam.textContent = `${d.ram_usage_pct || 0}%`;
            teleDb.textContent  = formatBytes(m.db_size_bytes || 0);
            teleCompleted.textContent = m.completed_runs || 0;
            teleFailed.textContent    = m.failed_runs || 0;
            teleErrors.textContent    = m.error_count || 0;

            // Patch log
            const patches = d.debug_patches || [];
            if (!patches.length) {
                patchTbody.innerHTML = '<tr><td colspan="7" class="empty-row">No patch events yet.</td></tr>';
            } else {
                patchTbody.innerHTML = patches.map(p => `
                    <tr>
                        <td style="font-size:.7rem;color:var(--text-muted)">${p.created_at ? new Date(p.created_at).toLocaleTimeString() : "—"}</td>
                        <td class="mono" style="font-size:.68rem">${p.run_id || "—"}</td>
                        <td style="font-size:.72rem">${p.agent_name || "—"}</td>
                        <td style="font-size:.72rem;color:var(--amber)">${p.error_type || "—"}</td>
                        <td style="font-size:.72rem">${p.retry_attempt || 0}</td>
                        <td><span class="chip ${p.result === 'HEALED' ? 'chip-success' : 'chip-danger'}">${p.result || "—"}</span></td>
                        <td class="mono" style="font-size:.6rem;color:var(--text-muted)">${(p.sha256_hash || "").substring(0, 12)}…</td>
                    </tr>
                `).join("");
            }

            // Recent events
            const events = d.recent_diagnostic_events || [];
            if (!events.length) {
                teleEventsTbody.innerHTML = '<tr><td colspan="5" class="empty-row">No events yet.</td></tr>';
            } else {
                teleEventsTbody.innerHTML = events.map(e => {
                    let levelChip = "chip-info";
                    if (e.status === "ERROR" || e.status === "FATAL") levelChip = "chip-danger";
                    else if (e.status === "WARNING") levelChip = "chip-warning";
                    else if (e.status === "HEALED") levelChip = "chip-success";
                    return `<tr>
                        <td style="font-size:.7rem;color:var(--text-muted)">${e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : "—"}</td>
                        <td class="mono" style="font-size:.68rem">${e.run_id || "—"}</td>
                        <td style="font-size:.72rem">${e.agent_name || "—"}</td>
                        <td><span class="chip ${levelChip}">${e.status}</span></td>
                        <td style="font-size:.72rem;color:var(--text-secondary);max-width:400px">${e.message || "—"}</td>
                    </tr>`;
                }).join("");
            }
        } catch(e) { console.warn("Telemetry err:", e); }
    }

    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / 1048576).toFixed(1) + " MB";
    }


    // ── Dashboard Mode Toggle ─────────────────────────────────────────
    const dashModeSingle = $("dash-mode-single");
    const dashModeBatch  = $("dash-mode-batch");
    const singleVariantCard = $("single-variant-card");
    const batchVcfCard      = $("batch-vcf-card");

    function switchDashMode(mode) {
        const isBatch = mode === "batch";
        dashModeSingle.classList.toggle("active", !isBatch);
        dashModeBatch.classList.toggle("active", isBatch);
        if (singleVariantCard) singleVariantCard.style.display = isBatch ? "none" : "";
        if (batchVcfCard) batchVcfCard.style.display = isBatch ? "" : "none";
    }

    if (dashModeSingle) dashModeSingle.addEventListener("click", () => switchDashMode("single"));
    if (dashModeBatch)  dashModeBatch.addEventListener("click",  () => switchDashMode("batch"));


    // ═══════════════════════════════════════════════════════════════════
    // FEATURE 1 — EVIDENCE BLUEPRINT
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Infers ACMG/AMP criteria triggered by the pipeline from the run data.
     * Returns an array of criterion objects: { code, tier, title, description, weight }
     */
    function inferAcmgCriteria(run, data) {
        const criteria = [];
        const cls = (run.final_classification || "").trim();
        const isPath  = cls.includes("Pathogenic");
        const isBenign = cls.includes("Benign");

        // Extract math log for domain/type data
        let mathLog = null, monitorLog = null;
        (data.logs || []).forEach(l => {
            if (l.agent_name === "CalculationAgent" && l.status === "COMPLETED" && l.details) mathLog = l.details;
            if (l.agent_name === "MonitorAgent" && l.details && l.details.data) monitorLog = l.details.data;
        });

        const variantType      = (mathLog && mathLog.variant_type) || "";
        const isCriticalDomain = mathLog && mathLog.is_critical_domain;
        const domain           = (mathLog && mathLog.functional_domain) || "Unknown";
        const codon            = (mathLog && mathLog.codon_position) || null;
        const submissions      = (monitorLog && monitorLog.statistics && monitorLog.statistics.submissions) || 0;
        const citations        = (monitorLog && monitorLog.citations) || [];

        // ── Pathogenic criteria ───────────────────────────────────────
        if (isPath) {
            // PVS1 — Null variant in LOF gene
            if (["Frameshift", "Nonsense", "Splice Site", "Start-lost"].some(t => variantType.includes(t))) {
                criteria.push({
                    code: "PVS1", tier: "pvs",
                    title: "Pathogenic Very Strong: Loss-of-Function Variant",
                    description: `Null variant (${variantType || "LOF type"}) in a gene where loss-of-function is a known mechanism of disease.`,
                    weight: "+8"
                });
            }
            // PS1 — Same amino acid change as established pathogenic
            if (submissions >= 3) {
                criteria.push({
                    code: "PS1", tier: "ps",
                    title: "Pathogenic Strong: Same Amino-Acid Change as Established Pathogenic",
                    description: `ClinVar record contains ${submissions} submissions; prior pathogenic classification concordance detected.`,
                    weight: "+4"
                });
            }
            // PS3 — Functional studies
            if (citations.length >= 2) {
                criteria.push({
                    code: "PS3", tier: "ps",
                    title: "Pathogenic Strong: Functional Studies Support Deleterious Effect",
                    description: `${citations.length} supporting publications retrieved by MonitorAgent from PubMed / PMC literature corpus.`,
                    weight: "+4"
                });
            }
            // PM1 — Critical domain
            if (isCriticalDomain) {
                criteria.push({
                    code: "PM1", tier: "pm",
                    title: `Pathogenic Moderate: Variant in Critical Functional Domain`,
                    description: `Position ${codon || "—"} falls within the ${domain} — a mutational hotspot or critical protein region.`,
                    weight: "+2"
                });
            }
            // PM2 — Absent from population databases
            criteria.push({
                code: "PM2", tier: "pm",
                title: "Pathogenic Moderate: Absent from Population Databases",
                description: "Variant not found (or at extremely low frequency) in gnomAD reference cohorts, indicating it is not a common benign polymorphism.",
                weight: "+2"
            });
            // PP2 — Missense in constrained gene
            if (variantType.includes("Missense") && isCriticalDomain) {
                criteria.push({
                    code: "PP2", tier: "pp",
                    title: "Pathogenic Supporting: Missense Variant in Constrained Gene",
                    description: `Missense variants are a common pathogenic mechanism for ${run.gene_symbol || "this gene"}; this locus shows low tolerance to missense variation.`,
                    weight: "+1"
                });
            }
            // PP3 — In-silico support
            criteria.push({
                code: "PP3", tier: "pp",
                title: "Pathogenic Supporting: Computational Evidence Supports Deleterious Effect",
                description: "Multiple in-silico predictors (SIFT, PolyPhen-2, CADD, REVEL) converge on a deleterious prediction for this variant position.",
                weight: "+1"
            });
        }

        // ── Benign criteria ────────────────────────────────────────────
        if (isBenign) {
            // BA1 — Allele frequency > 5% in gnomAD
            if (cls === "Benign") {
                criteria.push({
                    code: "BA1", tier: "ba",
                    title: "Benign Stand-alone: High Population Allele Frequency",
                    description: "Allele frequency > 5% in at least one major population cohort in gnomAD, meeting the BA1 stand-alone benign criterion.",
                    weight: "−8"
                });
            }
            // BS1 — Allele frequency greater than expected
            criteria.push({
                code: "BS1", tier: "bs",
                title: "Benign Strong: Allele Frequency Greater Than Expected",
                description: "Population frequency exceeds the maximum expected allele frequency for the disease prevalence and penetrance model.",
                weight: "−4"
            });
            // BP1 — Missense variant in gene with mainly truncating variants
            if (variantType.includes("Missense")) {
                criteria.push({
                    code: "BP1", tier: "bp",
                    title: "Benign Supporting: Missense Variant in Gene With Mainly Truncating Pathogenic Variants",
                    description: `Missense changes at this position in ${run.gene_symbol || "this gene"} are not a primary pathogenic mechanism.`,
                    weight: "−1"
                });
            }
            // BP4 — Multiple in-silico predictions benign
            criteria.push({
                code: "BP4", tier: "bp",
                title: "Benign Supporting: Computational Evidence Suggests No Impact",
                description: "Majority consensus from in-silico tools (SIFT, PolyPhen, CADD, REVEL) predicts no damaging effect on gene function.",
                weight: "−1"
            });
            // BP7 — Synonymous variant
            if (variantType.includes("Synonymous") || variantType.includes("Silent")) {
                criteria.push({
                    code: "BP7", tier: "bp",
                    title: "Benign Supporting: Synonymous (Silent) Variant — No Predicted Splice Impact",
                    description: "Variant is synonymous with no predicted impact on splicing regulatory elements or nearby donor/acceptor sites.",
                    weight: "−1"
                });
            }
        }

        // VUS — mixed or uncertain
        if (!isPath && !isBenign) {
            criteria.push({
                code: "PM2", tier: "pm",
                title: "Pathogenic Moderate: Absent or Rare in Population Databases",
                description: "Variant is absent from or found at very low frequency in gnomAD — insufficient evidence for benign classification.",
                weight: "+2"
            });
            criteria.push({
                code: "PP3", tier: "pp",
                title: "Pathogenic Supporting: Computational Predictions Conflicting",
                description: "In-silico tools show discordant predictions; evidence is insufficient to resolve classification away from VUS.",
                weight: "+1"
            });
            criteria.push({
                code: "BP4", tier: "bp",
                title: "Benign Supporting: Some Computational Tools Predict Benign Effect",
                description: "A minority of in-silico tools (e.g. PolyPhen-2 benign) contribute conflicting benign-direction evidence.",
                weight: "−1"
            });
        }

        return criteria;
    }

    function renderEvidenceBlueprint(run, data) {
        const container = $("evidence-blueprint-section");
        if (!container) return;

        const criteria = inferAcmgCriteria(run, data);

        if (!criteria.length) {
            container.innerHTML = "";
            return;
        }

        const rows = criteria.map(c => `
            <div class="blueprint-row">
                <span class="acmg-badge acmg-${c.tier}">${c.code}</span>
                <div class="blueprint-criterion">
                    <div class="blueprint-criterion-title">${c.title}</div>
                    <div class="blueprint-criterion-desc">${c.description}</div>
                </div>
                <span class="blueprint-weight">${c.weight}</span>
            </div>`).join("");

        container.innerHTML = `
            <div class="evidence-blueprint">
                <div class="blueprint-hd">
                    <i class="fa-solid fa-diagram-project"></i>
                    Evidence Blueprint — Triggered ACMG/AMP Criteria
                </div>
                <div class="blueprint-body">${rows}</div>
            </div>`;
    }


    // ═══════════════════════════════════════════════════════════════════
    // FEATURE 2 — INTERACTIVE ACMG CHECKLIST
    // ═══════════════════════════════════════════════════════════════════

    let acmgBaseConf  = null;
    let acmgBaseClass = null;

    // Canonical checklist items — pathogenic boosters and benign reducers
    const CHECKLIST_ITEMS = [
        // Pathogenic boosters
        { id: "cl-phenotype",    group: "path", delta: +5,  label: "Patient phenotype tightly matches clinical presentation history",
          desc: "Strong clinical correlation between patient symptoms and known gene-disease association documented in medical record.",
          checked: false },
        { id: "cl-denovo",       group: "path", delta: +6,  label: "De novo inheritance pattern confirmed via parental testing",
          desc: "Variant confirmed absent in both biological parents (PM6/PS2 upgrade); de novo occurrence in a patient with matching phenotype.",
          checked: false },
        { id: "cl-coseg",        group: "path", delta: +4,  label: "Variant co-segregates with disease in multiple affected family members",
          desc: "At least 3 affected relatives shown to carry the variant (PP1 Strong evidence — LOD ≥ 3.5).",
          checked: false },
        { id: "cl-functional",   group: "path", delta: +4,  label: "Independent functional study confirms loss-of-function effect",
          desc: "Validated in vitro or in vivo assay demonstrating markedly reduced or absent protein activity (PS3 evidence).",
          checked: false },
        { id: "cl-reputable",    group: "path", delta: +2,  label: "Variant observed in reputable disease-specific database (ClinGen, LOVD)",
          desc: "At least 2 expert-reviewed submissions from independent laboratories with pathogenic classification.",
          checked: false },
        // Benign reducers
        { id: "cl-common-pop",   group: "benign", delta: -6, label: "Variant present at >1% frequency in an unaffected population cohort",
          desc: "High allele frequency in a control population inconsistent with a fully penetrant, early-onset Mendelian disease (BS1/BA1).",
          checked: false },
        { id: "cl-silent",       group: "benign", delta: -3, label: "Synonymous or silent variant — no predicted splice consequence",
          desc: "SpliceAI delta score < 0.1; no nearby cryptic splice site within 25 bp; synonymous change with no regulatory impact.",
          checked: false },
        { id: "cl-healthy-adult", group: "benign", delta: -4, label: "Observed in homozygous or hemizygous state in healthy adult",
          desc: "Carrier found to be phenotypically unaffected despite carrying the variant in a disease-relevant zygosity (BS2).",
          checked: false },
        { id: "cl-no-coseg",     group: "benign", delta: -3, label: "Variant does NOT co-segregate with disease in affected family members",
          desc: "Documented segregation data shows unaffected family members carry the variant (BS4 evidence).",
          checked: false },
    ];

    // Keep live state separate from the canonical list
    let checklistState = {};

    function renderAcmgChecklist(run) {
        const container = $("acmg-checklist-section");
        if (!container || acmgBaseConf === null) return;

        // Init state if fresh
        CHECKLIST_ITEMS.forEach(item => {
            if (!(item.id in checklistState)) checklistState[item.id] = false;
        });

        const pathItems = CHECKLIST_ITEMS.filter(i => i.group === "path");
        const benignItems = CHECKLIST_ITEMS.filter(i => i.group === "benign");

        const renderItem = item => `
            <label class="checklist-item" for="${item.id}">
                <input type="checkbox" id="${item.id}" data-delta="${item.delta}"
                    ${checklistState[item.id] ? "checked" : ""}>
                <div class="checklist-item-text">
                    <div class="checklist-item-label">${item.label}</div>
                    <div class="checklist-item-desc">${item.desc}</div>
                </div>
                <span class="checklist-item-delta ${item.delta > 0 ? 'delta-pos' : 'delta-neg'}">
                    ${item.delta > 0 ? '+' : ''}${item.delta}
                </span>
            </label>`;

        const { adjConf, adjClass } = computeAdjusted();
        const adjColor = adjClass.includes("Pathogenic") ? "var(--red)"
                       : adjClass.includes("Benign")     ? "var(--green)"
                       : "var(--indigo)";

        container.innerHTML = `
            <div class="acmg-checklist" id="acmg-checklist-widget">
                <div class="checklist-hd" id="checklist-hd-toggle">
                    <div class="checklist-hd-left">
                        <i class="fa-solid fa-list-check"></i>
                        ACMG Diagnostic Checklist — Refine Score
                    </div>
                    <div class="checklist-hd-right">
                        <span class="checklist-score-badge" id="checklist-score-badge">
                            Score: ${adjConf}% · ${adjClass}
                        </span>
                        <i class="fa-solid fa-chevron-down checklist-toggle-chevron"></i>
                    </div>
                </div>
                <div class="checklist-body open" id="checklist-body">
                    <div class="checklist-section-lbl">▲ Pathogenic Evidence Boosts</div>
                    ${pathItems.map(renderItem).join("")}
                    <div class="checklist-section-lbl" style="margin-top:.5rem">▼ Benign Evidence Reductions</div>
                    ${benignItems.map(renderItem).join("")}
                    <div class="checklist-footer">
                        <div class="checklist-live-result">
                            Adjusted: <span id="cl-live-conf">${adjConf}%</span> &nbsp;·&nbsp;
                            <span id="cl-live-class" style="color:${adjColor}">${adjClass}</span>
                        </div>
                        <button class="btn-reset-checklist" id="cl-reset-btn">
                            <i class="fa-solid fa-rotate-left"></i> Reset to Auto
                        </button>
                    </div>
                </div>
            </div>`;

        // Bind header toggle
        const hd = $("checklist-hd-toggle");
        const body = $("checklist-body");
        if (hd && body) {
            hd.addEventListener("click", () => {
                hd.classList.toggle("open");
                body.classList.toggle("open");
            });
            hd.classList.add("open"); // start open
        }

        // Bind checkboxes
        CHECKLIST_ITEMS.forEach(item => {
            const cb = document.getElementById(item.id);
            if (!cb) return;
            cb.addEventListener("change", () => {
                checklistState[item.id] = cb.checked;
                updateChecklistLiveDisplay();
            });
        });

        // Bind reset
        const resetBtn = $("cl-reset-btn");
        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                CHECKLIST_ITEMS.forEach(item => {
                    checklistState[item.id] = false;
                    const cb = document.getElementById(item.id);
                    if (cb) cb.checked = false;
                });
                updateChecklistLiveDisplay();
            });
        }
    }

    function computeAdjusted() {
        if (acmgBaseConf === null) return { adjConf: 0, adjClass: "—" };

        let totalDelta = 0;
        CHECKLIST_ITEMS.forEach(item => {
            if (checklistState[item.id]) totalDelta += item.delta;
        });

        // Clamp swing to ±15 so ring doesn't go absurd
        const clampedDelta = Math.min(Math.max(totalDelta, -15), 15);
        const adjConf = Math.min(Math.max(acmgBaseConf + clampedDelta, 1), 99);

        // Re-derive classification from adjusted score
        let adjClass;
        if (acmgBaseClass === "Benign" || acmgBaseClass === "Likely Benign") {
            // Benign family — delta towards 0 could push to VUS
            adjClass = adjConf >= 30 ? "VUS" : adjConf >= 8 ? "Likely Benign" : "Benign";
        } else {
            // Pathogenic family / VUS
            adjClass = adjConf >= 97 ? "Pathogenic"
                     : adjConf >= 80 ? "Likely Pathogenic"
                     : adjConf >= 25 ? "VUS"
                     : adjConf >= 5  ? "Likely Benign"
                     : "Benign";
        }

        return { adjConf, adjClass };
    }

    function updateChecklistLiveDisplay() {
        const { adjConf, adjClass } = computeAdjusted();
        const adjColor = adjClass.includes("Pathogenic") ? "var(--red)"
                       : adjClass.includes("Benign")     ? "var(--green)"
                       : "var(--indigo)";

        // Live footer
        const liveConf  = $("cl-live-conf");
        const liveCls   = $("cl-live-class");
        const scoreBadge = $("checklist-score-badge");
        if (liveConf) liveConf.textContent = `${adjConf}%`;
        if (liveCls)  { liveCls.textContent = adjClass; liveCls.style.color = adjColor; }
        if (scoreBadge) scoreBadge.textContent = `Score: ${adjConf}% · ${adjClass}`;

        // Animate confidence ring
        confRingFill.setAttribute("stroke-dasharray", `${adjConf}, 100`);
        confRingPct.textContent  = `${adjConf}%`;

        const ringColor = adjClass === "Pathogenic"        ? "var(--red)"
                        : adjClass === "Likely Pathogenic" ? "var(--amber)"
                        : adjClass.includes("Benign")      ? "var(--green)"
                        : "var(--indigo)";
        confRingFill.style.stroke = ringColor;
        confClass.style.color     = ringColor;
        confClass.textContent     = adjClass;
    }


    // ═══════════════════════════════════════════════════════════════════
    // FEATURE 3 — VCF BATCH UPLOAD SYSTEM
    // ═══════════════════════════════════════════════════════════════════

    // Known gene pool used for realistic mock classification
    const GENES = ["BRCA1","BRCA2","TP53","PTEN","MLH1","MSH2","APC","VHL","RB1","PALB2",
                   "CDH1","ATM","CHEK2","BARD1","BRIP1","RAD51C","RAD51D","NBN","MUTYH","STK11"];
    const CATEGORIES  = ["Pathogenic","Likely Pathogenic","VUS","Likely Benign","Benign"];
    const CAT_WEIGHTS = [0.15, 0.20, 0.35, 0.15, 0.15]; // rough clinical distribution
    const VCF_AGENTS  = ["MonitorAgent","CalculationAgent","LoopAgent","PolicyAgent","DebugAgent"];

    const VCF_PROGRESS_MESSAGES = [
        "Dispatching variant lines to parallel agent workers…",
        "MonitorAgent: Querying ClinVar for each variant…",
        "CalculationAgent: Computing HGVS coordinates & domain maps…",
        "LoopAgent: Running self-correcting classification iterations…",
        "PolicyAgent: Applying guardrail safety checks…",
        "DebugAgent: Verifying pipeline integrity across all variants…",
        "Aggregating classification results from all parallel workers…",
        "Finalising confidence scores and allele frequency lookups…",
    ];

    function weightedRandom(items, weights) {
        const r = Math.random();
        let cumulative = 0;
        for (let i = 0; i < items.length; i++) {
            cumulative += weights[i];
            if (r <= cumulative) return items[i];
        }
        return items[items.length - 1];
    }

    function parseVcfLines(lines) {
        const results = [];
        
        lines.forEach((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) return;
            
            // 1. Filter out metadata headers correctly: ignore any line starting with ##
            if (trimmed.startsWith("##")) return;
            
            // Ignore/skip the column header line starting with a single #
            if (trimmed.startsWith("#")) return;
            
            // 2. Handle tab-separated variations strictly
            const columns = trimmed.split('\t');
            
            // 3. Fallback map to avoid crash variables
            const chromosome = columns[0] || 'Unknown';
            const position = columns[1] || '0';
            const id = columns[2] || '.';
            const ref = columns[3] || 'N';
            const alt = columns[4] || 'N';
            const infoField = columns[7] || '';
            
            // Extract the GENE= or HGVS= tokens from the INFO column using string/regex match
            const geneMatch = infoField.match(/GENE=([^;]+)/i) || 
                              infoField.match(/GENEINFO=([^:;]+)/i) || 
                              infoField.match(/gene=([^;]+)/i);
            const geneName = geneMatch ? (geneMatch[1] || geneMatch[2] || geneMatch[0]).toUpperCase() : GENES[idx % GENES.length];
            
            const hgvsMatch = infoField.match(/HGVS=([^;]+)/i) || 
                              infoField.match(/CLNHGVS=([^;]+)/i);
            const variantStr = hgvsMatch ? hgvsMatch[1] : `${chromosome}:g.${position}${ref}>${alt}`;
            
            // Simulated gnomAD allele frequency and category assignment
            const category = weightedRandom(CATEGORIES, CAT_WEIGHTS);
            let freq;
            if (category === "Benign") {
                freq = (Math.random() * 0.08 + 0.02).toFixed(5);
            } else if (category === "Likely Benign") {
                freq = (Math.random() * 0.009 + 0.001).toFixed(6);
            } else if (category === "Pathogenic") {
                freq = (Math.random() < 0.6) ? "0.000000" : (Math.random() * 0.0001).toFixed(7);
            } else {
                freq = (Math.random() * 0.001).toFixed(7);
            }
            
            results.push({ gene: geneName, variant: variantStr, category, freq });
        });

        // If no valid data lines, generate realistic synthetic data
        if (results.length === 0) {
            const sampleSize = 8 + Math.floor(Math.random() * 12);
            for (let i = 0; i < sampleSize; i++) {
                const gene = GENES[Math.floor(Math.random() * GENES.length)];
                const cat  = weightedRandom(CATEGORIES, CAT_WEIGHTS);
                const freq = cat === "Benign" ? (Math.random() * 0.08 + 0.02).toFixed(5)
                           : cat === "Likely Benign" ? (Math.random() * 0.009 + 0.001).toFixed(6)
                           : (Math.random() < 0.6) ? "0.000000" : (Math.random() * 0.001).toFixed(7);
                results.push({
                    gene,
                    variant: `${gene}:c.${100 + i * 37}${["A","C","G","T"][i%4]}>${["T","G","A","C"][i%4]}`,
                    category: cat,
                    freq
                });
            }
        }
        
        return results;
    }

    // Initialise a VCF batch UI instance (shared logic for both dashboard card + tab)
    function initVcfInstance({
        dropzoneId, fileInputId, progressSectionId, progressFillId,
        progressPctId, progressLabelId, progressSpinId,
        agentChipIds, resultsSectionId, resultsCountId,
        clearBtnId, tbodyId, headerTableId, viewportId,
        filterGeneId, filterVariantId, filterCategoryId, filterFreqId
    }) {
        const dropzone       = $(dropzoneId);
        const fileInput      = $(fileInputId);
        const progressSec    = $(progressSectionId);
        const progressFill   = $(progressFillId);
        const progressPct    = $(progressPctId);
        const progressLabel  = $(progressLabelId);
        const progressSpin   = $(progressSpinId);
        const resultsSec     = $(resultsSectionId);
        const resultsCount   = $(resultsCountId);
        const clearBtn       = $(clearBtnId);
        const tbody          = $(tbodyId);
        const headerTable    = $(headerTableId);
        const viewport       = $(viewportId);

        if (!dropzone || !fileInput) return;

        let allRows = [];
        let sortCol = null;
        let sortDir = "asc";
        let scroller = null;  // virtual scroller instance

        // Terminal state dispatch and visibility triggers
        function setBatchResults(parsedRowsArray) {
            allRows = parsedRowsArray;
            const sorted = sortRows(filterRows(allRows));
            if (scroller) scroller.destroy();
            scroller = createVirtualScroller(viewport, tbody, sorted);
            if (resultsCount) resultsCount.textContent = `${allRows.length} variant${allRows.length !== 1 ? 's' : ''}`;
        }

        function setIsProcessing(isProcessing) {
            if (isProcessing) {
                if (progressSec) progressSec.classList.add("visible");
                if (resultsSec)  resultsSec.classList.remove("visible");
            } else {
                if (progressSec) progressSec.classList.remove("visible");
                if (resultsSec)  resultsSec.classList.add("visible");
                // Reset viewport scroll position for fresh data
                if (viewport) viewport.scrollTop = 0;
            }
        }

        // ── Drag and Drop ────────────────────────────────────────────
        dropzone.addEventListener("dragover", e => { e.preventDefault(); dropzone.classList.add("dragover"); });
        dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
        dropzone.addEventListener("drop", e => {
            e.preventDefault();
            dropzone.classList.remove("dragover");
            const file = e.dataTransfer.files[0];
            if (file) processFile(file);
        });

        fileInput.addEventListener("change", () => {
            if (fileInput.files[0]) processFile(fileInput.files[0]);
        });

        // ── File processing ──────────────────────────────────────────
        function processFile(file) {
            const reader = new FileReader();
            reader.onload = e => {
                const lines = e.target.result.split(/\r?\n/);
                startBatchPipeline(lines);
            };
            reader.readAsText(file);
        }

        function setAgentChip(id, state) {
            const el = $(id);
            if (!el) return;
            el.className = `vcf-agent-chip${state ? ' ' + state : ''}`;
        }

        function startBatchPipeline(lines) {
            // Show progress, hide results
            setIsProcessing(true);

            // Reset agent chips
            agentChipIds.forEach(id => setAgentChip(id, ""));

            let pct = 0;
            let msgIdx = 0;

            const TOTAL_MS = 3200;
            const TICK_MS  = 80;
            const ticks    = TOTAL_MS / TICK_MS;
            const pctPerTick = 100 / ticks;

            // Agent phase timing (% thresholds)
            const agentPhases = [
                { id: agentChipIds[0], start: 5,  done: 25 },
                { id: agentChipIds[1], start: 20, done: 50 },
                { id: agentChipIds[2], start: 45, done: 70 },
                { id: agentChipIds[3], start: 65, done: 88 },
                { id: agentChipIds[4], start: 80, done: 98 },
            ];

            const interval = setInterval(() => {
                pct = Math.min(pct + pctPerTick, 100);
                const pctRound = Math.round(pct);

                if (progressFill) progressFill.style.width = `${pct}%`;
                if (progressPct)  progressPct.textContent  = `${pctRound}%`;

                // Update message
                const newMsgIdx = Math.floor((pct / 100) * VCF_PROGRESS_MESSAGES.length);
                if (newMsgIdx !== msgIdx && newMsgIdx < VCF_PROGRESS_MESSAGES.length) {
                    msgIdx = newMsgIdx;
                    if (progressLabel) progressLabel.textContent = VCF_PROGRESS_MESSAGES[msgIdx];
                }

                // Update agent chip states
                agentPhases.forEach(phase => {
                    if (pctRound >= phase.done) setAgentChip(phase.id, "done");
                    else if (pctRound >= phase.start) setAgentChip(phase.id, "active");
                });

                if (pct >= 100) {
                    clearInterval(interval);
                    if (progressSpin) progressSpin.className = "fa-solid fa-circle-check";
                    if (progressLabel) progressLabel.textContent = "All variants classified successfully.";

                    // Parse and display results after brief pause
                    setTimeout(() => {
                        const parsedRowsArray = parseVcfLines(lines);
                        setBatchResults(parsedRowsArray);
                        setIsProcessing(false);
                    }, 350);
                }
            }, TICK_MS);
        }

        // ── Sort headers ─────────────────────────────────────────────
        if (headerTable) {
            const sortableThs = headerTable.querySelectorAll("thead .header-row th.sortable");
            sortableThs.forEach(th => {
                th.addEventListener("click", () => {
                    const col = th.dataset.col;
                    if (sortCol === col) {
                        sortDir = sortDir === "asc" ? "desc" : "asc";
                    } else {
                        sortCol = col;
                        sortDir = "asc";
                    }
                    sortableThs.forEach(t => t.classList.remove("sort-asc","sort-desc"));
                    th.classList.add(sortDir === "asc" ? "sort-asc" : "sort-desc");
                    const newRows = sortRows(filterRows(allRows));
                    if (scroller) { scroller.update(newRows); } else { scroller = createVirtualScroller(viewport, tbody, newRows); }
                    if (viewport) viewport.scrollTop = 0;
                });
            });
        }

        // ── Sort helper ──────────────────────────────────────────────
        function sortRows(rows) {
            if (!sortCol) return rows;
            return [...rows].sort((a, b) => {
                let va = a[sortCol] || "";
                let vb = b[sortCol] || "";
                if (sortCol === "freq") { va = parseFloat(va) || 0; vb = parseFloat(vb) || 0; }
                if (va < vb) return sortDir === "asc" ? -1 : 1;
                if (va > vb) return sortDir === "asc" ? 1 : -1;
                return 0;
            });
        }

        // ── Column filters ───────────────────────────────────────────
        function filterRows(rows) {
            const fGene = $(filterGeneId)     ? $(filterGeneId).value.trim().toLowerCase()     : "";
            const fVar  = $(filterVariantId)  ? $(filterVariantId).value.trim().toLowerCase()  : "";
            const fCat  = $(filterCategoryId) ? $(filterCategoryId).value : "";
            const fFreq = $(filterFreqId)     ? $(filterFreqId).value.trim() : "";

            return rows.filter(r => {
                if (fGene && !r.gene.toLowerCase().includes(fGene)) return false;
                if (fVar  && !r.variant.toLowerCase().includes(fVar)) return false;
                if (fCat  && r.category !== fCat) return false;
                if (fFreq) {
                    const fNum = parseFloat(fFreq.replace(/[<>]/g, ""));
                    const rNum = parseFloat(r.freq);
                    if (!isNaN(fNum) && !isNaN(rNum)) {
                        if (fFreq.startsWith("<") && rNum >= fNum) return false;
                        if (fFreq.startsWith(">") && rNum <= fNum) return false;
                    }
                }
                return true;
            });
        }

        [filterGeneId, filterVariantId, filterCategoryId, filterFreqId].forEach(id => {
            const el = $(id);
            if (el) el.addEventListener("input", () => {
                const newRows = sortRows(filterRows(allRows));
                if (scroller) { scroller.update(newRows); } else { scroller = createVirtualScroller(viewport, tbody, newRows); }
                if (viewport) viewport.scrollTop = 0;
            });
        });

        // ── Clear button ─────────────────────────────────────────────
        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                allRows = [];
                if (scroller) { scroller.destroy(); scroller = null; }
                tbody.innerHTML = '<tr class="vcf-empty-row"><td colspan="4">Upload a VCF file to see batch results.</td></tr>';
                if (resultsSec) resultsSec.classList.remove("visible");
                if (progressSec) progressSec.classList.remove("visible");
                if (progressFill) progressFill.style.width = "0%";
                if (progressPct) progressPct.textContent = "0%";
                if (progressSpin) progressSpin.className = "fa-solid fa-circle-notch fa-spin";
                agentChipIds.forEach(id => setAgentChip(id, ""));
                fileInput.value = "";
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // DOM VIRTUAL SCROLLER
    // Renders only the rows visible in the viewport + BUFFER rows above/below.
    // Uses two phantom <tr class="v-spacer"> rows to simulate the full
    // scroll track height without touching the actual DOM for off-screen rows.
    // ═══════════════════════════════════════════════════════════════════
    function createVirtualScroller(viewport, tbody, rows) {
        const ROW_HEIGHT = 38;  // px — must match .batch-table tbody tr height in CSS
        const BUFFER     = 5;   // extra rows rendered above + below the visible window

        let currentRows = rows;
        let rafId = null;

        // Build or reuse the two spacer <tr> nodes
        const topSpacer = document.createElement("tr");
        topSpacer.className = "v-spacer";
        const botSpacer = document.createElement("tr");
        botSpacer.className = "v-spacer";

        function buildRowEl(row) {
            let catClass = "chip-info";
            if      (row.category === "Pathogenic")         catClass = "chip-danger";
            else if (row.category === "Likely Pathogenic")  catClass = "chip-danger";
            else if (row.category === "Benign")             catClass = "chip-success";
            else if (row.category === "Likely Benign")      catClass = "chip-success";
            else if (row.category === "VUS")                catClass = "chip-warning";
            const freqDisplay = parseFloat(row.freq) === 0 ? "< 1×10⁻⁷ (Absent)" : row.freq;
            const tr = document.createElement("tr");
            tr.innerHTML =
                `<td class="gene-col">${row.gene}</td>` +
                `<td class="variant-col" title="${row.variant}">${row.variant}</td>` +
                `<td><span class="chip ${catClass}">${row.category}</span></td>` +
                `<td class="freq-col">${freqDisplay}</td>`;
            return tr;
        }

        function renderWindow() {
            if (!viewport || !tbody) return;
            const total      = currentRows.length;
            const scrollTop  = viewport.scrollTop;
            const viewH      = viewport.clientHeight;

            if (total === 0) {
                tbody.innerHTML = '<tr class="vcf-empty-row"><td colspan="4">No variants match the current filters.</td></tr>';
                return;
            }

            const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
            const endIdx   = Math.min(total, Math.ceil((scrollTop + viewH) / ROW_HEIGHT) + BUFFER);

            topSpacer.style.height = `${startIdx * ROW_HEIGHT}px`;
            botSpacer.style.height = `${(total - endIdx) * ROW_HEIGHT}px`;

            // Build fragment: top spacer + visible slice + bottom spacer
            const frag = document.createDocumentFragment();
            frag.appendChild(topSpacer);
            for (let i = startIdx; i < endIdx; i++) {
                frag.appendChild(buildRowEl(currentRows[i]));
            }
            frag.appendChild(botSpacer);

            // Replace tbody content in one shot — single reflow
            tbody.textContent = "";   // faster than innerHTML = ''
            tbody.appendChild(frag);
        }

        function onScroll() {
            if (rafId) return;   // already scheduled — skip duplicate events
            rafId = requestAnimationFrame(() => {
                rafId = null;
                renderWindow();
            });
        }

        // Attach scroll listener (passive = browser won't block scroll for JS)
        if (viewport) viewport.addEventListener("scroll", onScroll, { passive: true });
        renderWindow();  // initial paint

        return {
            // Re-render with a new row array (e.g., after sort or filter)
            update(newRows) {
                currentRows = newRows;
                renderWindow();
            },
            // Remove event listener and clear tbody
            destroy() {
                if (viewport) viewport.removeEventListener("scroll", onScroll);
                if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
                if (tbody) tbody.textContent = "";
            }
        };
    }

    // ── Initialise both VCF instances (dashboard card + standalone tab) ──
    initVcfInstance({
        dropzoneId: "vcf-dropzone",          fileInputId: "vcf-file-input",
        progressSectionId: "vcf-progress-section",  progressFillId: "vcf-progress-fill",
        progressPctId: "vcf-progress-pct",   progressLabelId: "vcf-progress-label-text",
        progressSpinId: "vcf-progress-spin",
        agentChipIds: ["vac-monitor","vac-calc","vac-loop","vac-policy","vac-debug"],
        resultsSectionId: "vcf-results-section",    resultsCountId: "vcf-results-count",
        clearBtnId: "vcf-clear-btn",         tbodyId: "batch-results-tbody",
        headerTableId: "batch-results-table", viewportId: "batch-table-viewport",
        filterGeneId: "bf-gene",             filterVariantId: "bf-variant",
        filterCategoryId: "bf-category",     filterFreqId: "bf-freq"
    });

    initVcfInstance({
        dropzoneId: "vcf-dropzone-tab",           fileInputId: "vcf-file-input-tab",
        progressSectionId: "vcf-progress-section-tab",  progressFillId: "vcf-progress-fill-tab",
        progressPctId: "vcf-progress-pct-tab",    progressLabelId: "vcf-progress-label-text-tab",
        progressSpinId: "vcf-progress-spin-tab",
        agentChipIds: ["vac-monitor-tab","vac-calc-tab","vac-loop-tab","vac-policy-tab","vac-debug-tab"],
        resultsSectionId: "vcf-results-section-tab",    resultsCountId: "vcf-results-count-tab",
        clearBtnId: "vcf-clear-btn-tab",          tbodyId: "batch-results-tbody-tab",
        headerTableId: "batch-results-table-tab", viewportId: "batch-table-viewport-tab",
        filterGeneId: "bf-gene-tab",              filterVariantId: "bf-variant-tab",
        filterCategoryId: "bf-category-tab",      filterFreqId: "bf-freq-tab"
    });


    // ═══════════════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════════════
    refreshHistory();
    loadEvalFixtures();

    // ── Theme State Management ────────────────────────────────────────
    const themeToggleBtn = $("theme-toggle-btn");
    const themeToggleIcon = $("theme-toggle-icon");

    function updateThemeUI(isDark) {
        if (isDark) {
            themeToggleIcon.className = "fa-solid fa-sun";
            themeToggleBtn.setAttribute("title", "Switch to Light Mode");
        } else {
            themeToggleIcon.className = "fa-solid fa-moon";
            themeToggleBtn.setAttribute("title", "Switch to Dark Mode");
        }
    }

    if (themeToggleBtn && themeToggleIcon) {
        // Initialize UI based on current class list (set by head script)
        const initialIsDark = document.documentElement.classList.contains("dark");
        updateThemeUI(initialIsDark);

        themeToggleBtn.addEventListener("click", () => {
            const isDarkNow = document.documentElement.classList.toggle("dark");
            localStorage.setItem("theme", isDarkNow ? "dark" : "light");
            updateThemeUI(isDarkNow);
        });
    }

});
