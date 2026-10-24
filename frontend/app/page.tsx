"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Network,
  Cpu,
  Layers,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Clock,
  Activity,
  PlayCircle,
  FileText
} from "lucide-react";
import { fetchTopology, fetchFlows, fetchIncidents, TopologyData, FlowRuleItem, IncidentItem } from "@/lib/api";

export default function SecurityOverviewPage() {
  const [topology, setTopology] = useState<TopologyData | null>(null);
  const [flows, setFlows] = useState<any>(null);
  const [incidentsData, setIncidentsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [topo, flws, incs] = await Promise.all([
          fetchTopology().catch(() => null),
          fetchFlows().catch(() => null),
          fetchIncidents().catch(() => null),
        ]);
        setTopology(topo);
        setFlows(flws);
        setIncidentsData(incs);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  const hostState = topology?.host_state || "NORMAL";
  const isQuarantined = hostState === "QUARANTINED" || hostState === "CLEANING" || hostState === "VERIFYING";
  const isDetected = hostState === "DETECTED";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-card via-[#0e1729] to-card p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                SDN Sentinel v1.0 · SRM IST
              </span>
              <span className="text-xs text-slate-400">Software Defined Networks Project</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Automated Host Quarantine & Remediation
            </h1>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl">
              An interactive security operations platform demonstrating rapid OpenFlow 1.3 host isolation,
              remediation allowlisting (192.168.1.50), and non-disruptive restoration on Open vSwitch and Ryu.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/topology"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm shadow-lg shadow-cyan-600/30 transition-all glow-cyan"
            >
              <Network className="h-4 w-4" />
              Live Topology
            </Link>
            <Link
              href="/demo"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all"
            >
              <PlayCircle className="h-4 w-4 text-cyan-400" />
              Demo Lab & Tests
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-xl border border-border bg-card/80 backdrop-blur shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Compromised Host</span>
            <AlertTriangle className={`h-5 w-5 ${isQuarantined ? "text-red-400" : isDetected ? "text-amber-400" : "text-slate-500"}`} />
          </div>
          <div className="text-2xl font-bold font-mono text-white">192.168.5.23</div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className={`px-2 py-0.5 rounded font-bold ${isQuarantined
                ? "bg-red-950 text-red-400 border border-red-800"
                : isDetected
                  ? "bg-amber-950 text-amber-400 border border-amber-800"
                  : "bg-emerald-950 text-emerald-400 border border-emerald-800"
              }`}>
              {hostState}
            </span>
            <span className="text-slate-400">Host h1</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-xl border border-border bg-card/80 backdrop-blur shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Flow Rules</span>
            <Layers className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {flows?.total_rules ?? 4} Rules
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>Quarantine: <strong className="text-red-400">{flows?.quarantine_rules_count ?? 0}</strong></span>
            <span>Normal: <strong className="text-slate-200">{flows?.normal_rules_count ?? 4}</strong></span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-xl border border-border bg-card/80 backdrop-blur shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Remediation Server</span>
            <Lock className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">192.168.1.50</div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Always Reachable via Priority 500</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-xl border border-border bg-card/80 backdrop-blur shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Control Plane</span>
            <Cpu className="h-5 w-5 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">Ryu OF 1.3</div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>REST API Active · DPID 1</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Architecture Stages & Event Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quarantine Workflow Explained (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-xl border border-border bg-card/80 backdrop-blur">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              Four-Stage Automated Enforcement Lifecycle
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-black/40 border border-white/5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-950 text-amber-400 border border-amber-800 flex items-center justify-center font-bold text-xs">
                    1
                  </span>
                  <h4 className="text-sm font-bold text-slate-200">Detect</h4>
                </div>
                <p className="text-xs text-slate-400">
                  IDS monitors flow rates. When 192.168.5.23 exceeds the sliding-window threshold (&gt;100 flows/5s), an alert event is posted.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-black/40 border border-white/5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-red-950 text-red-400 border border-red-800 flex items-center justify-center font-bold text-xs">
                    2
                  </span>
                  <h4 className="text-sm font-bold text-slate-200">Quarantine</h4>
                </div>
                <p className="text-xs text-slate-400">
                  Controller injects OpenFlow drop rules (Priority 400, Cookie 0x9000) isolating 192.168.5.23 without dropping the physical link.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-black/40 border border-white/5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold text-xs">
                    3
                  </span>
                  <h4 className="text-sm font-bold text-slate-200">Remediate</h4>
                </div>
                <p className="text-xs text-slate-400">
                  Bidirectional allowlist rules (Priority 500) ensure h1 can communicate exclusively with Remediation Server 192.168.1.50.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-black/40 border border-white/5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold text-xs">
                    4
                  </span>
                  <h4 className="text-sm font-bold text-slate-200">Restore</h4>
                </div>
                <p className="text-xs text-slate-400">
                  Following verification, controller deletes Cookie 0x9000 rules in &lt;15ms. Normal communication across s1 resumes.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">OpenFlow Switch: s1 (OVS) · Cookie: 0x9000</span>
              <Link
                href="/topology"
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                Inspect Live Canvas <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Incident Stream */}
        <div className="p-6 rounded-xl border border-border bg-card/80 backdrop-blur space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              Live Security Audit Trail
            </h3>
            <Link href="/incidents" className="text-xs text-cyan-400 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {incidentsData?.incidents && incidentsData.incidents.length > 0 ? (
              incidentsData.incidents.slice(0, 3).map((inc: IncidentItem) => (
                <div
                  key={inc.id}
                  className="p-3.5 rounded-lg bg-black/40 border border-border/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-cyan-300 font-bold">{inc.id}</span>
                    <span className="text-[10px] text-slate-400">{inc.timestamp}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200">{inc.event_type}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Source: <span className="text-red-400">{inc.source_ip}</span> · Flows: {inc.new_flows}/5s
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 uppercase font-bold">
                      {inc.severity}
                    </span>
                    {inc.enforcement_time_ms && (
                      <span className="text-emerald-400 font-mono">Enforced in {inc.enforcement_time_ms}ms</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 rounded-lg bg-black/30 border border-border">
                No active threats detected. System is running in baseline NORMAL state.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
