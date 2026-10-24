"use client";

import { Handle, Position } from "@xyflow/react";
import { Laptop, AlertTriangle, ShieldCheck, Ban, Sparkles } from "lucide-react";

export default function HostNode({ data }: { data: any }) {
  const isQuarantined = data.status === "QUARANTINED";
  const isDetected = data.status === "DETECTED";
  const isInfected = data.role === "infected";
  const isRestored = data.status === "RESTORED";

  let borderStyle = "border-slate-700 bg-slate-900/90";
  let iconColor = "text-slate-300";

  if (isQuarantined) {
    borderStyle = "border-red-500 bg-red-950/70 glow-red pulse-quarantine";
    iconColor = "text-red-400";
  } else if (isDetected) {
    borderStyle = "border-amber-500 bg-amber-950/70 glow-amber";
    iconColor = "text-amber-400";
  } else if (isRestored && isInfected) {
    borderStyle = "border-emerald-500 bg-emerald-950/70 glow-green";
    iconColor = "text-emerald-400";
  } else if (isInfected) {
    borderStyle = "border-slate-600 bg-slate-900/90";
    iconColor = "text-slate-300";
  }

  return (
    <div className={`px-4 py-3 rounded-xl border-2 ${borderStyle} min-w-[200px] shadow-xl backdrop-blur transition-all duration-300`}>
      <Handle type="target" position={Position.Top} className="!bg-cyan-500 !w-3 !h-3" />

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg bg-black/40 ${iconColor}`}>
            <Laptop className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide">{data.label}</div>
            <div className="text-[10px] text-slate-400 font-mono">{data.mac}</div>
          </div>
        </div>

        {/* State Badge */}
        {isQuarantined && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded-full border border-red-500/60">
            <Ban className="h-3 w-3" /> ISOLATED
          </span>
        )}
        {isDetected && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/60">
            <AlertTriangle className="h-3 w-3" /> SCANNING
          </span>
        )}
        {isRestored && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/60">
            <Sparkles className="h-3 w-3" /> CLEAN
          </span>
        )}
        {!isQuarantined && !isDetected && !isRestored && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded-full border border-cyan-800">
            <ShieldCheck className="h-3 w-3" /> NORMAL
          </span>
        )}
      </div>

      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
        <span className="text-cyan-300 font-semibold">{data.ip}</span>
        <span className="text-slate-400 text-[11px]">{data.packet_rate || 0} pkt/s</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-cyan-500 !w-3 !h-3" />
    </div>
  );
}
