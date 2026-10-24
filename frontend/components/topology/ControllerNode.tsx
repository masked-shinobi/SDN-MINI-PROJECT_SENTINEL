"use client";

import { Handle, Position } from "@xyflow/react";
import { Cpu, Radio, Shield } from "lucide-react";

export default function ControllerNode({ data }: { data: any }) {
  return (
    <div className="px-5 py-3.5 rounded-xl border-2 border-purple-500/70 bg-purple-950/40 min-w-[230px] shadow-2xl backdrop-blur">
      <Handle type="target" position={Position.Top} className="!bg-purple-400 !w-3 !h-3" />

      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-950 text-purple-400 border border-purple-800">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">{data.label}</div>
            <div className="text-[10px] text-purple-300 font-mono">Control Plane Orchestrator</div>
          </div>
        </div>

        <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-900 text-purple-300 border border-purple-600">
          <Radio className="h-2.5 w-2.5 animate-pulse text-purple-300" /> ACTIVE
        </span>
      </div>

      <div className="pt-2 border-t border-purple-500/20 flex items-center justify-between text-xs font-mono text-purple-200">
        <span>OF 1.3: TCP 6633</span>
        <span>REST: 8080</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-purple-400 !w-3 !h-3" />
    </div>
  );
}
