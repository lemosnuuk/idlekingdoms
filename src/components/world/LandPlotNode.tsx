"use client";

import { useLandStore, LandPlot, LandBiome } from "@/stores/landStore";
import { useWorkerStore, WorkerData, WorkerRarity } from "@/stores/workerStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useGameStore } from "@/stores/gameStore";
import { motion, AnimatePresence } from "framer-motion";
import { memo, useState } from "react";
import { Lock, Unlock, Coins, TreePine, Mountain, Waves, Wheat, Pickaxe, Axe, Star, X, ChevronRight } from "lucide-react";

// ─── Biome Styling ──────────────────────────────────────────

function getBiomeConfig(biome: LandBiome) {
  switch (biome) {
    case 'forest':
      return { icon: <TreePine size={14} />, color: 'text-emerald-500', bg: 'bg-emerald-950/40', border: 'border-emerald-800/60', emoji: '🌲' };
    case 'mountain':
      return { icon: <Mountain size={14} />, color: 'text-slate-400', bg: 'bg-slate-900/50', border: 'border-slate-700/60', emoji: '⛰️' };
    case 'riverside':
      return { icon: <Waves size={14} />, color: 'text-cyan-500', bg: 'bg-cyan-950/40', border: 'border-cyan-800/60', emoji: '🏞️' };
    case 'plains':
    default:
      return { icon: <Wheat size={14} />, color: 'text-amber-500', bg: 'bg-amber-950/40', border: 'border-amber-800/60', emoji: '🌾' };
  }
}

function getRarityColor(rarity: WorkerRarity) {
  switch (rarity) {
    case 'legendary': return 'text-amber-400 border-amber-500/50';
    case 'rare': return 'text-violet-400 border-violet-500/50';
    default: return 'text-slate-300 border-slate-600/50';
  }
}

// ─── Component ──────────────────────────────────────────────

