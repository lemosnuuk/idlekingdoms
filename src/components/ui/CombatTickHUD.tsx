"use client";

import { useCombatStore } from "@/stores/combatStore";
import { useGameStore } from "@/stores/gameStore";
import { motion, AnimatePresence } from "framer-motion";
import { Activity } from "lucide-react";

export default function CombatTickHUD() {
  const activeMonsterId = useCombatStore(state => state.activeMonsterId);
  const inventory = useGameStore(state => state.inventory);
  
  // Encontrar tick duration baseado na arma equipada
  const equippedWeapon = inventory.find(i => i.equipped && i.type === 'weapon');
  const tickDuration = equippedWeapon?.attackTickModifier || 2.0;

  return (
    <AnimatePresence>
      {activeMonsterId && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="absolute bottom-6 left-6 z-40 pointer-events-none"
        >
          <div className="bg-[#0a0a0c]/90 border border-red-900/50 backdrop-blur-sm p-3 shadow-[0_0_15px_rgba(153,27,27,0.15)] flex flex-col gap-2 rounded-sm relative overflow-hidden animate-[pulse_2s_ease-in-out_infinite]">
            
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-red-500 animate-pulse" />
              <span className="text-[10px] font-mono text-slate-300 uppercase tracking-widest font-bold">
                Em Combate
              </span>
            </div>

            {/* Barra de Progresso Microscópica (Tick Timer fake CSS-based) */}
            <div className="w-32 h-1 bg-black/60 border border-[#27272a] overflow-hidden rounded-full mt-1 relative">
              <div 
                className="h-full bg-red-800/80 shadow-[0_0_5px_rgba(153,27,27,0.5)]"
                style={{ 
                  animation: `fillBar ${tickDuration}s linear infinite` 
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
