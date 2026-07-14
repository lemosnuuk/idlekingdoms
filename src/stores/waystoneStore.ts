import { create } from 'zustand';
import { useInventoryStore } from './inventoryStore';

interface WaystoneRequirement {
  wood: number;
  stone: number;
  iron_ore: number;
}

export const WAYSTONE_COST: WaystoneRequirement = {
  wood: 500,
  stone: 500,
  iron_ore: 100
};

interface WaystoneProgress {
  wood: number;
  stone: number;
  iron_ore: number;
}

interface WaystoneState {
  progressByMap: Record<string, WaystoneProgress>;
  unlockedMaps: string[];
  
  // UI State
  activeWaystoneMapId: string | null;
  setActiveWaystoneMapId: (mapId: string | null) => void;

  depositMaterial: (mapId: string, material: keyof WaystoneRequirement, amount: number) => void;
  checkUnlock: (mapId: string) => void;
}

export const useWaystoneStore = create<WaystoneState>((set, get) => ({
  progressByMap: {},
  unlockedMaps: [],
  activeWaystoneMapId: null,

  setActiveWaystoneMapId: (mapId) => set({ activeWaystoneMapId: mapId }),

  depositMaterial: (mapId, material, amount) => set((state) => {
    const inventory = useInventoryStore.getState();
    const currentQty = inventory.getQuantity(material);
    
    if (currentQty <= 0) return state;

    const progress = state.progressByMap[mapId] || { wood: 0, stone: 0, iron_ore: 0 };
    const needed = Math.max(0, WAYSTONE_COST[material] - progress[material]);
    
    if (needed <= 0) return state;

    // The actual amount we can deposit
    const toDeposit = Math.min(amount, needed, currentQty);
    
    if (toDeposit > 0) {
      inventory.removeItem(material, toDeposit);
      
      const newProgress = { ...progress, [material]: progress[material] + toDeposit };
      const newProgressByMap = { ...state.progressByMap, [mapId]: newProgress };
      
      // Auto-save
      localStorage.setItem('kingdoms_waystones', JSON.stringify({ progressByMap: newProgressByMap, unlockedMaps: state.unlockedMaps }));
      
      return { progressByMap: newProgressByMap };
    }

    return state;
  }),

  checkUnlock: (mapId) => set((state) => {
    if (state.unlockedMaps.includes(mapId)) return state;

    const p = state.progressByMap[mapId];
    if (!p) return state;

    if (p.wood >= WAYSTONE_COST.wood && p.stone >= WAYSTONE_COST.stone && p.iron_ore >= WAYSTONE_COST.iron_ore) {
      const nextUnlocked = [...state.unlockedMaps, mapId];
      localStorage.setItem('kingdoms_waystones', JSON.stringify({ progressByMap: state.progressByMap, unlockedMaps: nextUnlocked }));
      return { unlockedMaps: nextUnlocked };
    }
    return state;
  })
}));
