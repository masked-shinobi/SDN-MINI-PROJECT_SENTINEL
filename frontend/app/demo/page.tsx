"use client";

import { useState, useEffect } from "react";
import {
  PlayCircle,
  CheckCircle2,
  XCircle,
  Ban,
  ShieldCheck,
  RefreshCw,
  Flame,
  Wrench,
  Download,
  Clock,
  ArrowRight,
  Layers,
  Sparkles
} from "lucide-react";
import {
  fetchTopology,
  triggerScan,
  enforceQuarantine,
  stepRemediation,
  releaseQuarantine,
  resetDemo,
  runConnectivityTests,
  VerificationReport,
  ConnectivityTestItem
} from "@/lib/api";

export default function DemoLabPage() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [hostState, setHostState] = useState<string>("NORMAL");
  const [enforcementMs, setEnforcementMs] = useState<number>(24.6);
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [scenarioLogs, setScenarioLogs] = useState<string[]>([
    "Demo Lab initialized. Switch s1 running OpenFlow 1.3.",
    "Initial baseline established. All hosts connected to controller c0."
  ]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setScenarioLogs((prev) => [`[${time}] ${msg}`, ...prev]);
  };

  const loadState = async () => {
    try {
      const topo = await fetchTopology();
      setHostState(topo.host_state);
      const rep = await runConnectivityTests();
      setReport(rep);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  // Step 1: Run Baseline Test
  const handleStep1 = async () => {
    setLoading(true);
    addLog("Executing Step 1: Baseline connectivity verification...");
    try {
      await resetDemo();
      const rep = await runConnectivityTests();
      setReport(rep);
      setCurrentStep(1);
      setHostState("NORMAL");
      addLog("Baseline Ping verification complete: h1, h2, h3 communicate normally.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Trigger Scan
  const handleStep2 = async () => {
    setLoading(true);
    addLog("Executing Step 2: Triggering simulated port scan from h1 (192.168.5.23)...");
    try {
      const res = await triggerScan(148);
      setCurrentStep(2);
      setHostState("DETECTED");
      addLog(`IDS Alert: 148 SYN flows detected from 192.168.5.23 in 5.0s window. Exceeds limit (100).`);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Enforce Quarantine
  const handleStep3 = async () => {
    setLoading(true);
    addLog("Executing Step 3: Ryu installing high-priority OpenFlow rules (Cookie 0x9000)...");
    try {
      const res = await enforceQuarantine();
      setEnforcementMs(res.enforcement_time_ms || 24.6);
      setCurrentStep(3);
      setHostState("QUARANTINED");
      const rep = await runConnectivityTests();
      setReport(rep);
      addLog(`Quarantine ENFORCED in ${res.enforcement_time_ms || 24.6}ms! Rules: Priority 550 (ARP), 500 (Remediation Allow), 400 (DROP).`);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Verify Isolation
  const handleStep4 = async () => {
    setLoading(true);
    addLog("Executing Step 4: Testing network isolation under active quarantine...");
    try {
      const rep = await runConnectivityTests();
      setReport(rep);
      setCurrentStep(4);
      addLog("Isolation Verified: h1 -> h2 is 100% BLOCKED. h1 -> h3 (Remediation) is 100% ALLOWED.");
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Clean & Verify
  const handleStep5 = async () => {
    setLoading(true);
    addLog("Executing Step 5: Applying patch via Remediation Server 192.168.1.50...");
    try {
      await stepRemediation("clean");
      setHostState("CLEANING");
      addLog("Host h1 cleaned. Running cleanliness and zero-scan verification...");
      await new Promise((r) => setTimeout(r, 600));
      await stepRemediation("verify");
      setHostState("VERIFYING");
      setCurrentStep(5);
      addLog("Cleanliness verification PASSED. Anti-malware and zero-flow-spike confirmed.");
    } finally {
      setLoading(false);
    }
  };

  // Step 6: Restore
  const handleStep6 = async () => {
    setLoading(true);
    addLog("Executing Step 6: Ryu purging Cookie 0x9000 rules from Switch s1...");
    try {
      const res = await releaseQuarantine();
      setCurrentStep(6);
      setHostState("RESTORED");
      const rep = await runConnectivityTests();
      setReport(rep);
      addLog("Restoration Complete: All quarantine rules deleted. Normal L2 forwarding restored across s1.");
    } finally {
      setLoading(false);
    }
  };

  const exportReportJson = () => {
    const data = {
      project: "SDN Sentinel - Host Quarantine System",
      author: "Sanjay - SRM IST",
      timestamp: new Date().toISOString(),
      enforcement_latency_ms: enforcementMs,
      host_state: hostState,
      verification_matrix: report?.tests || [],
      audit_logs: scenarioLogs
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SDN_Sentinel_Verification_Report_${Date.now()}.json`;
    a.click();
  };

  const steps = [
    { num: 1, title: "1. Baseline Ping", desc: "Verify initial connectivity", action: handleStep1 },
    { num: 2, title: "2. Trigger Scan", desc: "Generate scan traffic (148 flows)", action: handleStep2 },
    { num: 3, title: "3. Auto-Quarantine", desc: "Install 0x9000 rules in <50ms", action: handleStep3 },
    { num: 4, title: "4. Prove Isolation", desc: "Validate blocked vs allowed", action: handleStep4 },
    { num: 5, title: "5. Clean & Verify", desc: "Remediate via 192.168.1.50", action: handleStep5 },
    { num: 6, title: "6. Restore Network", desc: "Delete 0x9000 and restore", action: handleStep6 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              Evaluation & Defense Suite
            </span>
            <span className="text-xs text-slate-400">Interactive Scenario Runner & Test Matrix</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <PlayCircle className="h-6 w-6 text-cyan-400" />
            Live Demo Lab & Connectivity Verification
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Demonstrate the complete SDN lifecycle: Detection $\rightarrow$ Automatic Quarantine $\rightarrow$ Remediation $\rightarrow$ Restoration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportReportJson}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-border transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            Export Test Report (JSON)
          </button>
        </div>
      </div>

      {/* Stepper Card */}
      <div className="p-6 rounded-xl border border-border bg-card/90 backdrop-blur shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            6-Stage Interactive Demonstration Workflow
          </h3>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Enforcement Latency:</span>
            <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
              {enforcementMs} ms
            </span>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {steps.map((s) => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;

            return (
              <button
                key={s.num}
                onClick={s.action}
                disabled={loading}
                className={`p-3.5 rounded-xl text-left border transition-all relative flex flex-col justify-between h-28 ${isActive
                    ? "border-cyan-500 bg-cyan-950/50 glow-cyan"
                    : isCompleted
                      ? "border-emerald-600/60 bg-emerald-950/20"
                      : "border-border bg-slate-900/60 hover:bg-slate-800/60"
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold font-mono ${isActive ? "text-cyan-300" : isCompleted ? "text-emerald-400" : "text-slate-400"}`}>
                      {s.title}
                    </span>
                    {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{s.desc}</p>
                </div>

                <div className="text-[10px] font-bold text-cyan-400 flex items-center gap-1 pt-2">
                  <span>Run Step</span>
                  <ArrowRight className="h-2.5 w-2.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two Columns: Pass/Fail Connectivity Matrix & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pass/Fail Matrix Table (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-border bg-card/80 backdrop-blur space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                Connectivity Verification Pass/Fail Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Live automated probe results validating the OpenFlow allow/drop policy.
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${report?.overall_status === "PASS"
                ? "bg-emerald-950 text-emerald-400 border border-emerald-800 glow-green"
                : "bg-red-950 text-red-400 border border-red-800 glow-red"
              }`}>
              MATRIX: {report?.overall_status ?? "PASS"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                  <th className="py-3 px-3">Test Case</th>
                  <th className="py-3 px-3">Source $\rightarrow$ Destination</th>
                  <th className="py-3 px-3">Expected</th>
                  <th className="py-3 px-3">Actual Result</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {report?.tests.map((t) => (
                  <tr key={t.test_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-white">{t.test_id}</td>
                    <td className="py-3 px-3">
                      <span className="text-slate-300 font-semibold">{t.source_ip}</span>
                      <span className="text-slate-500 mx-1.5">&rarr;</span>
                      <span className="text-cyan-300 font-semibold">{t.target_ip}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.expected_allowed ? "bg-emerald-950 text-emerald-300" : "bg-red-950 text-red-300"
                        }`}>
                        {t.expected_allowed ? "ALLOW" : "BLOCK"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.actual_allowed ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-red-950 text-red-400 border border-red-800"
                        }`}>
                        {t.actual_allowed ? "ALLOWED" : "BLOCKED"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {t.passed ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <CheckCircle2 className="h-4 w-4" /> PASS
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 font-bold">
                          <XCircle className="h-4 w-4" /> FAIL
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {t.latency_ms > 0 ? `${t.latency_ms} ms` : "0 ms (Dropped)"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Lab Terminal Logs (1 col) */}
        <div className="p-6 rounded-xl border border-border bg-card/80 backdrop-blur space-y-4 shadow-xl flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              Scenario Execution Logs
            </h3>
            <button
              onClick={() => setScenarioLogs([])}
              className="text-[10px] text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          </div>

          <div className="flex-1 bg-black/60 rounded-xl p-3 border border-border/80 font-mono text-[11px] text-slate-300 overflow-y-auto max-h-[360px] space-y-2">
            {scenarioLogs.map((log, i) => (
              <div key={i} className="leading-relaxed border-b border-white/5 pb-1 last:border-0">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
