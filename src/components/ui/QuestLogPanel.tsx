"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, ShieldAlert, Award, Gift, Unlock } from "lucide-react";
import { useQuestStore } from "@/stores/questStore";

export default function QuestLogPanel() {
  const { isOpen, toggleQuestLog, quests, claimQuestReward } = useQuestStore();

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
                <CheckCircle className="text-emerald-500" size={18} />
                <h2 className="font-serif font-bold text-sm text-white uppercase tracking-[0.2em]">Registro de Missões</h2>
              </div>
              <button onClick={toggleQuestLog} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4 scrollbar-hide">
              {quests.map((quest) => {
                const isActive = !quest.isClaimed && !quest.isCompleted;
                const isReadyToClaim = quest.isCompleted && !quest.isClaimed;
                const isCompleted = quest.isClaimed;

                const progress = Math.min((quest.currentAmount / quest.targetAmount) * 100, 100);

                return (
                  <div 
                    key={quest.id} 
                    className={`relative overflow-hidden rounded border transition-all duration-300 flex flex-col ${
                      isReadyToClaim 
                        ? 'bg-[#101015] border-[#d4af37]/40 shadow-[0_0_15px_rgba(212,175,55,0.15)]' 
                        : isCompleted
                          ? 'bg-[#030304] border-[#ffffff]/5 opacity-60'
                          : isActive
                            ? 'bg-[#08080a] border-emerald-500/20 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]'
                            : 'bg-[#08080a] border-[#ffffff]/5 opacity-40' // Locked quests
                    }`}
                  >
                    {isReadyToClaim && (
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.15)_0%,_transparent_70%)] pointer-events-none" />
                    )}

                    <div className="p-4 flex flex-col gap-3 relative z-10">
                      <div className="flex justify-between items-start">
                        <h3 className={`font-serif text-sm uppercase tracking-wider ${isReadyToClaim ? 'text-[#d4af37]' : 'text-slate-200'}`}>
                          {quest.title}
                        </h3>
                        {isCompleted && <Award size={16} className="text-[#d4af37]" />}
                        {isReadyToClaim && <Gift size={16} className="text-[#d4af37] animate-bounce" />}
                      </div>

                      <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                        {quest.description}
                      </p>

                      {/* Progress Bar & Amount */}
                      {!isCompleted && (
                        <div className="flex flex-col gap-1.5 mt-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Progresso</span>
                            <span className={`text-[10px] font-mono font-bold ${isReadyToClaim ? 'text-[#d4af37]' : 'text-emerald-500'}`}>
                              {quest.currentAmount} / {quest.targetAmount}
                            </span>
                          </div>
                          <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden border border-[#ffffff]/5">
                            <div 
                              className={`h-full transition-all duration-500 ${isReadyToClaim ? 'bg-[#d4af37]' : 'bg-emerald-500'}`} 
                              style={{ width: `${progress}%` }} 
                            />
                          </div>
                        </div>
                      )}

                      {/* Unlock Message */}
                      {quest.unlockMessage && (
                        <div className="flex items-center gap-1.5 mt-2 bg-black/30 p-1.5 rounded border border-[#ffffff]/5">
                          <Unlock size={10} className="text-indigo-400" />
                          <span className="text-[9px] font-mono text-indigo-300">{quest.unlockMessage}</span>
                        </div>
                      )}

                      {/* Claim Button */}
                      {isReadyToClaim && (
                        <button
                          onClick={() => claimQuestReward(quest.id)}
                          className="mt-2 w-full bg-[#d4af37]/10 hover:bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#d4af37] font-bold uppercase tracking-widest text-[10px] py-2 rounded transition-all active:scale-[0.98]"
                        >
                          Resgatar Recompensa
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
