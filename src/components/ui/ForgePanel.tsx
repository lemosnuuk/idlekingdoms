"use client";

import { useCraftingStore } from "@/stores/craftingStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useGameStore } from "@/stores/gameStore";
import { X, Hammer, Shield, Swords } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const RECIPES = [
  {
    id: 'iron_short_sword',
    name: 'Espada Curta de Ferro',
    type: 'weapon',
    stats: 'Dano +8, Tick 1.1s',
    cost: { iron_ore: 20, wood: 10, stone: 0 }
  },
  {
    id: 'heavy_war_axe',
    name: 'Machado de Guerra Pesado',
    type: 'weapon',
    stats: 'Dano +15, Tick 2.0s',
    cost: { iron_ore: 40, wood: 30, stone: 0 }
  },
  {
    id: 'reinforced_wood_shield',
    name: 'Escudo de Madeira Ref.',
    type: 'shield',
    stats: 'Defesa +3',
    cost: { wood: 25, stone: 5, iron_ore: 0 }
  },
  {
    id: 'iron_tower_shield',
    name: 'Tower Shield de Ferro',
    type: 'shield',
    stats: 'Defesa +12',
    cost: { iron_ore: 35, stone: 15, wood: 0 }
  },
  {
    id: 'iron_spear_500',
    name: 'Iron Spear (500x)',
    type: 'weapon',
    stats: 'Exclusivo Paladino',
    cost: { iron_ore: 5, wood: 5, stone: 0 }
  }
];

export default function ForgePanel() {
  const { isOpen, toggleCrafting } = useCraftingStore();
  const { getQuantity, removeItem } = useInventoryStore();
  const { inventory, craftItem, equipItem } = useGameStore();

  const handleCraft = (recipeId: string, cost: { wood: number, stone: number, iron_ore: number }) => {
    // Deduct resources
    if (cost.wood > 0) removeItem('wood', cost.wood);
    if (cost.stone > 0) removeItem('stone', cost.stone);
    if (cost.iron_ore > 0) removeItem('iron_ore', cost.iron_ore);
    
    craftItem(recipeId);
  };

  const equipments = inventory.filter(i => i.type === 'weapon' || i.type === 'shield');

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
          <div className="w-96 h-full bg-[#0a0a0c] border-l border-[#ffffff]/5 shadow-2xl flex flex-col font-sans">
            
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-[#ffffff]/5 bg-black/40 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Hammer className="text-[#9ca3af]" size={20} />
                <h2 className="font-serif font-bold text-lg text-slate-200 uppercase tracking-widest">Forja & Equipamentos</h2>
              </div>
              <button onClick={toggleCrafting} className="text-[#6b7280] hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Equipamentos (Gerenciamento) */}
              <div>
                <h3 className="text-[11px] font-bold text-[#6b7280] uppercase tracking-widest mb-3">Seus Equipamentos</h3>
                <div className="space-y-2">
                  {equipments.length === 0 ? (
                    <div className="text-center py-4 text-[#4b5563] text-xs font-mono border border-dashed border-[#374151]/50 rounded-lg">
                      Nenhum equipamento forjado.
                    </div>
                  ) : (
                    equipments.map(item => (
                      <div 
                        key={item.id}
                        onClick={() => equipItem(item.id)}
                        className={`relative p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${item.equipped ? 'bg-[#1a1811] border-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.1)]' : 'bg-[#111113] border-[#27272a] hover:border-[#3f3f46]'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded ${item.type === 'weapon' ? 'bg-red-950/30 text-red-400' : 'bg-slate-800/50 text-slate-300'}`}>
                            {item.type === 'weapon' ? <Swords size={16} /> : <Shield size={16} />}
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-xs font-bold ${item.equipped ? 'text-[#d4af37]' : 'text-slate-300'}`}>{item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}</span>
                            <span className="text-[10px] font-mono text-[#6b7280]">
                              {item.damage ? `Dano +${item.damage}` : ''} {item.defense ? `Def +${item.defense}` : ''}
                            </span>
                          </div>
                        </div>
                        {item.equipped && (
                          <div className="absolute top-2 right-2 bg-[#d4af37] text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow">
                            EQ
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Grid de Receitas */}
              <div>
                <h3 className="text-[11px] font-bold text-[#6b7280] uppercase tracking-widest mb-3">Receitas de Forja</h3>
                <div className="space-y-3">
                  {RECIPES.map(recipe => {
                    const woodQty = getQuantity('wood');
                    const stoneQty = getQuantity('stone');
                    const ironQty = getQuantity('iron_ore');
                    
                    const canAfford = 
                      woodQty >= recipe.cost.wood && 
                      stoneQty >= recipe.cost.stone && 
                      ironQty >= recipe.cost.iron_ore;

                    return (
                      <div key={recipe.id} className="bg-[#111113] border border-[#27272a] rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-xs font-bold text-slate-200">{recipe.name}</div>
                            <div className="text-[10px] text-[#d4af37] font-mono mt-0.5">{recipe.stats}</div>
                          </div>
                          <div className="flex gap-1.5 text-[10px] font-mono">
                            {recipe.cost.wood > 0 && <span className={woodQty >= recipe.cost.wood ? 'text-[#6b7280]' : 'text-red-500'}>{recipe.cost.wood}W</span>}
                            {recipe.cost.stone > 0 && <span className={stoneQty >= recipe.cost.stone ? 'text-[#6b7280]' : 'text-red-500'}>{recipe.cost.stone}S</span>}
                            {recipe.cost.iron_ore > 0 && <span className={ironQty >= recipe.cost.iron_ore ? 'text-[#6b7280]' : 'text-red-500'}>{recipe.cost.iron_ore}I</span>}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleCraft(recipe.id, recipe.cost)}
                          disabled={!canAfford}
                          className="w-full bg-[#18181b] hover:bg-[#27272a] border border-[#3f3f46] text-slate-300 disabled:opacity-30 disabled:hover:bg-[#18181b] disabled:hover:border-[#3f3f46] py-1.5 rounded text-[10px] font-bold transition-all uppercase tracking-wider"
                        >
                          Forjar
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
