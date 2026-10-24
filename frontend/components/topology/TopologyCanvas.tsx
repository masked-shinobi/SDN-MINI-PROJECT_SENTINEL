"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import HostNode from "./HostNode";
import SwitchNode from "./SwitchNode";
import ServerNode from "./ServerNode";
import ControllerNode from "./ControllerNode";
import {
  fetchTopology,
  triggerScan,
  enforceQuarantine,
  stepRemediation,
  releaseQuarantine,
  resetDemo,
  TopologyData,
} from "@/lib/api";
import {
  ShieldAlert,
  Ban,
  Wrench,
  CheckCircle,
  RefreshCw,
  Flame,
  Info,
  X,
  ExternalLink,
} from "lucide-react";

export default function TopologyCanvas() {
  const [topology, setTopology] = useState<TopologyData | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const nodeTypes = useMemo(
    () => ({
      HOST: HostNode,
      SWITCH: SwitchNode,
      SERVER: ServerNode,
      CONTROLLER: ControllerNode,
    }),
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchTopology();
      setTopology(data);

      const isQuarantined =
        data.host_state === "QUARANTINED" ||
        data.host_state === "CLEANING" ||
        data.host_state === "VERIFYING";
      const isDetected = data.host_state === "DETECTED";

      // Fixed positions for clean network graph presentation
      const layoutPositions: Record<string, { x: number; y: number }> = {
        c0: { x: 380, y: 30 },
        s1: { x: 380, y: 200 },
        h1: { x: 80, y: 390 },
        h2: { x: 380, y: 400 },
        h3: { x: 680, y: 390 },
      };

      const flowNodes = data.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: layoutPositions[n.id] || { x: 100, y: 100 },
        data: {
          ...n,
          status: n.id === "h1" ? data.host_state : n.status,
        },
      }));

      const flowEdges = data.edges.map((e) => {
        let strokeColor = "#06b6d4"; // default cyan
        let strokeWidth = 2;
        let animated = true;
        let label = e.label;
        let strokeDasharray = undefined;

        if (e.id === "e-s1-h1") {
          if (isQuarantined) {
            strokeColor = "#ef4444"; // Red drop
            strokeWidth = 3;
            label = "BLOCKED (Priority 400 DROP)";
            strokeDasharray = "5,5";
          } else if (isDetected) {
            strokeColor = "#f59e0b"; // Amber scanning
            strokeWidth = 3;
            label = "SCANNING DETECTED";
          }
        } else if (e.id === "e-s1-h3") {
          if (isQuarantined) {
            strokeColor = "#10b981"; // Emerald remediation allowed
            strokeWidth = 3;
            label = "REMEDIATION ALLOWED (Priority 500)";
          }
        } else if (e.id === "e-c0-s1") {
          strokeColor = "#a855f7"; // Purple control plane
          strokeWidth = 2;
          strokeDasharray = "4,4";
        }

        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: label,
          animated: animated,
          style: {
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            strokeDasharray: strokeDasharray,
          },
          labelStyle: {
            fill: strokeColor,
            fontWeight: 700,
            fontSize: 10,
            fontFamily: "monospace",
          },
          labelBgStyle: {
            fill: "#090d16",
            fillOpacity: 0.9,
            stroke: strokeColor,
            strokeWidth: 1,
          },
        };
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (e) {
      console.error("Topology fetch error:", e);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2500);
    return () => clearInterval(interval);
  }, [loadData]);

  const onNodeClick = (_: any, node: any) => {
    setSelectedNode(node.data);
  };

  const handleAction = async (action: string) => {
    setLoadingAction(action);
    try {
      if (action === "scan") await triggerScan(148);
      if (action === "quarantine") await enforceQuarantine();
      if (action === "clean") await stepRemediation("clean");
      if (action === "verify") await stepRemediation("verify");
      if (action === "release") await releaseQuarantine();
      if (action === "reset") await resetDemo();
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAction(null);
    }
  };

  const hostState = topology?.host_state || "NORMAL";

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-background overflow-hidden flex flex-col">
      {/* Action Control Header */}
      <div className="bg-card/90 border-b border-border px-6 py-3 flex flex-wrap items-center justify-between gap-4 z-10 backdrop-blur">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>SDN Sentinel Live Topology</span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
              Mininet + Open vSwitch s1
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time OpenFlow 1.3 flow table routing & automated quarantine enforcement
          </p>
        </div>

        {/* Live Scenario Quick Triggers */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. Trigger Scan */}
          <button
            onClick={() => handleAction("scan")}
            disabled={loadingAction !== null || hostState === "QUARANTINED"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/50 transition-all disabled:opacity-40"
          >
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            1. Trigger Scan (h1)
          </button>

          {/* 2. Enforce Quarantine */}
          <button
            onClick={() => handleAction("quarantine")}
            disabled={loadingAction !== null || hostState === "QUARANTINED"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/50 glow-red transition-all disabled:opacity-40"
          >
            <Ban className="h-3.5 w-3.5 text-red-400" />
            2. Enforce Quarantine (s1)
          </button>

          {/* 3. Clean & Verify */}
          <button
            onClick={() => handleAction("clean")}
            disabled={loadingAction !== null || hostState !== "QUARANTINED"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-500/50 transition-all disabled:opacity-40"
          >
            <Wrench className="h-3.5 w-3.5 text-purple-400" />
            3. Clean Host (h3)
          </button>

          <button
            onClick={() => handleAction("verify")}
            disabled={loadingAction !== null || (hostState !== "CLEANING" && hostState !== "QUARANTINED")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-950/80 hover:bg-blue-900 text-blue-300 border border-blue-500/50 transition-all disabled:opacity-40"
          >
            <CheckCircle className="h-3.5 w-3.5 text-blue-400" />
            4. Verify Cleanliness
          </button>

          {/* 4. Release */}
          <button
            onClick={() => handleAction("release")}
            disabled={loadingAction !== null || (hostState !== "VERIFYING" && hostState !== "QUARANTINED")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 glow-green transition-all disabled:opacity-40"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" />
            5. Restore Network
          </button>

          {/* Reset */}
          <button
            onClick={() => handleAction("reset")}
            disabled={loadingAction !== null}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            title="Reset Scenario"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingAction === "reset" ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          className="bg-[#050811]"
        >
          <Background color="#1e293b" gap={20} size={1} />
          <Controls className="!bg-slate-900 !border-slate-800 !text-slate-200" />
          <MiniMap
            className="!bg-slate-950 !border-slate-800"
            nodeColor={(node: any) => {
              if (node.type === "SWITCH") return "#06b6d4";
              if (node.type === "SERVER") return "#10b981";
              if (node.type === "CONTROLLER") return "#a855f7";
              return "#94a3b8";
            }}
          />
        </ReactFlow>

        {/* Legend Panel */}
        <div className="absolute bottom-6 left-6 bg-card/90 backdrop-blur border border-border p-3.5 rounded-xl shadow-2xl text-xs space-y-2 pointer-events-auto">
          <div className="font-semibold text-white mb-1.5 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-cyan-400" />
            <span>OpenFlow Link Legend</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-3 h-1 bg-cyan-400 rounded"></span>
            <span>Normal Traffic (Priority 100 Forwarding)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-3 h-1 bg-red-500 rounded border border-red-300"></span>
            <span className="text-red-400 font-semibold">Blocked Traffic (Priority 400 DROP)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-3 h-1 bg-emerald-400 rounded"></span>
            <span className="text-emerald-400 font-semibold">Remediation Path (Priority 500 ALLOW)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-3 h-1 bg-purple-400 rounded border border-dashed"></span>
            <span>OF 1.3 Control Channel (TCP 6633)</span>
          </div>
        </div>

        {/* Node Inspector Drawer */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-80 bg-card/95 backdrop-blur border border-cyan-500/40 rounded-xl p-4 shadow-2xl z-20 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{selectedNode.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                  {selectedNode.type}
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-2 text-xs font-mono">
              {selectedNode.ip && (
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">IP Address:</span>
                  <span className="text-cyan-300 font-bold">{selectedNode.ip}</span>
                </div>
              )}
              {selectedNode.mac && (
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">MAC Address:</span>
                  <span className="text-slate-200">{selectedNode.mac}</span>
                </div>
              )}
              {selectedNode.dpid && (
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Datapath ID:</span>
                  <span className="text-purple-300 font-bold">DPID {selectedNode.dpid}</span>
                </div>
              )}
              {selectedNode.port && (
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Switch Port:</span>
                  <span className="text-slate-200">Port {selectedNode.port}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Current Status:</span>
                <span className="text-amber-400 font-bold">{selectedNode.status || "NORMAL"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Packet Rate:</span>
                <span className="text-slate-200">{selectedNode.packet_rate || 0} pkt/s</span>
              </div>
              {selectedNode.details && (
                <div className="pt-2">
                  <span className="text-slate-400 block mb-1">Configuration Details:</span>
                  <pre className="p-2 bg-black/60 rounded text-[11px] text-cyan-200 overflow-x-auto">
                    {JSON.stringify(selectedNode.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
