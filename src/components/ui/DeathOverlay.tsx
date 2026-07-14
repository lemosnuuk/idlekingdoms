"use client";

import { useGameStore } from "@/stores/gameStore";
import { motion, AnimatePresence } from "framer-motion";
import { Skull, MapPin } from "lucide-react";

export default function DeathOverlay() {
  const { isDead, revivePlayer } = useGameStore();

  // If the user is dead, we want to desaturate the map behind this overlay.
  // We can do this by using a global style or a backdrop filter. 
  // We will use a fixed fullscreen div with backdrop-grayscale.
  
  return (
    <AnimatePresence>
      {isDead && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto backdrop-grayscale"
          style={{ backgroundColor: 'rgba(5, 5, 5, 0.75)' }}
        >
          <div className="flex flex-col items-center justify-center max-w-md w-full p-8 bg-[#0a0a0c]/90 border border-[#27272a] shadow-2xl rounded-sm">
            <Skull size={48} className="text-[#52525b] mb-6 animate-pulse" />
            
            <h1 className="font-serif text-xl tracking-[0.3em] text-[#a1a1aa] mb-2 uppercase text-center">
              Você caiu em combate.
            </h1>
            
            <p className="text-xs font-mono text-[#52525b] mb-8 text-center uppercase tracking-widest leading-relaxed">
              Seus pertences estão no seu corpo.
            </p>

            <button 
              onClick={revivePlayer}
              className="group relative px-6 py-3 bg-transparent border border-[#3f3f46] hover:border-[#71717a] text-[#71717a] hover:text-[#e4e4e7] transition-all duration-500 overflow-hidden flex items-center gap-2"
            >
              <div className="absolute inset-0 bg-[#3f3f46]/10 w-0 group-hover:w-full transition-all duration-500 ease-out" />
              <MapPin size={14} className="relative z-10" />
              <span className="relative z-10 text-[10px] uppercase font-bold tracking-widest">
                Acordar na Vila
              </span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
