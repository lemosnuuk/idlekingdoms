"use client";

import { useLogisticsStore } from "@/stores/logisticsStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { X, Map, Package, ArrowRight, Coins, TreePine, Diamond } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const ITEM_BASE_PRICES: Record<string, number> = {
  wood: 2, // 1G no mercado rápido, 2G na Capital
  stone: 3,
  leather: 5,
  iron_ore: 8,
};

export default function LogisticsPanel() {
  const { isOpen, toggleLogistics, activeCaravan, loadItem, unloadItem, dispatchCaravan, collectReward } = useLogisticsStore();
  const { items, getQuantity, addItem, addGold, removeItem } = useInventoryStore();

  const [expectedReward, setExpectedReward] = useState(0);

  useEffect(() => {
    let total = 0;
    if (activeCaravan) {
      activeCaravan.payload.forEach(item => {
        total += (ITEM_BASE_PRICES[item.itemId] || 1) * item.quantity;
      });
    }
    setExpectedReward(total);
  }, [activeCaravan]);

  const handleLoad = (itemId: string) => {
    const qty = getQuantity(itemId);
    if (qty > 0) {
      removeItem(itemId, 1);
      loadItem(itemId, 1);
    }
  };

  const handleUnload = (itemId: string) => {
    const payloadQty = activeCaravan?.payload.find(i => i.itemId === itemId)?.quantity || 0;
    if (payloadQty > 0) {
      unloadItem(itemId, 1);
      addItem(itemId, 1);
    }
  };

  const handleDispatch = () => {
    if (expectedReward > 0) {
      dispatchCaravan(expectedReward, 30); // 30s travel for MVP (15s out, 15s back)
    }
  };

  const handleCollect = () => {
    if (activeCaravan?.status === 'arrived') {
      addGold(activeCaravan.goldReward);
      collectReward();
    }
  };

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
          <div className="w-96 h-full bg-gradient-to-b from-[#141417]/95 to-[#0b0b0d]/98 border-r border-[#ffffff]/5 backdrop-blur-md shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-[#ffffff]/5 bg-black/20">
              <div className="flex items-center gap-3">
                <Map className="text-[#d4af37]" size={20} />
                <h2 className="font-serif font-bold text-lg text-[#d4af37] uppercase tracking-widest">Expedições</h2>
              </div>
              <button onClick={toggleLogistics} className="text-fantasy-text-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-6">
              
              {/* Caravan Cargo */}
              <div className="bg-[#0a0a0c] border border-[#ffffff]/5 rounded-lg p-4 shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)] flex flex-col">
                <h3 className="text-[11px] font-bold text-fantasy-text-muted uppercase tracking-widest mb-4">Carga da Caravana</h3>
                
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  {activeCaravan?.payload.map(item => (
                    <div key={item.itemId} className="flex justify-between items-center bg-[#0b0b0d] border border-[#d4af37]/30 p-2 rounded shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                      <button 
                        onClick={() => handleUnload(item.itemId)}
                        disabled={activeCaravan.status !== 'preparing'}
                        className="p-1.5 bg-[#1a1811] rounded hover:bg-red-950/50 hover:text-red-400 text-fantasy-text-muted disabled:opacity-50 transition-colors rotate-180 border border-[#ffffff]/5"
                      >
                        <ArrowRight size={12} />
                      </button>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-slate-200 capitalize">{item.itemId.replace('_', ' ')}</span>
                        <span className="text-[11px] text-[#d4af37] font-mono bg-black/50 px-1.5 py-0.5 rounded border border-[#ffffff]/5">x{item.quantity}</span>
                      </div>
                    </div>
                  ))}
                  {(!activeCaravan || activeCaravan.payload.length === 0) && (
                    <div className="flex flex-col items-center justify-center h-24 text-fantasy-text-muted opacity-50 font-serif">
                      <Package size={24} className="mb-2" />
                      <span className="text-[10px] uppercase tracking-wider">Carroça vazia</span>
                    </div>
                  )}
                </div>

                {/* Status & Controls */}
                <div className="border-t border-[#ffffff]/5 pt-4">
                  <div className="flex justify-between items-center mb-4 bg-black/40 px-3 py-2 rounded border border-[#ffffff]/5">
                    <span className="text-[10px] text-fantasy-text-muted uppercase tracking-wider font-serif">Lucro Projetado:</span>
                    <span className="flex items-center gap-1 text-[#d4af37] font-bold text-xs drop-shadow-[0_0_5px_rgba(212,175,55,0.4)]">
                      {expectedReward} <Coins size={14} />
                    </span>
                  </div>

                  {!activeCaravan || activeCaravan.status === 'preparing' ? (
                    <button 
                      onClick={handleDispatch}
                      disabled={expectedReward === 0}
                      className="w-full bg-[#1a1811] hover:bg-[#d4af37] border border-[#d4af37]/30 hover:text-black text-[#d4af37] disabled:opacity-40 disabled:hover:bg-[#1a1811] disabled:hover:text-[#d4af37] py-2.5 rounded text-[11px] font-bold transition-all uppercase tracking-wider shadow-[0_0_10px_rgba(212,175,55,0.1)]"
                    >
                      Despachar para a Capital (30s)
                    </button>
                  ) : activeCaravan.status === 'arrived' ? (
                    <button 
                      onClick={handleCollect}
                      className="w-full bg-gradient-to-r from-green-800 to-green-600 hover:from-green-700 hover:to-green-500 text-white font-bold py-2.5 rounded transition-all animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.3)] text-[11px] uppercase tracking-widest border border-green-500/50"
                    >
                      Coletar Lucros! (+{activeCaravan.goldReward}G)
                    </button>
                  ) : (
                    <div className="w-full bg-[#0a0a0c] border border-[#d4af37]/50 text-[#d4af37] text-center font-bold py-2.5 rounded text-[10px] uppercase tracking-widest animate-pulse shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
                      {activeCaravan.status === 'traveling_out' ? 'Viajando para a Capital...' : 'Retornando com Ouro...'}
                    </div>
                  )}
                </div>
              </div>

              {/* Inventory to Load */}
              <div className="bg-[#0b0b0d] border border-[#ffffff]/5 rounded-lg p-4 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
                <h3 className="text-[11px] font-bold text-fantasy-text-muted uppercase tracking-widest mb-3">Seu Armazém</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {items.map(item => (
                    <div key={item.itemId} className="flex justify-between items-center bg-black/40 border border-[#ffffff]/5 p-2 rounded hover:border-fantasy-accent/30 transition-colors">
                      <span className="text-[11px] text-slate-300 capitalize font-bold">{item.itemId.replace('_', ' ')}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-fantasy-text-muted font-mono bg-black px-1.5 py-0.5 rounded border border-[#ffffff]/10">x{item.quantity}</span>
                        <button 
                          onClick={() => handleLoad(item.itemId)}
                          disabled={activeCaravan?.status === 'traveling_out' || activeCaravan?.status === 'traveling_back' || activeCaravan?.status === 'arrived'}
                          className="p-1 bg-[#1a1811] border border-[#ffffff]/10 rounded hover:bg-[#d4af37]/20 hover:text-[#d4af37] text-fantasy-text-muted disabled:opacity-50 transition-colors shadow-sm"
                        >
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <div className="text-[10px] text-fantasy-text-muted text-center py-6 font-serif">Armazém vazio</div>}
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
