import { create } from 'zustand';
import { supabase, getLocalCharacterId, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useQuestStore } from '@/stores/questStore';
import { useGameStore } from '@/stores/gameStore';

export interface InventoryItem {
  itemId: string;
  quantity: number;
}

interface InventoryState {
  items: InventoryItem[];
  gold: number;
  maxSlots: number;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleInventory: () => void;
  addItem: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string, quantity: number) => void;
  addGold: (amount: number) => void;
  removeGold: (amount: number) => void;
  getQuantity: (itemId: string) => number;
  isFull: () => boolean;
  setItems: (items: InventoryItem[]) => void;
  consumeItem: (itemId: string) => boolean;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  gold: 0,
  maxSlots: 20, // Inicial de 20 slots de diferentes itens
  isOpen: false,
  
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleInventory: () => set((state) => ({ isOpen: !state.isOpen })),
  
  addItem: (itemId, quantity) => set((state) => {
    if (itemId === 'wood') {
      useQuestStore.getState().progressQuest('collect_wood', quantity);
    }
    const existing = state.items.find(i => i.itemId === itemId);
    let newItems = [...state.items];
    if (existing) {
      newItems = state.items.map(i => 
        i.itemId === itemId ? { ...i, quantity: i.quantity + quantity } : i
      );
    } else {
      if (state.items.length >= state.maxSlots) return state;
      newItems.push({ itemId, quantity });
    }
    
    // Save to LocalStorage
    localStorage.setItem('kingdoms_items', JSON.stringify(newItems));
    
    // Save to Supabase (fire-and-forget)
    const charId = getLocalCharacterId();
    if (charId && isSupabaseConfigured) {
      const itemQuantity = newItems.find(i => i.itemId === itemId)?.quantity || 0;
      supabase.from('inventory_items').select('id').eq('character_id', charId).eq('item_id', itemId).then(({ data }) => {
        if (data && data.length > 0) {
          supabase.from('inventory_items').update({ quantity: itemQuantity }).eq('character_id', charId).eq('item_id', itemId).then();
        } else {
          supabase.from('inventory_items').insert([{ character_id: charId, item_id: itemId, quantity: itemQuantity }]).then();
        }
      });
    }

    return { items: newItems };
  }),
  
  removeItem: (itemId, quantity) => set((state) => {
    const newItems = state.items.map(i => {
      if (i.itemId === itemId) {
        return { ...i, quantity: Math.max(0, i.quantity - quantity) };
      }
      return i;
    }).filter(i => i.quantity > 0);

    // Save to LocalStorage
    localStorage.setItem('kingdoms_items', JSON.stringify(newItems));

    // Save to Supabase (fire-and-forget)
    const charId = getLocalCharacterId();
    if (charId && isSupabaseConfigured) {
      const itemQuantity = newItems.find(i => i.itemId === itemId)?.quantity || 0;
      if (itemQuantity === 0) {
        supabase.from('inventory_items').delete().eq('character_id', charId).eq('item_id', itemId).then();
      } else {
        supabase.from('inventory_items').select('id').eq('character_id', charId).eq('item_id', itemId).then(({ data }) => {
          if (data && data.length > 0) {
            supabase.from('inventory_items').update({ quantity: itemQuantity }).eq('character_id', charId).eq('item_id', itemId).then();
          }
        });
      }
    }

    return { items: newItems };
  }),

  addGold: (amount) => set((state) => {
    const newGold = state.gold + amount;
    // Auto-save to LocalStorage
    localStorage.setItem('kingdoms_gold', newGold.toString());
    // Auto-save to Supabase
    const charId = getLocalCharacterId();
    if (charId && isSupabaseConfigured) {
      supabase.from('characters').update({ gold: newGold }).eq('id', charId).then();
    }
    return { gold: newGold };
  }),
  removeGold: (amount) => set((state) => {
    const newGold = Math.max(0, state.gold - amount);
    // Auto-save to LocalStorage
    localStorage.setItem('kingdoms_gold', newGold.toString());
    // Auto-save to Supabase
    const charId = getLocalCharacterId();
    if (charId && isSupabaseConfigured) {
      supabase.from('characters').update({ gold: newGold }).eq('id', charId).then();
    }
    return { gold: newGold };
  }),

  getQuantity: (itemId) => {
    return get().items.find(i => i.itemId === itemId)?.quantity || 0;
  },

  isFull: () => {
    return get().items.length >= get().maxSlots;
  },

  setItems: (items) => set((state) => {
    localStorage.setItem('kingdoms_items', JSON.stringify(items));
    return { items };
  }),

  consumeItem: (itemId) => {
    const state = get();
    const qty = state.getQuantity(itemId);
    if (qty <= 0) return false;

    // Apply logic depending on item type
    const game = useGameStore.getState();
    let consumed = false;

    if (itemId === 'health_potion') {
      game.addStatusEffect({
        name: 'Regeneração Menor',
        type: 'REGENERATION',
        magnitude: 3,
        durationTicks: 50, // 10 seconds (50 ticks of 200ms)
        remainingTicks: 50
      });
      consumed = true;
    } else if (itemId === 'antidote') {
      game.removeStatusEffect('POISON');
      consumed = true;
    } else if (itemId === 'speed_potion') {
      game.addStatusEffect({
        name: 'Haste',
        type: 'HASTE',
        magnitude: 1,
        durationTicks: 150, // 30 seconds
        remainingTicks: 150
      });
      consumed = true;
    } else if (itemId === 'raw_fish' || itemId === 'lobo_do_mar_pequeno') {
      game.setHp(game.hp + 20);
      game.addFloatingText("💚 +20 HP", game.characterPosition.x, game.characterPosition.y, 'level_up');
      consumed = true;
    } else if (itemId === 'water_rune' || itemId === 'runa_alagada') {
      game.setMana(game.mana + 10);
      game.addFloatingText("🔵 +10 Mana", game.characterPosition.x, game.characterPosition.y, 'level_up');
      consumed = true;
    } else if (itemId === 'fire_rune') {
      const { useCombatStore } = require('./combatStore');
      const combat = useCombatStore.getState();
      const activeId = combat.activeMonsterId;
      if (activeId) {
        const activeMonster = combat.monstersByMap[game.currentMapId]?.find((m: any) => m.id === activeId);
        if (activeMonster?.isWorldBoss) {
          const { useWorldBossStore } = require('./worldBossStore');
          const worldBossState = useWorldBossStore.getState();
          
          if (worldBossState.worldEvent?.isShieldPhase) {
            worldBossState.setShieldPhase(false);
            game.addFloatingText("🔥 ESCUDO ELEMENTAL DESTRUÍDO!", activeMonster.x, activeMonster.y - 30, 'player_damage');
          } else {
            combat.updateMonsterHp(activeId, Math.max(0, activeMonster.hp - 1000));
            game.addFloatingText("-1000", activeMonster.x, activeMonster.y, 'enemy_damage');
          }
          consumed = true;
        }
      }
    }

    if (consumed) {
      state.removeItem(itemId, 1);
      return true;
    }

    return false;
  }
}));
