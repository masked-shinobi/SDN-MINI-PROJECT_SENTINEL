"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, Network, Activity, ScrollText, PlayCircle, RefreshCw, Cpu } from "lucide-react";
import { useState } from "react";
import { resetDemo } from "@/lib/api";

interface NavbarProps {
  hostState?: string;
  onRefresh?: () => void;
}

export default function Navbar({ hostState = "NORMAL", onRefresh }: NavbarProps) {
  const pathname = usePathname();
  const [resetting, setResetting] = useState(false);

  const navLinks = [
    { href: "/", label: "Overview", icon: Activity },
    { href: "/topology", label: "Live Topology", icon: Network },
    { href: "/incidents", label: "Threat Detection", icon: ShieldAlert },
    { href: "/flows", label: "Flow Rules (OVS)", icon: ScrollText },
    { href: "/demo", label: "Demo Lab & Tests", icon: PlayCircle },
  ];

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetDemo();
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setResetting(false);
    }
  };

  const getStatusBadge = () => {
    switch (hostState) {
      case "QUARANTINED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-950/80 text-red-400 border border-red-500/50 glow-red">QUARANTINED</span>;
      case "DETECTED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-950/80 text-amber-400 border border-amber-500/50 glow-amber">DETECTED</span>;
      case "CLEANING":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-950/80 text-purple-400 border border-purple-500/50">CLEANING</span>;
      case "VERIFYING":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-950/80 text-blue-400 border border-blue-500/50">VERIFYING</span>;
      case "RESTORED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 glow-green">RESTORED</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">NORMAL</span>;
    }
  };

  return (
    <header className="border-b border-border/80 bg-background/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 glow-cyan">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">SDN Sentinel</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">OF 1.3</span>
            </div>
            <p className="text-xs text-slate-400">Automated Host Quarantine & Remediation</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  active
                    ? "bg-cyan-950/70 text-cyan-400 border border-cyan-500/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Status & Control */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-card px-3 py-1 rounded-md border border-border">
            <Cpu className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span>h1 Status:</span>
            {getStatusBadge()}
          </div>

          <button
            onClick={handleReset}
            disabled={resetting}
            title="Reset Scenario to Baseline"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 border border-border transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${resetting ? "animate-spin" : ""}`} />
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}
