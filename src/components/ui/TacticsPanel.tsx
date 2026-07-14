"use client";

import { useGameStore } from "@/store/useGameStore";
import { X, Sliders, ShieldAlert, Swords, Zap, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TacticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TacticsPanel({ isOpen, onClose }: TacticsPanelProps) {
  const gambit = useGameStore(state => state.gambit);
  const setGambitConfig = useGameStore(state => state.setGambitConfig);
  const vocation = useGameStore(state => state.vocation);
  const inventory = useGameStore(state => state.inventory);

  const spearCount = inventory.find(i => i.id === 'spear')?.quantity || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 384, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="h-full pointer-events-auto overflow-hidden flex-shrink-0"
        >
          <div className="w-96 h-full bg-[#030304]/98 border-l border-[#ffffff]/5 backdrop-blur-xl shadow-2xl flex flex-col font-sans text-slate-300">
            {/* CABEÇALHO */}
            <div className="flex justify-between items-center p-5 border-b border-[#ffffff]/5 bg-black/40">
              <div className="flex items-center gap-3">
                <Sliders className="text-[#64748b]" size={18} />
                <h2 className="font-serif font-bold text-sm text-[#cbd5e1] uppercase tracking-[0.2em]">Painel Tático</h2>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-6 scrollbar-hide">
              
              {/* CONTROLE DE HP (Auto-Pot) */}
              <div className="bg-[#08080a] border border-[#ffffff]/5 rounded p-4 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Auto-Cura (Gambit)</h3>
                    <p className="text-[9px] font-mono text-slate-500 max-w-[200px]">Consome 1 Poção de Vida se HP descer do limite configurado.</p>
                  </div>
                  <div className="bg-[#141417] border border-[#ffffff]/5 px-2 py-1 rounded text-[10px] font-mono text-emerald-400 font-bold shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
                    &lt; {Math.round(gambit.potionThresholdPercent * 100)}%
                  </div>
                </div>
                
                <input
                  type="range"
                  min="0.10"
                  max="0.90"
                  step="0.05"
                  value={gambit.potionThresholdPercent}
                  onChange={(e) => setGambitConfig({ potionThresholdPercent: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-[#101014] rounded appearance-none cursor-pointer accent-emerald-500 border border-[#ffffff]/5"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-600 mt-2">
                  <span>10%</span>
                  <span>50%</span>
                  <span>90%</span>
                </div>
              </div>

              {/* TOGGLES GERAIS */}
              <div className="bg-[#08080a] border border-[#ffffff]/5 rounded p-4 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)] flex items-center justify-between">
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Habilidades de Mana</h3>
                  <p className="text-[9px] font-mono text-slate-500">Permite ao motor usar mana em feitiços.</p>
                </div>
                
                <button
                  onClick={() => setGambitConfig({ skillsEnabled: !gambit.skillsEnabled })}
                  className={`w-10 h-5 rounded-full flex items-center p-0.5 transition-all duration-300 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] ${
                    gambit.skillsEnabled ? 'bg-indigo-900/50 border border-indigo-500/50' : 'bg-[#101014] border border-[#ffffff]/10'
                  }`}
                >
                  <div
                    className={`bg-slate-300 w-4 h-4 rounded-full shadow-md transform duration-300 ${
                      gambit.skillsEnabled ? 'translate-x-5 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'translate-x-0 opacity-50'
                    }`}
                  />
                </button>
              </div>

              {/* CONTEXTO DA VOCAÇÃO */}
              {vocation && (
                <div className="border border-[#ffffff]/5 rounded bg-black/20 overflow-hidden relative shadow-[inset_0_1px_8px_rgba(0,0,0,0.8)]">
                  <div className="bg-[#0a0a0d] p-3 border-b border-[#ffffff]/5 flex items-center gap-2">
                    <span className="text-[10px] font-serif font-bold uppercase tracking-widest text-slate-400">Diretrizes da Classe</span>
                    <span className="text-[9px] bg-[#141416] border border-[#ffffff]/5 px-2 py-0.5 rounded font-mono text-slate-300">
                      {vocation}
                    </span>
                  </div>

                  <div className="p-4">
                    {vocation === 'KNIGHT' && (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                          <ShieldAlert size={14} className="text-amber-500 mt-0.5" />
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-500/90 mb-1">Mitigação Passiva</span>
                            <span className="text-[9px] text-slate-500 font-mono leading-relaxed block">
                              Redução fixa de dano ativa. Todo ataque recebido sofre uma redução flat baseada na habilidade Shielding.
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 mt-2">
                          <Swords size={14} className="text-rose-500 mt-0.5" />
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-500/90 mb-1">Golpe Cleave</span>
                            <span className="text-[9px] text-slate-500 font-mono leading-relaxed block">
                              20% de chance de causar dano em área (splash) a um inimigo adjacente a cada acerto crítico no alvo primário.
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {vocation === 'PALADIN' && (
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center bg-[#0a0a0d] border border-[#ffffff]/5 p-3 rounded">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lanças de Ferro</span>
                            <span className="text-[9px] text-slate-500 font-mono">Munição Restante no Inventário</span>
                          </div>
                          <span className={`font-mono text-xs font-bold px-2 py-1 rounded bg-black border ${spearCount > 0 ? 'text-slate-300 border-[#ffffff]/10' : 'text-red-500 border-red-900/50'}`}>
                            {spearCount}
                          </span>
                        </div>
                        {spearCount === 0 && (
                          <div className="flex items-center gap-2 mt-2 bg-red-950/20 border border-red-900/30 p-2 rounded">
                            <AlertTriangle size={12} className="text-red-500" />
                            <span className="text-[9px] text-red-400 font-mono">Disengage automático ativado por falta de munição.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {vocation === 'MAGE' && (
                      <div className="flex flex-col gap-4 relative">
                        <div className="absolute inset-0 bg-fuchsia-900/5 blur-xl pointer-events-none" />
                        <div className="flex items-start gap-3 relative z-10">
                          <Zap size={14} className="text-fuchsia-400 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex justify-between items-end mb-2">
                              <span className="block text-[10px] font-bold uppercase tracking-wider text-fuchsia-400/90">Mana Dump (Passivo)</span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono leading-relaxed block mb-2">
                              Quando o contador de mana atinge 100%, o ciclo é reiniciado e uma Runa de Fogo é fabricada no inventário (100% autônomo).
                            </span>
                            <div className="w-full h-1 bg-[#101014] rounded overflow-hidden">
                              <div className="h-full bg-fuchsia-500/50 animate-pulse w-full origin-left" style={{ transform: 'scaleX(0.7)' }} />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-[#0a0a0d] border border-fuchsia-900/20 rounded mt-1 relative z-10">
                          <span className="text-[10px]">🔥</span>
                          <span className="text-[9px] text-slate-400 font-mono flex-1">Cooldown de uso de runas:</span>
                          <span className="text-[9px] text-fuchsia-400 font-bold bg-black px-1.5 py-0.5 rounded border border-[#ffffff]/10">4 TICKS</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* RODAPÉ DO PAINEL */}
            <div className="p-5 border-t border-[#ffffff]/5 bg-black/60 flex flex-col items-center justify-center">
              <span className="text-[9px] text-slate-600 font-serif uppercase tracking-widest text-center leading-tight">
                Motor Tático<br/>Idle Kingdoms Sandbox
              </span>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