export default memo(function LandPlotNode({ plot }: { plot: LandPlot }) {
  const { buyPlot, assignWorkerToPlot, unassignWorkerFromPlot } = useLandStore();
  const { workers } = useWorkerStore();
  const { gold } = useInventoryStore();
  const [showWorkerPicker, setShowWorkerPicker] = useState(false);

  const biome = getBiomeConfig(plot.biome);
  const assignedWorker = plot.assignedWorkerId
    ? workers.find(w => w.id === plot.assignedWorkerId)
    : null;
  const idleWorkers = workers.filter(w => !w.assignedPlotId && w.status === 'sleeping');
  const canAfford = gold >= plot.cost;

  // ─── LOCKED STATE ────────────────────────────────────
  if (!plot.isUnlocked) {
    return (
      <motion.div
        className="absolute flex flex-col items-center group cursor-pointer"
        style={{ left: plot.x - 50, top: plot.y - 50, width: 100, height: 100, zIndex: Math.floor(plot.y) }}
        whileHover={{ scale: 1.03 }}
        onClick={(e) => {
          e.stopPropagation();
          if (canAfford) {
            const success = buyPlot(plot.id);
            if (success) {
              useGameStore.getState().addFloatingText(
                `🔓 ${plot.name} Desbloqueado!`,
                plot.x, plot.y - 60, 'level_up'
              );
            }
          } else {
            useGameStore.getState().addFloatingText(
              "❌ Ouro insuficiente!",
              plot.x, plot.y - 60, 'player_damage'
            );
          }
        }}
      >
        {/* Fence / Border */}
        <div className={`w-full h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${biome.border} ${biome.bg} group-hover:border-[#d4af37]/60 group-hover:bg-[#d4af37]/5`}>
          
          {/* Fence Post Corners */}
          <div className="absolute top-0 left-0 w-2 h-full bg-amber-900/40 rounded-l" />
          <div className="absolute top-0 right-0 w-2 h-full bg-amber-900/40 rounded-r" />
          <div className="absolute top-0 left-0 w-full h-2 bg-amber-900/40 rounded-t" />
          <div className="absolute bottom-0 left-0 w-full h-2 bg-amber-900/40 rounded-b" />
          
          {/* Cross-bars (fence wires) */}
          <div className="absolute top-[30%] left-2 right-2 h-[1px] bg-amber-800/50" />
          <div className="absolute top-[60%] left-2 right-2 h-[1px] bg-amber-800/50" />

          {/* Lock Icon */}
          <Lock size={20} className="text-amber-700/80 mb-1 drop-shadow-md" />
          
          {/* Biome indicator */}
          <span className="text-lg">{biome.emoji}</span>
        </div>

        {/* Floating Buy Button */}
        <motion.div
          className={`absolute -top-8 bg-black/95 backdrop-blur-sm border rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-xl transition-all whitespace-nowrap ${
            canAfford 
              ? 'border-[#d4af37]/60 group-hover:border-[#d4af37] group-hover:shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
              : 'border-red-900/40 opacity-70'
          }`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Lock size={10} className={canAfford ? 'text-[#d4af37]' : 'text-red-500'} />
          <span className={`text-[10px] font-bold font-mono ${canAfford ? 'text-[#d4af37]' : 'text-red-400'}`}>
            {plot.cost.toLocaleString()}
          </span>
          <Coins size={10} className={canAfford ? 'text-[#d4af37]' : 'text-red-500'} />
        </motion.div>

        {/* Name Tooltip on hover */}
        <div className="absolute -bottom-7 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 border border-[#ffffff]/10 px-2 py-1 rounded text-[9px] text-slate-300 font-mono whitespace-nowrap">
          {plot.name}
        </div>
      </motion.div>
    );
  }

  // ─── UNLOCKED: EMPTY (no worker assigned) ────────────
  if (!assignedWorker) {
    return (
      <motion.div
        className="absolute flex flex-col items-center group cursor-pointer"
        style={{ left: plot.x - 50, top: plot.y - 50, width: 100, height: 100, zIndex: Math.floor(plot.y) }}
        whileHover={{ scale: 1.03 }}
        onClick={(e) => {
          e.stopPropagation();
          setShowWorkerPicker(!showWorkerPicker);
        }}
      >
        {/* Clean ground / cleared plot */}
        <div className={`w-full h-full border-2 rounded-lg flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 border-[#d4af37]/30 bg-gradient-to-b from-amber-950/20 to-[#0a0d10]/60 group-hover:border-[#d4af37]/60 group-hover:bg-amber-950/30`}>
          
          {/* Ground texture */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle, #8b5a2b 1px, transparent 1px)',
            backgroundSize: '8px 8px'
          }} />

          {/* Unlock marker */}
          <Unlock size={16} className="text-[#d4af37]/60 mb-1" />
          <span className="text-[9px] text-[#d4af37]/80 font-mono uppercase tracking-wider">Vazio</span>
          
          {/* Biome tag */}
          <div className={`absolute bottom-1 right-1 p-1 rounded ${biome.bg}`}>
            <span className="text-xs">{biome.emoji}</span>
          </div>
        </div>

        {/* Plot Name */}
        <div className="absolute -top-6 bg-black/90 border border-[#d4af37]/30 px-2 py-0.5 rounded text-[9px] text-[#d4af37] font-mono whitespace-nowrap">
          {plot.name}
        </div>

        {/* Worker Picker Popup */}
        <AnimatePresence>
          {showWorkerPicker && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-full z-[9999] bg-[#0a0a0c]/98 backdrop-blur-md border border-[#d4af37]/30 rounded-lg shadow-2xl p-3 min-w-[200px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-[#d4af37] uppercase tracking-widest">Alocar Trabalhador</span>
                <button onClick={(e) => { e.stopPropagation(); setShowWorkerPicker(false); }} className="text-slate-500 hover:text-white transition-colors">
                  <X size={12} />
                </button>
              </div>

              {idleWorkers.length === 0 ? (
                <div className="text-[10px] text-slate-500 font-mono py-2 text-center">
                  Nenhum trabalhador ocioso.
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
                  {idleWorkers.map(w => {
                    const rarityClass = getRarityColor(w.rarity);
                    return (
                      <button
                        key={w.id}
                        className={`flex items-center gap-2 p-2 rounded border bg-[#111] hover:bg-[#1a1811] hover:border-[#d4af37]/50 transition-all text-left ${rarityClass}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          assignWorkerToPlot(plot.id, w.id);
                          setShowWorkerPicker(false);
                          useGameStore.getState().addFloatingText(
                            `⚒️ ${w.name.split(' ')[0]} alocado!`,
                            plot.x, plot.y - 60, 'harvest'
                          );
                        }}
                      >
                        <div className={`p-1 rounded ${w.type === 'lumberjack' ? 'bg-green-950/50' : 'bg-slate-800/50'}`}>
                          {w.type === 'lumberjack' ? <Axe size={12} className="text-green-500" /> : <Pickaxe size={12} className="text-slate-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold truncate">{w.name}</div>
                          <div className="text-[8px] text-slate-500 font-mono">
                            Lvl {w.level} · Eff {w.efficiency.toFixed(2)}×
                          </div>
                        </div>
                        <ChevronRight size={10} className="text-[#d4af37]/50" />
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ─── ACTIVE STATE (Worker Assigned) ──────────────────
  const rarityGlow = assignedWorker.rarity === 'legendary'
    ? 'shadow-[0_0_12px_rgba(245,158,11,0.25)]'
    : assignedWorker.rarity === 'rare'
    ? 'shadow-[0_0_8px_rgba(139,92,246,0.2)]'
    : '';

  return (
    <motion.div
      className="absolute flex flex-col items-center group"
      style={{ left: plot.x - 50, top: plot.y - 50, width: 100, height: 100, zIndex: Math.floor(plot.y) }}
    >
      {/* Active plot ground */}
      <div className={`w-full h-full border-2 rounded-lg flex flex-col items-center justify-center relative overflow-hidden border-emerald-800/50 bg-gradient-to-b from-emerald-950/25 to-[#0a0d10]/50 ${rarityGlow}`}>
        
        {/* Ground texture */}
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: 'radial-gradient(circle, #8b5a2b 1px, transparent 1px)',
          backgroundSize: '8px 8px'
        }} />

        {/* Animated Worker Sprite */}
        <motion.div
          className="relative flex flex-col items-center z-10"
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }}
        >
          {/* Worker Body */}
          <div className="relative w-10 h-12 flex flex-col items-center justify-end">
            {/* Legs */}
            <div className="flex gap-1 absolute bottom-0 z-0">
              <div className="w-1.5 h-3 bg-amber-900 rounded-sm" />
              <div className="w-1.5 h-3 bg-amber-900 rounded-sm" />
            </div>
            
            {/* Body Tunic */}
            <div className="absolute bottom-[8px] w-6 h-7 bg-amber-700 rounded-t-md rounded-b-sm z-10 flex flex-col items-center shadow-inner border border-amber-900">
              <div className="absolute bottom-[3px] w-full h-1 bg-amber-950" />
            </div>

            {/* Head */}
            <div className="absolute top-[0px] w-5 h-5 bg-orange-200 rounded-full z-20 flex flex-col items-center border border-orange-900">
              <div className="absolute top-[-2px] w-7 h-2 bg-yellow-600 rounded-full border border-yellow-800" />
              <div className="absolute top-[-6px] w-4 h-4 bg-yellow-600 rounded-t-full border-t border-x border-yellow-800" />
            </div>

            {/* Arm with Tool */}
            <motion.div
              className="absolute top-[14px] right-[-3px] w-2 h-5 bg-orange-200 rounded-full origin-top z-30 border border-orange-900"
              animate={{ rotate: [0, -55, 0] }}
              transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
            >
              <div className="absolute bottom-[-12px] left-1/2 -translate-x-1/2 drop-shadow-md">
                {assignedWorker.type === 'lumberjack'
                  ? <Axe size={14} className="text-green-500 fill-amber-900" />
                  : <Pickaxe size={14} className="text-slate-300 fill-amber-900" />
                }
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Biome tag */}
        <div className={`absolute top-1 right-1 p-0.5 rounded ${biome.bg}`}>
          <span className="text-[8px]">{biome.emoji}</span>
        </div>

        {/* Unassign button (appears on hover) */}
        <button
          className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-950/80 hover:bg-red-900 border border-red-800/50 rounded p-0.5 z-20"
          onClick={(e) => {
            e.stopPropagation();
            unassignWorkerFromPlot(plot.id);
            useGameStore.getState().addFloatingText(
              `😴 ${assignedWorker.name.split(' ')[0]} removido`,
              plot.x, plot.y - 60, 'harvest'
            );
          }}
        >
          <X size={8} className="text-red-400" />
        </button>
      </div>

      {/* Worker Name + Level Badge */}
      <div className={`absolute -bottom-5 bg-black/95 border rounded px-2 py-0.5 flex items-center gap-1.5 shadow-md whitespace-nowrap ${
        assignedWorker.rarity === 'legendary' ? 'border-amber-500/40' :
        assignedWorker.rarity === 'rare' ? 'border-violet-500/40' :
        'border-[#ffffff]/10'
      }`}>
        <Star size={8} className={
          assignedWorker.rarity === 'legendary' ? 'text-amber-400' :
          assignedWorker.rarity === 'rare' ? 'text-violet-400' :
          'text-slate-500'
        } />
        <span className="text-[8px] font-bold text-white">{assignedWorker.name.split(' ')[0]}</span>
        <span className="text-[7px] font-mono text-slate-500">Lv{assignedWorker.level}</span>
      </div>

      {/* Plot Name on hover */}
      <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 border border-emerald-900/40 px-2 py-0.5 rounded text-[9px] text-emerald-400 font-mono whitespace-nowrap">
        {plot.name}
      </div>
    </motion.div>
  );
});
