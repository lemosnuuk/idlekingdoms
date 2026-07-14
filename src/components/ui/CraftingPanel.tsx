"use client";

import { useCraftingStore, CraftingRecipe } from "@/stores/craftingStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { X, Hammer, TreePine, Diamond, Pickaxe, CheckCircle2, Swords, Shield, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

export default function CraftingPanel() {
  const { recipes, isOpen, activeCraft, toggleCrafting, startCrafting, updateCraftingProgress, completeCrafting } = useCraftingStore();
  const { items, getQuantity, addItem, removeItem, isFull } = useInventoryStore();

  const getItemIcon = (id: string) => {
    switch(id) {
      case 'wood': return <TreePine size={14} className="text-fantasy-success" />;
      case 'stone': return <Diamond size={14} className="text-slate-400" />;
      case 'iron_ore': return <Diamond size={14} className="text-red-500" />;
      case 'stone_axe': 
      case 'iron_axe': 
      case 'heavy_axe': 
        return <span className="text-xl">🪓</span>;
      case 'stone_pickaxe': 
        return <span className="text-xl">⛏️</span>;
      case 'spear': 
        return <span className="text-xl">🏹</span>;
      case 'iron_sword': 
        return <Swords size={24} className="text-fantasy-accent" />;
      case 'wooden_shield': 
      case 'iron_shield': 
        return <Shield size={24} className="text-slate-300" />;
      default: return <Package size={14} className="text-fantasy-text-muted" />;
    }
  };

  const canCraft = (recipe: CraftingRecipe) => {
    if (isFull()) return false;
    for (const req of recipe.ingredients) {
      if (getQuantity(req.itemId) < req.quantity) return false;
    }
    return true;
  };

  const handleStartCrafting = (recipe: CraftingRecipe) => {
    if (activeCraft || !canCraft(recipe)) return;
    
    // Remove ingredientes
    for (const req of recipe.ingredients) {
      removeItem(req.itemId, req.quantity);
    }
    
    startCrafting(recipe);
  };

  // Idle Timer logic
  useEffect(() => {
    if (!activeCraft) return;
    
    const interval = setInterval(() => {
      updateCraftingProgress(1); // 1 tick = 1 segundo
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeCraft, updateCraftingProgress]);

  // Complete logic
  useEffect(() => {
    if (activeCraft && activeCraft.progress >= activeCraft.maxProgress) {
      const recipe = useCraftingStore.getState().recipes.find(r => r.id === activeCraft.recipeId);
      const amount = recipe?.yield || 1;
      addItem(activeCraft.recipeId.replace('r_', ''), amount);
      completeCrafting();
    }
  }, [activeCraft, addItem, completeCrafting]);

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
                <Hammer className="text-[#d4af37]" size={20} />
                <h2 className="font-serif font-bold text-lg text-[#d4af37] uppercase tracking-widest">Forja</h2>
              </div>
              <button onClick={toggleCrafting} className="text-fantasy-text-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto space-y-6">
              
              {/* Active Crafting Queue */}
              <div className="bg-[#0a0a0c] border border-[#ffffff]/5 rounded-lg p-4 shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)]">
                <h3 className="text-[11px] font-bold text-fantasy-text-muted uppercase tracking-widest mb-4">Trabalho Atual</h3>
                
                {activeCraft ? (
                  <div className="flex flex-col items-center text-center">
                    <Hammer size={28} className="text-[#d4af37] mb-3 animate-bounce shadow-[0_0_15px_rgba(212,175,55,0.4)] rounded-full" />
                    <h4 className="text-slate-200 font-bold text-sm mb-3">Forjando...</h4>
                    
                    {/* Progress Bar Neon */}
                    <div className="w-full h-1.5 bg-black rounded-full overflow-hidden mb-2 shadow-[inset_0_1px_3px_rgba(0,0,0,0.9)] border border-[#ffffff]/5">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-800 to-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)] transition-all duration-1000 ease-linear"
                        style={{ width: `${(activeCraft.progress / activeCraft.maxProgress) * 100}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-mono text-fantasy-text-muted">
                      {activeCraft.progress}s / {activeCraft.maxProgress}s
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center text-fantasy-text-muted opacity-50 flex flex-col items-center">
                    <Hammer size={24} className="mb-2" />
                    <p className="text-xs">A forja está fria.</p>
                  </div>
                )}
              </div>

              {/* Recipes List */}
              <div>
                <h3 className="text-[11px] font-bold text-fantasy-text-muted uppercase tracking-widest mb-3">Receitas</h3>
                
                <div className="space-y-3">
                  {recipes.map(recipe => (
                    <div key={recipe.id} className="bg-[#0b0b0d] border border-[#ffffff]/5 rounded-lg p-3 flex gap-3 hover:border-fantasy-accent/30 transition-colors">
                      <div className="w-12 h-12 bg-black rounded shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] border border-[#ffffff]/10 flex items-center justify-center flex-shrink-0">
                        {getItemIcon(recipe.resultItemId)}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-bold text-slate-200">{recipe.name}</h4>
                          <span className="text-[10px] text-fantasy-text-muted font-mono">{recipe.timeSeconds}s</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 mb-3">
                          {recipe.ingredients.map(req => {
                            const has = getQuantity(req.itemId);
                            const hasEnough = has >= req.quantity;
                            return (
                              <div key={req.itemId} className="flex items-center gap-1.5 text-[11px] font-mono">
                                <span className="opacity-80">{getItemIcon(req.itemId)}</span>
                                <span className={hasEnough ? 'text-slate-300' : 'text-red-500 font-bold'}>{has}/{req.quantity}</span>
                              </div>
                            );
                          })}
                        </div>
                        
                        <button 
                          onClick={() => handleStartCrafting(recipe)}
                          disabled={!!activeCraft || !canCraft(recipe)}
                          className="w-full bg-[#1a1811] hover:bg-[#d4af37] border border-[#d4af37]/30 hover:text-black disabled:opacity-40 disabled:hover:bg-[#1a1811] disabled:hover:text-fantasy-text-muted text-[#d4af37] py-1 rounded text-[11px] font-bold transition-all uppercase tracking-wider"
                        >
                          {activeCraft ? 'Ocupada' : 'Fabricar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
