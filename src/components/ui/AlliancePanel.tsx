"use client";

import { useMultiplayerStore } from "@/stores/multiplayerStore";
import { useGameStore } from "@/stores/gameStore";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { X, Shield, Users, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AlliancePanel() {
  const { isAlliancePanelOpen, toggleAlliancePanel } = useMultiplayerStore();
  const { playerName } = useGameStore();
  const { leaderboard, loading } = useLeaderboard();

  const playerRankIndex = leaderboard.findIndex(p => p.player_name === playerName);
  const playerRank = playerRankIndex >= 0 ? playerRankIndex + 1 : '???';
  
  const formatGold = (amount: number) => {
    return Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(amount) + ' G';
  };

  return (
    <AnimatePresence>
      {isAlliancePanelOpen && (
        <motion.div 
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 384, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="h-full pointer-events-auto overflow-hidden flex-shrink-0"
        >
          <div className="w-96 h-full bg-gradient-to-b from-[#080b17]/95 to-[#0b0b0d]/98 border-r border-indigo-500/20 backdrop-blur-md shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-[#ffffff]/5 bg-black/20">
              <div className="flex items-center gap-3">
                <Shield className="text-indigo-400" size={20} />
                <h2 className="font-serif font-bold text-lg text-indigo-400 uppercase tracking-widest drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]">Alianças</h2>
              </div>
              <button onClick={toggleAlliancePanel} className="text-fantasy-text-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-6">
              
              {/* Alliance Info */}
              <div className="bg-[#0a0c12] border border-indigo-900/30 rounded-lg p-6 flex flex-col justify-center items-center text-center shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)] relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-500/5 animate-pulse pointer-events-none" />
                <Users size={40} className="text-indigo-500/60 mb-3 relative z-10" />
                <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-widest relative z-10">Sem Aliança</h3>
                <p className="text-[10px] text-slate-400 mb-6 font-mono leading-relaxed relative z-10 px-2 opacity-80">
                  Junte-se a outros jogadores para compartilhar recursos, proteger caravanas e enfrentar o World Boss.
                </p>
                
                <div className="w-full space-y-2 relative z-10">
                  <button className="w-full bg-indigo-950/40 hover:bg-indigo-900 border border-indigo-500/40 hover:border-indigo-400 text-indigo-300 hover:text-white font-bold py-2.5 rounded text-[11px] uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                    Buscar Alianças
                  </button>
                  <button className="w-full bg-[#050505] hover:bg-[#0a0a0c] border border-indigo-900/50 hover:border-indigo-500/50 text-indigo-500/70 hover:text-indigo-400 font-bold py-2.5 rounded text-[11px] uppercase tracking-widest transition-all">
                    Criar (10k Ouro)
                  </button>
                </div>
              </div>

              {/* Ranking */}
              <div className="bg-[#0a0a0c] border border-[#ffffff]/5 rounded-lg p-4 shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)] flex flex-col flex-1">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-[#ffffff]/5 pb-2">
                  <Trophy size={14} className="text-yellow-600"/> Top Jogadores
                </h3>
                
                <div className="space-y-2 overflow-y-auto pr-1">
                  {loading ? (
                    <div className="text-center py-4 text-slate-500 text-xs font-mono animate-pulse">Carregando pergaminhos...</div>
                  ) : leaderboard.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-xs font-mono">Nenhum império registrado.</div>
                  ) : (
                    leaderboard.slice(0, 10).map((player, index) => {
                      const isFirst = index === 0;
                      return (
                        <div key={player.id} className={`flex justify-between items-center p-2.5 rounded ${isFirst ? 'bg-indigo-950/20 border border-indigo-500/30 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]' : 'bg-[#0b0b0d] border border-[#ffffff]/5'}`}>
                          <span className={`text-[11px] flex items-center gap-2 ${isFirst ? 'font-bold text-yellow-500' : 'text-slate-300'}`}>
                            <span className="text-slate-500 font-mono">#{index + 1}</span> {player.player_name}
                          </span>
                          <span className={`text-[10px] font-mono ${isFirst ? 'text-slate-300 bg-black/40 px-1.5 py-0.5 rounded' : 'text-slate-400'}`}>
                            {formatGold(player.gold)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-auto pt-4 border-t border-[#ffffff]/5">
                  <div className="flex justify-between items-center bg-indigo-900/10 p-3 rounded border border-indigo-500/20 shadow-inner">
                    <span className="text-[11px] font-bold text-[#d4af37] flex items-center gap-2"><span className="text-[#d4af37]/50 font-mono">#{playerRank}</span> Você ({playerName})</span>
                    <span className="text-[11px] font-bold text-white bg-black/40 px-2 py-0.5 rounded border border-white/5">Rank {typeof playerRank === 'number' ? (playerRank === 1 ? 'S' : playerRank <= 3 ? 'A' : playerRank <= 10 ? 'B' : 'C') : '?'}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
