import React, { useState } from 'react';
import { useGameStore, NPCData } from '@/stores/gameStore';

interface NPCNodeProps {
  npc: NPCData;
}

export default function NPCNode({ npc }: NPCNodeProps) {
  const [showLog, setShowLog] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    useGameStore.getState().setActiveNpcId(npc.id);
  };

  return (
    <div
      className="absolute flex flex-col items-center justify-end cursor-pointer group hover:scale-105 transition-transform z-20"
      style={{
        left: npc.x,
        top: npc.y,
        width: '40px',
        height: '60px',
        transform: 'translate(-50%, -100%)'
      }}
      onClick={handleClick}
    >
      {/* Sombra */}
      <div className="absolute -bottom-1 w-8 h-3 bg-black/40 rounded-[100%] blur-[2px]" />

      {/* Corpo do NPC (Manto escuro / Dark Fantasy) */}
      <div className="relative w-8 h-12 bg-slate-800 border-x border-t border-slate-600 rounded-t-full drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)]">
        {/* Rosto sob o capuz */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-3 bg-slate-950 rounded-full" />
        
        {/* Ponto de luz mágica sutil (ex: olhos) */}
        <div className="absolute top-[10px] left-[14px] w-1 h-[2px] bg-emerald-400 blur-[1px]" />
        
        {/* Detalhe do manto */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[2px] h-6 bg-slate-700" />
      </div>

      {/* Tooltip de Nome (Sempre visível no hover) */}
      <div className="absolute -top-6 whitespace-nowrap bg-black/80 border border-slate-700 px-2 py-0.5 rounded shadow-xl flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] font-serif text-amber-500 font-bold tracking-widest">{npc.name}</span>
      </div>

      {/* Símbolo de Quests/Falar sobre a cabeça */}
      <div className="absolute -top-10 w-4 h-4 text-emerald-400 animate-bounce opacity-80 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </div>

    </div>
  );
}
