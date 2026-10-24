"use client";

import { Handle, Position } from "@xyflow/react";
import { Server, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function ServerNode({ data }: { data: any }) {
  return (
    <div className="px-4 py-3 rounded-xl border-2 border-emerald-500/70 bg-emerald-950/40 min-w-[220px] shadow-xl backdrop-blur glow-green">
      <Handle type="target" position={Position.Top} className="!bg-emerald-400 !w-3 !h-3" />

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
            <Server className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide">{data.label}</div>
            <div className="text-[10px] text-emerald-300 font-mono">Remediation Server</div>
          </div>
        </div>

        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-500/60">
          <ShieldCheck className="h-3 w-3" /> ALLOWED
        </span>
      </div>

      <div className="pt-2 border-t border-emerald-500/20 space-y-1 text-xs font-mono">
        <div className="flex items-center justify-between">
          <span className="text-emerald-300 font-bold">{data.ip}</span>
          <span className="text-[10px] text-emerald-400">Subnet B</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-emerald-200/80">
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          <span>HTTP :80 · SSH :22 · Patch Server</span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-emerald-400 !w-3 !h-3" />
    </div>
  );
}
