"use client";

import { useBountyStore } from "@/stores/bountyStore";
import { useGameStore } from "@/stores/gameStore";
import { motion, AnimatePresence } from "framer-motion";
import { Skull, X, AlertOctagon } from "lucide-react";

export function BountyBoardPanel() {
  const { isOpen, setIsOpen, contracts, acceptContract } = useBountyStore();
  const playerLevel = useGameStore(state => state.level);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        className="fixed top-20 right-8 w-96 z-50 pointer-events-auto"
      >
        <div className="bg-zinc-900 border-2 border-zinc-700 shadow-[0_0_50px_rgba(0,0,0,0.9)] rounded flex flex-col font-mono overflow-hidden">
          {/* Header - Rasgado e Sombrio */}
          <div className="bg-zinc-950 border-b-2 border-red-900/40 p-4 flex justify-between items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-10 mix-blend-overlay"></div>
            <div className="relative z-10 flex items-center gap-3">
              <Skull className="text-red-800 drop-shadow-[0_0_8px_rgba(153,27,27,0.8)]" size={24} />
              <h2 className="text-xl font-bold text-zinc-300 uppercase tracking-widest">Quadro de Caçadas</h2>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-zinc-500 hover:text-red-500 transition-colors z-10"
            >
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-red-900/50 scrollbar-track-zinc-950 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none"></div>

            {contracts.map(contract => {
              const meetsLevel = playerLevel >= contract.reqLvl;
              const isAvailable = contract.status === 'AVAILABLE';
              const isActive = contract.status === 'ACTIVE';
              const isCompleted = contract.status === 'COMPLETED';

              return (
                <div 
                  key={contract.id} 
                  className={`relative p-4 border border-dashed rounded flex flex-col transition-all duration-300 ${
                    isCompleted ? 'border-zinc-800 bg-zinc-950/80 grayscale opacity-50' :
                    isActive ? 'border-red-900/80 bg-red-950/20' :
                    meetsLevel ? 'border-zinc-600 bg-zinc-800/50 hover:bg-zinc-800' : 'border-zinc-800 bg-zinc-900/50 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-bold uppercase tracking-wider ${isCompleted ? 'line-through text-zinc-500' : isActive ? 'text-red-400' : 'text-zinc-200'}`}>
                      {contract.name}
                    </h3>
                    {!isCompleted && (
                      <span className={`text-xs px-2 py-0.5 rounded ${meetsLevel ? 'bg-zinc-700 text-zinc-300' : 'bg-red-900/40 text-red-300'}`}>
                        Lvl {contract.reqLvl}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 mb-4 leading-relaxed italic border-l-2 border-zinc-700 pl-2">
                    {contract.bossType === 'wolf' ? "Um monstro bestial uiva nas fronteiras da vila. O dobro de força física e golpes cruéis esperam por você." : "Um renegado exilado da tribo, portando fúria sanguinária. Abata-o pelas recompensas raras."}
                  </p>

                  <div className="mt-auto">
                    {isCompleted ? (
                      <div className="w-full py-2 text-center text-xs font-bold text-zinc-600 tracking-widest border border-zinc-800 bg-zinc-900 uppercase">
                        Contrato Concluído
                      </div>
                    ) : isActive ? (
                      <div className="w-full py-2 text-center text-xs font-bold text-red-500 tracking-widest border border-red-900/50 bg-red-950/30 uppercase flex items-center justify-center gap-2">
                        <AlertOctagon size={14} /> Caçada Ativa
                      </div>
                    ) : (
                      <button
                        disabled={!meetsLevel}
                        onClick={() => acceptContract(contract.id)}
                        className={`w-full py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                          meetsLevel 
                            ? 'bg-zinc-200 text-zinc-900 hover:bg-white border border-transparent shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                        }`}
                      >
                        {meetsLevel ? 'Aceitar Contrato' : 'Nível Insuficiente'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="bg-zinc-950 p-3 text-center text-[10px] text-zinc-600 border-t-2 border-red-900/40 uppercase tracking-widest">
            A corporação não se responsabiliza por desmembramentos.
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
