import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';

interface PortalBarrierProps {
  x: number;
  y: number;
  reqLevel: number;
}

export function PortalBarrier({ x, y, reqLevel }: PortalBarrierProps) {
  const level = useGameStore(s => s.level);
  const position = useGameStore(s => s.characterPosition);
  const [showWarning, setShowWarning] = useState(false);

  const isBlocked = level < reqLevel;

  useEffect(() => {
    if (!isBlocked) {
      setShowWarning(false);
      return;
    }

    const dist = Math.hypot(position.x - x, position.y - y);
    if (dist <= 100) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [position.x, position.y, x, y, isBlocked]);

  if (!isBlocked) return null;

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: -20, top: -20, width: 120, height: 120, zIndex: -1 }}
    >
      {/* Magic Barrier Visual */}
      <div className="absolute inset-0 rounded-full border border-violet-900/40 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(139,92,246,0.15)_70%,rgba(76,29,149,0.3)_100%)] animate-[pulse_3s_ease-in-out_infinite]" />
      <div className="absolute inset-1 rounded-full border border-dashed border-violet-500/20 animate-[spin_12s_linear_infinite]" />
      
      {/* Warning Text on proximity */}
      {showWarning && (
        <div className="absolute -top-16 flex flex-col items-center animate-fade-in drop-shadow-md">
          <span className="text-[10px] font-serif font-bold text-rose-500/90 bg-black/80 px-3 py-1 border border-rose-900/50 rounded shadow-xl whitespace-nowrap uppercase tracking-widest backdrop-blur-sm">
            🔒 Requer Nível {reqLevel} para atravessar a fronteira
          </span>
          <span className="text-[9px] font-mono font-medium text-fantasy-text-muted mt-1 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
            Faltam {reqLevel - level} {reqLevel - level === 1 ? 'Nível' : 'Níveis'}
          </span>
        </div>
      )}
    </div>
  );
}
