"use client";

import { useHousingStore } from "@/stores/housingStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { X, Hammer, Tent, Flame, Coins, TreePine, Diamond, Map } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ConstructionPanel() {
  const { selectedPlotId, plots, openPlotMenu, buyPlot, buildStructure } = useHousingStore();
  const { gold, getQuantity, removeGold, removeItem } = useInventoryStore();

  const plot = plots.find(p => p.id === selectedPlotId);

  const structures = [
    { type: 'tent' as const, name: 'Tenda Básica', cost: { wood: 20, stone: 0 } },
    { type: 'campfire' as const, name: 'Fogueira', cost: { wood: 10, stone: 5 } },
    { type: 'training_dummy' as const, name: 'Boneco de Treino', cost: { wood: 30, stone: 15 } },
  ];

  if (!selectedPlotId || !plot) return null;

  const handleBuyPlot = () => {
    if (gold >= plot.basePrice) {
      removeGold(plot.basePrice);
      buyPlot(plot.id);
    } else {
      alert("Ouro insuficiente!");
    }
  };

  const handleBuild = (type: 'tent' | 'campfire' | 'training_dummy', cost: { wood: number, stone: number }) => {
    const hasWood = getQuantity('wood') >= cost.wood;
    const hasStone = getQuantity('stone') >= cost.stone;

    if (hasWood && hasStone) {
      if (cost.wood > 0) removeItem('wood', cost.wood);
      if (cost.stone > 0) removeItem('stone', cost.stone);
      buildStructure(plot.id, type);
    }
  };

  return (
    <AnimatePresence>
      {(selectedPlotId && plot) && (
        <motion.div 
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 384, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="h-full pointer-events-auto overflow-hidden flex-shrink-0"
        >
          <div className="w-96 h-full bg-gradient-to-b from-[#141417]/95 to-[#0b0b0d]/98 border-l border-[#ffffff]/5 backdrop-blur-md shadow-2xl flex flex-col">
            
            <div className="flex justify-between items-center p-5 border-b border-[#ffffff]/5 bg-black/20">
              <div className="flex items-center gap-3">
                <Hammer className="text-[#d4af37]" size={20} />
                <h2 className="font-serif font-bold text-lg text-[#d4af37] uppercase tracking-widest">
                  {plot.isOwned ? 'Construir' : 'Terreno'}
                </h2>
              </div>
              <button onClick={() => openPlotMenu(null)} className="text-fantasy-text-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
              {!plot.isOwned ? (
                <div className="bg-[#0a0a0c] border border-[#ffffff]/5 rounded-lg p-6 text-center shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)] h-full flex flex-col justify-center">
                  <div className="w-16 h-16 bg-black/50 border border-[#d4af37]/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                    <Map size={32} className="text-[#d4af37]/60" />
                  </div>
                  <h3 className="text-[13px] font-bold text-white uppercase tracking-widest mb-2">Lote Disponível</h3>
                  <p className="text-[10px] text-fantasy-text-muted mb-8 font-mono leading-relaxed px-2">
                    Compre este terreno para expandir sua vila e construir novas estruturas de produção.
                  </p>
                  <button 
                    onClick={handleBuyPlot}
                    className="w-full bg-[#1a1811] hover:bg-[#d4af37] border border-[#d4af37]/50 hover:text-black text-[#d4af37] transition-all font-bold py-3.5 rounded text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                  >
                    Comprar por {plot.basePrice} <Coins size={14} />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-[11px] font-bold text-fantasy-text-muted uppercase tracking-widest mb-2">Estruturas</h3>
                  {structures.map(struct => {
                    const canAfford = getQuantity('wood') >= struct.cost.wood && getQuantity('stone') >= struct.cost.stone;
                    return (
                      <div key={struct.type} className="bg-[#0a0a0c] border border-[#ffffff]/5 p-3.5 rounded-lg flex items-center justify-between shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#0b0b0d] rounded shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] border border-[#ffffff]/10 flex items-center justify-center text-slate-300">
                            {struct.type === 'tent' ? <Tent size={20} /> : struct.type === 'campfire' ? <Flame size={20} className="text-orange-400" /> : <span className="text-lg">🎯</span>}
                          </div>
                          <div>
                            <div className="font-bold text-slate-200 text-xs uppercase tracking-wider">{struct.name}</div>
                            <div className="flex gap-2 text-[10px] font-mono text-fantasy-text-muted mt-1">
                              {struct.cost.wood > 0 && <span className="flex items-center gap-1 bg-black/40 px-1 rounded"><TreePine size={10} className="text-green-500/70" /> {getQuantity('wood')}/{struct.cost.wood}</span>}
                              {struct.cost.stone > 0 && <span className="flex items-center gap-1 bg-black/40 px-1 rounded"><Diamond size={10} className="text-slate-400/70" /> {getQuantity('stone')}/{struct.cost.stone}</span>}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleBuild(struct.type, struct.cost)}
                          disabled={!canAfford}
                          className="px-3 py-1.5 bg-[#1a1811] hover:bg-[#d4af37] border border-[#d4af37]/30 hover:border-[#d4af37] text-[#d4af37] hover:text-black disabled:opacity-40 disabled:hover:bg-[#1a1811] disabled:hover:text-[#d4af37] disabled:hover:border-[#d4af37]/30 rounded text-[10px] font-bold transition-all uppercase tracking-widest"
                        >
                          Construir
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
