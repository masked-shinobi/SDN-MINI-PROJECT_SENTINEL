"use client";

import { useState, useEffect } from "react";
import { ScrollText, Layers, ShieldCheck, Ban, Filter, RefreshCw, Cpu, CheckCircle } from "lucide-react";
import { fetchFlows, FlowRuleItem } from "@/lib/api";

export default function FlowsPage() {
  const [flowsData, setFlowsData] = useState<any>(null);
  const [filterCookie, setFilterCookie] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);

  const loadFlows = async () => {
    try {
      const data = await fetchFlows();
      setFlowsData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlows();
    const interval = setInterval(loadFlows, 3000);
    return () => clearInterval(interval);
  }, []);

  const rules: FlowRuleItem[] = flowsData?.rules || [];

  const filteredRules = rules.filter((r) => {
    if (filterCookie === "QUARANTINE") return r.is_quarantine;
    if (filterCookie === "NORMAL") return !r.is_quarantine;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              Data Plane Inspection
            </span>
            <span className="text-xs text-slate-400">Open vSwitch s1 · OpenFlow 1.3 Flow Table</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-cyan-400" />
            Switch Flow Rules & Cookie Diff Viewer
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real OpenFlow 1.3 match-action entries installed by the Ryu controller. Quarantine rules use dedicated Cookie <code className="text-red-400 font-mono">0x9000</code>.
          </p>
        </div>

        <button
          onClick={loadFlows}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-border transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Table
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card/80 backdrop-blur">
          <div className="text-xs text-slate-400 uppercase font-semibold">Total Active Flows</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {flowsData?.total_rules ?? 0} Entries
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">Switch DPID: 0000000000000001</div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/80 backdrop-blur">
          <div className="text-xs text-slate-400 uppercase font-semibold">Quarantine Rules (0x9000)</div>
          <div className={`text-2xl font-bold font-mono mt-1 ${flowsData?.quarantine_rules_count ? "text-red-400" : "text-slate-500"}`}>
            {flowsData?.quarantine_rules_count ?? 0} Rules
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {flowsData?.quarantine_active ? (
              <span className="text-red-400 font-bold flex items-center gap-1">
                <Ban className="h-3 w-3" /> Quarantine Enforcement Active
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> No Active Quarantine Drops
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card/80 backdrop-blur">
          <div className="text-xs text-slate-400 uppercase font-semibold">Normal Forwarding (0x1000)</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {flowsData?.normal_rules_count ?? 0} Rules
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">L2 MAC Learning & Table-Miss</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Filter className="h-4 w-4 text-slate-400" />
        <span className="text-xs text-slate-400 font-semibold mr-2">Filter Cookie:</span>
        <button
          onClick={() => setFilterCookie("ALL")}
          className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-all ${
            filterCookie === "ALL" ? "bg-cyan-950 text-cyan-300 border border-cyan-700" : "text-slate-400 hover:text-white"
          }`}
        >
          ALL ({rules.length})
        </button>
        <button
          onClick={() => setFilterCookie("QUARANTINE")}
          className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-all ${
            filterCookie === "QUARANTINE" ? "bg-red-950 text-red-300 border border-red-700" : "text-slate-400 hover:text-white"
          }`}
        >
          QUARANTINE 0x9000 ({flowsData?.quarantine_rules_count ?? 0})
        </button>
        <button
          onClick={() => setFilterCookie("NORMAL")}
          className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-all ${
            filterCookie === "NORMAL" ? "bg-emerald-950 text-emerald-300 border border-emerald-700" : "text-slate-400 hover:text-white"
          }`}
        >
          NORMAL 0x1000 ({flowsData?.normal_rules_count ?? 0})
        </button>
      </div>

      {/* Flow Table */}
      <div className="rounded-xl border border-border bg-card/80 backdrop-blur overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                <th className="py-3 px-3">Cookie</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-4">Match Condition</th>
                <th className="py-3 px-4">Actions</th>
                <th className="py-3 px-3">Packets / Bytes</th>
                <th className="py-3 px-4">Policy Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredRules.map((rule, idx) => {
                const isQuar = rule.is_quarantine;
                const isDrop = rule.actions.length === 0;

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isQuar ? "bg-red-950/20" : ""
                    }`}
                  >
                    {/* Cookie */}
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          isQuar
                            ? "bg-red-950 text-red-400 border border-red-800"
                            : "bg-cyan-950 text-cyan-400 border border-cyan-800"
                        }`}
                      >
                        {rule.cookie}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-3 font-bold text-white">
                      <span className={rule.priority >= 400 ? "text-amber-400" : "text-slate-400"}>
                        {rule.priority}
                      </span>
                    </td>

                    {/* Match */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        {Object.entries(rule.match).map(([k, v]) => (
                          <div key={k} className="text-slate-200">
                            <span className="text-cyan-400 font-semibold">{k}</span> = <span>{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      {isDrop ? (
                        <span className="px-2 py-1 rounded bg-red-950 text-red-400 border border-red-800 font-bold text-[11px]">
                          DROP
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          {rule.actions.map((act, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px]">
                              {act.type}:{act.port}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Packets / Bytes */}
                    <td className="py-3 px-3 text-slate-300">
                      <div>{rule.packet_count} pkts</div>
                      <div className="text-[10px] text-slate-500">{rule.byte_count} B</div>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 text-slate-300 text-[11px]">
                      {rule.description || "Switch forwarding entry"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
