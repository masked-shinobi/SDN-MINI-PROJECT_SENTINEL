"use client";

import { Handle, Position } from "@xyflow/react";
import { Network, Layers } from "lucide-react";

export default function SwitchNode({ data }: { data: any }) {
  return (
    <div className="px-5 py-4 rounded-xl border-2 border-cyan-500/60 bg-slate-900/95 min-w-[240px] shadow-2xl backdrop-blur glow-cyan">
      <Handle type="target" position={Position.Top} className="!bg-cyan-400 !w-3 !h-3" />

      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">{data.label}</div>
            <div className="text-[10px] text-cyan-400 font-mono">DPID: 0000000000000001</div>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
          OF 1.3
        </span>
      </div>

      <div className="pt-2 border-t border-slate-700/60 space-y-1.5 text-xs font-mono">
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1 text-[11px] text-slate-400">
            <Layers className="h-3 w-3 text-cyan-400" /> Active Flows:
          </span>
          <span className="text-cyan-400 font-bold">{data.flow_count || 4} Rules</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Switch Ports:</span>
          <span className="text-slate-300">Port 1 (h1) · Port 2 (h2) · Port 3 (h3)</span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400 !w-3 !h-3" />
    </div>
  );
}
