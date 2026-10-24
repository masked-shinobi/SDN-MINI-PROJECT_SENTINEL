"use client";

import TopologyCanvas from "@/components/topology/TopologyCanvas";

export default function TopologyPage() {
  return (
    <div className="w-full h-full flex-1 flex flex-col">
      <TopologyCanvas />
    </div>
  );
}
