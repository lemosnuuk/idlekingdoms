import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWaystoneStore, WAYSTONE_COST } from '@/stores/waystoneStore';
import { useGameStore } from '@/stores/gameStore';
import { X, Map, Zap, ChevronRight } from 'lucide-react';

export default function WaystonePanel() {
  const activeWaystoneMapId = useWaystoneStore(state => state.activeWaystoneMapId);
  const setActiveWaystoneMapId = useWaystoneStore(state => state.setActiveWaystoneMapId);
  const progressByMap = useWaystoneStore(state => state.progressByMap);
  const unlockedMaps = useWaystoneStore(state => state.unlockedMaps);
  const depositMaterial = useWaystoneStore(state => state.depositMaterial);
  const checkUnlock = useWaystoneStore(state => state.checkUnlock);

  const mana = useGameStore(state => state.mana);
  const setMana = useGameStore(state => state.setMana);
  const travelToMap = useGameStore(state => state.travelToMap);
  const currentMapId = useGameStore(state => state.currentMapId);

  if (!activeWaystoneMapId) return null;

  const isUnlocked = unlockedMaps.includes(activeWaystoneMapId);
  const progress = progressByMap[activeWaystoneMapId] || { wood: 0, stone: 0, iron_ore: 0 };

  const handleDeposit = (material: 'wood' | 'stone' | 'iron_ore') => {
    depositMaterial(activeWaystoneMapId, material, 9999); // Max possible
    checkUnlock(activeWaystoneMapId);
  };

  const handleFastTravel = (targetMapId: string) => {
    if (mana >= 20) {
      setMana(mana - 20);
      travelToMap(targetMapId, { x: 2400, y: 2400 });
      setActiveWaystoneMapId(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
        onClick={() => setActiveWaystoneMapId(null)}
      >
        <motion.div 
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 border border-slate-700 w-full max-w-md rounded shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map className="w-5 h-5 text-emerald-400" />
              <h2 className="text-slate-200 font-mono font-bold tracking-widest uppercase">
                Waystone: {activeWaystoneMapId.replace('_', ' ')}
              </h2>
            </div>
            <button 
              onClick={() => setActiveWaystoneMapId(null)}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {!isUnlocked ? (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-slate-300 font-serif text-lg">Reconstrua a Waystone</h3>
                  <p className="text-slate-500 text-xs">
                    Deposite materiais para reativar esta relíquia ancestral e permitir a viagem rápida entre mapas.
                  </p>
                </div>

                <div className="space-y-4">
                  {(['wood', 'stone', 'iron_ore'] as const).map((mat) => {
                    const current = progress[mat] || 0;
                    const max = WAYSTONE_COST[mat];
                    const percent = Math.min(100, (current / max) * 100);
                    const isDone = current >= max;

                    return (
                      <div key={mat} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 capitalize">{mat.replace('_', ' ')}</span>
                          <span className={isDone ? 'text-emerald-400' : 'text-slate-500'}>
                            {current} / {max}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* 1px Thin Progress Bar */}
                          <div className="h-[2px] flex-1 bg-slate-800 rounded overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                            />
                          </div>
                          {!isDone ? (
                            <button 
                              onClick={() => handleDeposit(mat)}
                              className="text-[10px] uppercase font-bold text-slate-400 hover:text-emerald-400 transition-colors"
                            >
                              Depositar
                            </button>
                          ) : (
                            <span className="text-[10px] uppercase font-bold text-emerald-500">Pronto</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center p-6 bg-emerald-950/20 border border-emerald-900/30 rounded">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] font-mono font-bold tracking-[0.2em] text-center"
                  >
                    WAYSTONE ACTIVE
                  </motion.div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Destinos</span>
                    <span className="text-xs text-blue-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {mana} Mana
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {unlockedMaps.filter(id => id !== currentMapId).length === 0 && (
                      <div className="text-center text-slate-600 text-xs py-4">
                        Nenhuma outra Waystone foi descoberta ou ativada ainda.
                      </div>
                    )}
                    
                    {unlockedMaps.filter(id => id !== currentMapId).map(targetMapId => (
                      <div 
                        key={targetMapId}
                        className="flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 p-2 rounded group transition-colors"
                      >
                        <span className="text-sm text-slate-300 font-mono">{targetMapId.replace('_', ' ')}</span>
                        <button
                          onClick={() => handleFastTravel(targetMapId)}
                          disabled={mana < 20}
                          className="flex items-center gap-1 text-xs bg-indigo-900/40 hover:bg-indigo-600/60 text-indigo-200 px-3 py-1.5 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Zap className="w-3 h-3" />
                          20 Mana
                          <ChevronRight className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
