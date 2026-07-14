import React from 'react';
import { useWaystoneStore } from '@/stores/waystoneStore';

interface WaystoneNodeProps {
  mapId: string;
  x: number;
  y: number;
}

export default function WaystoneNode({ mapId, x, y }: WaystoneNodeProps) {
  const isUnlocked = useWaystoneStore(state => state.unlockedMaps.includes(mapId));
  const setActiveWaystoneMapId = useWaystoneStore(state => state.setActiveWaystoneMapId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents moving character when clicking the waystone
    setActiveWaystoneMapId(mapId);
  };

  return (
    <div 
      className="absolute flex flex-col items-center justify-end group cursor-pointer hover:scale-105 transition-transform"
      style={{
        left: x,
        top: y,
        width: '64px',
        height: '128px',
        transform: 'translate(-50%, -100%)',
        zIndex: Math.floor(y)
      }}
      onClick={handleClick}
    >
      {/* Glow Effect if Unlocked */}
      {isUnlocked && (
        <div className="absolute top-0 w-24 h-24 bg-emerald-500/30 rounded-full blur-2xl animate-pulse" />
      )}

      {/* The Obelisk/Waystone Shape */}
      <div className={`relative w-16 h-32 flex flex-col items-center justify-end 
        ${isUnlocked ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]'}`}
      >
        {/* Crystal top */}
        <div className={`w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[24px] z-10 transition-colors duration-1000
          ${isUnlocked ? 'border-b-emerald-400' : 'border-b-slate-700'}`} />
        
        {/* Pillar body */}
        <div className={`w-6 h-20 border-l border-r border-b z-10 transition-colors duration-1000
          ${isUnlocked ? 'bg-slate-800 border-emerald-500/50' : 'bg-slate-900 border-slate-700'}`}>
            
          {/* Runes / Markings inside */}
          {isUnlocked && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-80 animate-pulse">
              <div className="w-2 h-2 bg-emerald-400 rounded-full blur-[1px]" />
              <div className="w-1 h-3 bg-emerald-400 rounded-sm blur-[1px]" />
              <div className="w-2 h-1 bg-emerald-400 rounded-sm blur-[1px]" />
            </div>
          )}
        </div>
        
        {/* Base */}
        <div className="w-16 h-4 bg-slate-950 border-t border-slate-700 rounded-t-sm z-0" />
      </div>

      <div className="absolute -bottom-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 text-white text-xs px-2 py-1 rounded border border-slate-700 whitespace-nowrap pointer-events-none z-50">
        {isUnlocked ? 'Waystone (Active)' : 'Waystone (Locked)'}
      </div>
    </div>
  );
}
