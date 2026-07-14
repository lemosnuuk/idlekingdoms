"use client";

import { useInventoryStore } from "@/stores/inventoryStore";
import { useGameStore, PlayerSkills } from "@/stores/gameStore";
import { X, Package, TreePine, Diamond, Swords, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InventoryPanel() {
  const { items, maxSlots, isOpen, toggleInventory, removeItem, gold } = useInventoryStore();
  
  const skills = useGameStore(state => state.skills);
  const level = useGameStore(state => state.level);
  const vocation = useGameStore(state => state.vocation);
  const setVocation = useGameStore(state => state.setVocation);
  const equippedWeapon = useGameStore(state => state.equippedWeapon);
  const equippedShield = useGameStore(state => state.equippedShield);
  const equipWeapon = useGameStore(state => state.equipWeapon);
  const equipShield = useGameStore(state => state.equipShield);

  const getItemIcon = (id: string) => {
    switch(id) {
      case 'wood': return <TreePine className="text-fantasy-success" />;
      case 'stone': return <Diamond className="text-slate-400" />;
      case 'iron_ore': return <Diamond className="text-red-500" />;
      case 'iron_sword': return <Swords className="text-fantasy-accent" />;
      case 'heavy_axe': return <span className="text-xl">🪓</span>;
      case 'wooden_shield': return <Shield className="text-amber-800" />;
      case 'iron_shield': return <Shield className="text-slate-300" />;
      case 'health_potion':
      case 'Potion':
        return <span className="text-xl">🧪</span>;
      case 'antidote':
        return <span className="text-xl">🌿</span>;
      case 'speed_potion':
        return <span className="text-xl">⚡</span>;
      case 'rope':
        return <span className="text-xl">🪢</span>;
      case 'spear':
        return <span className="text-xl">🏹</span>;
      case 'fire_rune':
        return <span className="text-xl">🔥</span>;
      case 'healing_rune':
        return <span className="text-xl">💖</span>;
      case 'raw_fish':
        return <span className="text-xl">🐟</span>;
      case 'water_rune':
        return <span className="text-xl">💧</span>;
      default: return <Package className="text-fantasy-text-muted" />;
    }
  };

  const getItemName = (id: string) => {
    switch(id) {
      case 'wood': return "Madeira";
      case 'stone': return "Pedra";
      case 'iron_ore': return "Minério de Ferro";
      case 'iron_sword': return "Espada Curta de Ferro";
      case 'heavy_axe': return "Machado de Guerra Pesado";
      case 'wooden_shield': return "Escudo de Madeira Reforçado";
      case 'iron_shield': return "Tower Shield de Ferro";
      case 'health_potion':
      case 'Potion':
        return "Poção de Vida (Regen)";
      case 'antidote':
        return "Antídoto (Cura Veneno)";
      case 'speed_potion':
        return "Poção de Velocidade (Haste)";
      case 'rope':
        return "Corda (Rope)";
      case 'spear':
        return "Lança de Ferro";
      case 'fire_rune':
        return "Runa de Fogo (Mage)";
      case 'healing_rune':
        return "Runa de Cura (Mage)";
      case 'raw_fish':
        return "Lobo do Mar Pequeno (+20 HP)";
      case 'water_rune':
        return "Runa Alagada (+10 Mana)";
      default: return id;
    }
  };

  const isWeapon = (id: string) => id === 'iron_sword' || id === 'heavy_axe';
  const isShield = (id: string) => id === 'wooden_shield' || id === 'iron_shield';
  const isConsumable = (id: string) => id === 'health_potion' || id === 'Potion' || id === 'antidote' || id === 'speed_potion' || id === 'raw_fish' || id === 'water_rune';

  const handleItemClick = (itemId: string) => {
    if (isWeapon(itemId)) {
      equipWeapon(itemId);
    } else if (isShield(itemId)) {
      equipShield(itemId);
    } else if (isConsumable(itemId)) {
      useInventoryStore.getState().consumeItem(itemId);
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
          <div className="w-96 h-full bg-gradient-to-b from-[#141417]/95 to-[#0b0b0d]/98 border-l border-[#ffffff]/5 backdrop-blur-md shadow-2xl flex flex-col">
            <div className="flex flex-col p-5 border-b border-[#ffffff]/5 bg-black/20 gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h2 className="font-serif font-bold text-lg text-fantasy-accent uppercase tracking-widest">Inventário</h2>
                  <div className="flex gap-2">
                    <span className="text-[10px] bg-black/50 text-slate-300 border border-[#ffffff]/10 px-2 py-0.5 rounded font-mono shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                      Lvl {level}
                    </span>
                    <span className="text-[10px] bg-amber-950/30 text-[#d4af37] border border-[#d4af37]/30 px-2 py-0.5 rounded font-mono shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] flex items-center gap-1">
                      <span>🪙</span> {gold}
                    </span>
                  </div>
                </div>
                <button onClick={toggleInventory} className="text-fantasy-text-muted hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-fantasy-text-muted font-serif uppercase tracking-widest">Vocações:</span>
                <select 
                  value={vocation} 
                  onChange={(e) => setVocation(e.target.value as any)}
                  className="bg-black/50 text-[11px] text-[#d4af37] border border-[#d4af37]/30 rounded px-2 py-1 outline-none font-serif uppercase tracking-widest cursor-pointer hover:border-[#d4af37] transition-colors appearance-none flex-1"
                >
                  <option value="None">Nenhuma Classe</option>
                  <option value="Knight">🛡️ Knight</option>
                  <option value="Paladin">🏹 Paladin</option>
                  <option value="Mage">🔮 Mage</option>
                </select>
              </div>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              <div>
                <div className="flex justify-between text-[11px] text-fantasy-text-muted mb-4 font-serif uppercase tracking-wider">
                  <span>Capacidade</span>
                  <span className="font-bold text-white">{items.length} / {maxSlots} Slots</span>
                </div>
   
                <div className="grid grid-cols-4 gap-3">
                  {/* Renderiza itens possuídos */}
                  {items.map((item) => {
                    const isEquipped = item.itemId === equippedWeapon || item.itemId === equippedShield;
                    return (
                      <div 
                        key={item.itemId} 
                        onClick={() => handleItemClick(item.itemId)}
                        className={`aspect-square bg-[#0a0a0c] shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)] border rounded-lg flex flex-col items-center justify-center relative group cursor-pointer transition-all duration-300 ${
                          isEquipped 
                            ? 'border-[#d4af37]/60 shadow-[0_0_15px_rgba(212,175,55,0.2),inset_0_2px_5px_rgba(0,0,0,0.8)] bg-[#1a1811]' 
                            : 'border-[#ffffff]/5 hover:border-fantasy-accent/50'
                        }`}
                      >
                        {getItemIcon(item.itemId)}
                        <span className="absolute bottom-1 right-1 text-[10px] font-bold bg-black/90 px-1 rounded text-slate-300 border border-[#ffffff]/10 leading-none">
                          {item.quantity}
                        </span>
                        
                        {isEquipped && (
                          <span className="absolute top-1 left-1 text-[8px] font-extrabold bg-[#d4af37] text-black px-1 py-0.5 rounded leading-none shadow-[0_0_5px_#d4af37]">
                            EQ
                          </span>
                        )}
                        
                        {/* Tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0b0b0d]/95 border border-[#ffffff]/10 backdrop-blur-md px-3 py-1.5 rounded text-[11px] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 font-serif text-fantasy-text shadow-xl">
                          {getItemName(item.itemId)} {isEquipped && <span className="text-[#d4af37] ml-1">(Equipado)</span>}
                        </div>
                      </div>
                    );
                  })}
   
                  {/* Renderiza slots vazios */}
                  {Array.from({ length: maxSlots - items.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square bg-[#0a0a0c] shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)] border border-[#ffffff]/5 rounded-lg opacity-50" />
                  ))}
                </div>
              </div>
   
              {/* Tibia Skills Subsection */}
              <div className="pt-6 border-t border-[#ffffff]/5 space-y-4 font-serif">
                <h3 className="text-[11px] font-bold text-fantasy-text-muted uppercase tracking-widest mb-2">Treinamento & Habilidades</h3>
                
                {[
                  { name: 'Axe Fighting', key: 'axeFighting', icon: '🪓', bgGradient: 'from-red-900 to-orange-500', glow: 'shadow-[0_0_10px_rgba(249,115,22,0.4)]' },
                  { name: 'Pickaxe Fighting', key: 'pickaxeFighting', icon: '⛏️', bgGradient: 'from-stone-700 to-slate-300', glow: 'shadow-[0_0_10px_rgba(203,213,225,0.4)]' },
                  { name: 'Sword Fighting', key: 'swordFighting', icon: '⚔️', bgGradient: 'from-yellow-900 to-yellow-400', glow: 'shadow-[0_0_10px_rgba(250,204,21,0.4)]' },
                  { name: 'Shielding', key: 'shielding', icon: '🛡️', bgGradient: 'from-blue-900 to-cyan-400', glow: 'shadow-[0_0_10px_rgba(34,211,238,0.4)]' },
                  { name: 'Distance Fighting', key: 'distanceFighting', icon: '🏹', bgGradient: 'from-green-900 to-emerald-400', glow: 'shadow-[0_0_10px_rgba(52,211,153,0.4)]' },
                  { name: 'Magic Level', key: 'magicLevel', icon: '🔮', bgGradient: 'from-purple-900 to-fuchsia-400', glow: 'shadow-[0_0_10px_rgba(192,38,211,0.4)]' }
                ].map(s => {
                  const skill = skills[s.key as keyof PlayerSkills];
                  const pct = Math.min(100, Math.floor((skill.xp / skill.xpNeeded) * 100));
                  return (
                    <div key={s.key} className="space-y-1.5 group cursor-default">
                      <div className="flex justify-between items-end text-xs">
                        <span className="flex items-center gap-2 text-white font-medium">
                          <span className="text-sm">{s.icon}</span> 
                          {s.name} 
                          <span className="text-[#d4af37] font-bold ml-1">Lvl {skill.level}</span>
                        </span>
                        <span className="text-[10px] text-fantasy-text-muted font-mono opacity-80 group-hover:opacity-100 transition-opacity">
                          {skill.xp} / {skill.xpNeeded} XP
                        </span>
                      </div>
                      <div className="w-full h-2 bg-black rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.9)] border border-[#ffffff]/5 relative overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${s.bgGradient} ${s.glow} transition-all duration-500 ease-out`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
