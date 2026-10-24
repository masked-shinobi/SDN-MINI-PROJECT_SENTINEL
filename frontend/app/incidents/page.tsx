"use client";

import { useState, useEffect } from "react";
import {
  ShieldAlert,
  Flame,
  Sliders,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight
} from "lucide-react";
import { fetchIncidents, updateThreshold, triggerScan, IncidentItem } from "@/lib/api";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [currentFlowRate, setCurrentFlowRate] = useState<number>(14);
  const [threshold, setThreshold] = useState<number>(100);
  const [sliderVal, setSliderVal] = useState<number>(100);
  const [hostState, setHostState] = useState<string>("NORMAL");
  const [triggering, setTriggering] = useState<boolean>(false);
  const [savingThreshold, setSavingThreshold] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const data = await fetchIncidents();
      setIncidents(data.incidents || []);
      setCurrentFlowRate(data.current_flow_rate || 14);
      setThreshold(data.threshold || 100);
      setHostState(data.host_state || "NORMAL");
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleThresholdSave = async () => {
    setSavingThreshold(true);
    try {
      await updateThreshold(sliderVal);
      setThreshold(sliderVal);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingThreshold(false);
    }
  };

  const handleTriggerScan = async (flowCount = 148) => {
    setTriggering(true);
    try {
      await triggerScan(flowCount);
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setTriggering(false);
    }
  };

  const isExceeded = currentFlowRate > threshold;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded bg-amber-950 text-amber-400 border border-amber-800">
            Application Plane IDS
          </span>
          <span className="text-xs text-slate-400">Sliding Window Traffic Anomaly Engine</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-amber-400" />
          Threat Detection & Flow-Rate Telemetry
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitors new-flow generation per host. If an infected endpoint initiates rapid scanning exceeding the threshold,
          an automated quarantine signal is transmitted to the Ryu controller.
        </p>
      </div>

      {/* Control Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Flow Rate Monitor */}
        <div className="p-6 rounded-xl border border-border bg-card/80 backdrop-blur space-y-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Host h1 Flow Generation</span>
            <Flame className={`h-5 w-5 ${isExceeded ? "text-red-400 animate-pulse" : "text-amber-400"}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black font-mono ${isExceeded ? "text-red-400" : "text-cyan-400"}`}>
              {currentFlowRate}
            </span>
            <span className="text-xs text-slate-400 font-mono">flows / 5.0s window</span>
          </div>

          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${isExceeded ? "bg-red-500 glow-red" : "bg-cyan-500 glow-cyan"}`}
              style={{ width: `${Math.min((currentFlowRate / 200) * 100, 100)}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Threshold Limit: <strong className="text-white">{threshold} flows</strong></span>
            <span>Status: <strong className={isExceeded ? "text-red-400" : "text-emerald-400"}>{isExceeded ? "VIOLATION" : "NORMAL"}</strong></span>
          </div>
        </div>

        {/* Card 2: Configurable Threshold Slider */}
        <div className="p-6 rounded-xl border border-border bg-card/80 backdrop-blur space-y-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">IDS Threshold Configuration</span>
            <Sliders className="h-5 w-5 text-cyan-400" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Trigger Limit:</span>
              <span className="text-cyan-400 font-bold">{sliderVal} new flows / 5s</span>
            </div>
            <input
              type="range"
              min="30"
              max="300"
              step="10"
              value={sliderVal}
              onChange={(e) => setSliderVal(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>30 (Strict)</span>
              <span>100 (Default)</span>
              <span>300 (Permissive)</span>
            </div>
          </div>

          <button
            onClick={handleThresholdSave}
            disabled={savingThreshold || sliderVal === threshold}
            className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-semibold text-xs transition-all"
          >
            {savingThreshold ? "Updating..." : "Apply Threshold"}
          </button>
        </div>

        {/* Card 3: Port-Scan Simulator */}
        <div className="p-6 rounded-xl border border-border bg-card/80 backdrop-blur space-y-4">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Attack Generator</span>
            <Flame className="h-5 w-5 text-red-400" />
          </div>

          <p className="text-xs text-slate-400">
            Simulates an Nmap TCP SYN scan originating from <strong className="text-white">192.168.5.23</strong> across the entire subnet range.
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => handleTriggerScan(145)}
              disabled={triggering || hostState === "QUARANTINED"}
              className="w-full py-2 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-300 font-semibold text-xs glow-red transition-all disabled:opacity-40"
            >
              {triggering ? "Generating Traffic..." : "Trigger Port Scan (145 Flows)"}
            </button>
            <button
              onClick={() => handleTriggerScan(45)}
              disabled={triggering || hostState === "QUARANTINED"}
              className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs transition-all disabled:opacity-40"
            >
              Send Low-Volume Probe (45 Flows - Below Limit)
            </button>
          </div>
        </div>
      </div>

      {/* Incident History Table */}
      <div className="p-6 rounded-xl border border-border bg-card/80 backdrop-blur space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            Security Incident Log & Quarantine Triggers
          </h3>
          <span className="text-xs font-mono text-slate-400">{incidents.length} Recorded Events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border text-slate-400 uppercase text-[10px]">
                <th className="py-3 px-3">Incident ID</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Source IP</th>
                <th className="py-3 px-3">Flows / Window</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Enforcement Latency</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {incidents.length > 0 ? (
                incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-cyan-300 font-bold">{inc.id}</td>
                    <td className="py-3 px-3 text-slate-400">{inc.timestamp}</td>
                    <td className="py-3 px-3 text-red-400 font-bold">{inc.source_ip}</td>
                    <td className="py-3 px-3 text-white">
                      {inc.new_flows} / {inc.window_seconds}s (Limit: {inc.threshold})
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">
                        {inc.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">
                      {inc.enforcement_time_ms ? `${inc.enforcement_time_ms} ms` : "Pending"}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {inc.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No security incidents recorded. Trigger a scan above to see real-time alert correlation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
