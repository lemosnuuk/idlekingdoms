"use client";

import { OtherPlot } from "@/stores/multiplayerStore";

export default function OtherPlotNode({ plot }: { plot: OtherPlot }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{ 
        left: plot.x, 
        top: plot.y, 
        transform: 'translate(-50%, -50%)',
        width: 256,
        height: 256,
        zIndex: Math.floor(plot.y) // Depth sorting
      }}
    >
      {/* Village buildings cluster */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Central Cabin */}
        <div className="absolute top-[80px] left-[90px] filter drop-shadow-md">
          <img 
            src="/assets/cabin.png?v=3" 
            alt="Cabin" 
            className="w-16 h-16 object-contain"
          />
        </div>
        
        {/* Side Cabin */}
        <div className="absolute top-[110px] left-[140px] filter drop-shadow-md">
          <img 
            src="/assets/cabin.png?v=3" 
            alt="Cabin" 
            className="w-14 h-14 object-contain"
          />
        </div>

        {/* Small Tent */}
        <div className="absolute top-[75px] left-[150px] filter drop-shadow-sm">
          <img 
            src="/assets/tent.png?v=3" 
            alt="Tent" 
            className="w-12 h-12 object-contain"
          />
        </div>

        {/* Campfire (animated emoji) */}
        <div className="absolute top-[115px] left-[110px] text-base animate-pulse">
          🔥
        </div>

        {/* Village center label */}
        <div className="absolute top-[165px] left-[78px] z-10 flex flex-col items-center">
          <div className="bg-black/85 px-2.5 py-0.5 rounded text-[8px] text-indigo-300 font-bold shadow-md border border-indigo-500/40 whitespace-nowrap uppercase tracking-wider">
            Vila de {plot.ownerName}
          </div>
        </div>
      </div>
    </div>
  );
}
