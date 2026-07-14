"use client";

import { useMultiplayerStore } from "@/stores/multiplayerStore";
import { motion } from "framer-motion";

export default function WorldBossNode() {
  const { worldBoss, attackWorldBoss } = useMultiplayerStore();

  if (!worldBoss.isActive) return null;

  return (
    <motion.div
      onClick={(e) => {
        e.stopPropagation();
        attackWorldBoss(50); // Mock damage
      }}
      className="absolute cursor-pointer flex flex-col items-center justify-center z-40 transition-transform hover:scale-110"
      style={{ left: worldBoss.x, top: worldBoss.y, transform: 'translate(-50%, -50%)' }}
      animate={{ y: [-10, 10, -10] }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
    >
      {/* Huge Boss Sprite */}
      <div className="w-48 h-48 flex items-center justify-center filter drop-shadow-[0_0_25px_rgba(255,0,0,0.4)]">
        <img 
          src="/assets/dragon.png?v=3" 
          alt="Dragon World Boss" 
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* Boss Stats */}
      <div className="absolute top-28 flex flex-col items-center w-48">
        <span className="text-xs font-bold text-fantasy-danger drop-shadow-md bg-black/80 px-2 py-1 rounded border border-fantasy-danger/50 mb-1">
          {worldBoss.name} (World Boss)
        </span>
        <div className="w-full h-3 bg-black rounded-full overflow-hidden border-2 border-fantasy-border">
          <div 
            className="h-full bg-fantasy-danger transition-all"
            style={{ width: `${(worldBoss.hp / worldBoss.maxHp) * 100}%` }}
          />
        </div>
        <span className="text-[10px] text-white font-bold mt-0.5">{worldBoss.hp}/{worldBoss.maxHp}</span>
      </div>
    </motion.div>
  );
}
