"use client";

import { useGameStore } from "@/stores/gameStore";
import { useCombatStore } from "@/stores/combatStore";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingTextEngine() {
  const floatingTexts = useGameStore(state => state.floatingTexts);
  // Z-index muito alto para ficar sempre por cima do mapa, mas a div wrapper não tem pointer-events
  return (
    <div className="absolute inset-0 pointer-events-none z-[999]">
      <AnimatePresence>
        {floatingTexts.map(ft => {
          let colorClass = "text-white";
          let scale = 1;
          
          if (ft.type === 'player_damage') {
            colorClass = "text-red-500 drop-shadow-[0_0_2px_rgba(153,27,27,0.8)]";
            scale = 1.1;
          } else if (ft.type === 'enemy_damage') {
            colorClass = "text-slate-200 drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]";
            scale = 1.2;
          } else if (ft.type === 'harvest') {
            colorClass = "text-emerald-400 drop-shadow-[0_0_2px_rgba(6,95,70,0.8)]";
          } else if (ft.type === 'level_up' || ft.type === 'exp') {
            colorClass = "text-[#d4af37] drop-shadow-[0_0_3px_rgba(212,175,55,0.4)]";
            scale = 1.3;
          } else if (ft.type === 'poison') {
            colorClass = "text-purple-500 drop-shadow-[0_0_2px_rgba(168,85,247,0.8)]";
            scale = 1.1;
          } else if (ft.type === 'heal') {
            colorClass = "text-emerald-400 drop-shadow-[0_0_2px_rgba(52,211,153,0.8)]";
            scale = 1.2;
          } else if (ft.type === 'legendary_loot') {
            colorClass = "text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]";
            scale = 1.4;
          }

          return (
            <motion.div
              key={ft.id}
              initial={{ opacity: 1, y: ft.y, x: ft.x, scale: 0.8 }}
              animate={{ opacity: 0, y: ft.y - 45, x: ft.x, scale }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`absolute font-mono font-bold text-xs uppercase tracking-widest ${colorClass}`}
              style={{
                left: 0,
                top: 0,
                transform: 'translate(-50%, -100%)' // Center exactly above coordinate
              }}
            >
              {ft.text}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
