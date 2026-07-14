import { create } from 'zustand';
import {
  Position3D,
  VocationType,
  Skills,
  InventoryItem,
  MarketState,
  Worker,
  Corpse,
  GambitConfig
} from '../types/game';

interface GameState {
  // Estado base
  position: Position3D;
  vocation: VocationType | null;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  gold: number;
  isTraining: boolean;

  skills: Skills;
  inventory: InventoryItem[];
  market: MarketState;
  workers: Worker[];
  corpses: Corpse[];
  gambit: GambitConfig;

  // Mocked holes data for intersections
  holes: Position3D[];

  // Actions
  movePlayer: (to: Position3D) => void;
  interactWithRopeSpot: () => void;
  equipItem: (itemId: string) => void;
  tickCombat: () => void;
  tickEconomy: () => void;
  processOfflineProgress: (elapsedSeconds: number) => void;
  setGambitConfig: (config: Partial<GambitConfig>) => void;
  buyCommodity: (commodityId: 'wood'|'stone'|'iron', quantity: number) => void;
  sellCommodity: (commodityId: 'wood'|'stone'|'iron') => void;
}

const defaultState = {
  position: { x: 0, y: 0, z: 0 },
  vocation: null,
  hp: 100,
  maxHp: 100,
  mana: 100,
  maxMana: 100,
  gold: 0,
  isTraining: false,
  skills: {
    axe: { level: 10, xp: 0, xpNeeded: 100 },
    pickaxe: { level: 10, xp: 0, xpNeeded: 100 },
    sword: { level: 10, xp: 0, xpNeeded: 100 },
    shielding: { level: 10, xp: 0, xpNeeded: 100 },
    distance: { level: 10, xp: 0, xpNeeded: 100 },
    magicLevel: { level: 10, xp: 0, xpNeeded: 100 },
  },
  inventory: [],
  market: {
    commodities: {
      wood: { basePrice: 5, currentPrice: 5 },
      stone: { basePrice: 8, currentPrice: 8 },
      iron: { basePrice: 20, currentPrice: 20 },
    },
    currentEvent: null,
  },
  workers: [],
  corpses: [],
  gambit: {
    potionThresholdPercent: 0.4,
    skillsEnabled: true,
  },
  holes: [
    { x: 100, y: 100, z: 0 }, // Example hole
  ]
};

// Initial state hydrated from local storage if exists
const getInitialState = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('idle_kingdoms_state');
    if (saved) {
      try {
        return { ...defaultState, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Failed to parse local storage state", e);
      }
    }
  }
  return defaultState;
};

export const useGameStore = create<GameState>((set, get) => ({
  ...getInitialState(),

  movePlayer: (to) => set((state) => {
    let nextZ = to.z;
    // Intercepta queda no buraco se passar exatamente na mesma cordenada x,y do buraco (assumindo mesmo andar).
    // Para um sistema realista 2D, geralmente teríamos uma margem ou raio.
    const hole = state.holes.find(h => h.z === to.z && Math.abs(h.x - to.x) < 10 && Math.abs(h.y - to.y) < 10);
    
    if (hole) {
      nextZ = -1; // Caiu no buraco
    }

    return {
      position: { ...to, z: nextZ },
      isTraining: false, // Cancela treino ao andar
    };
  }),

  interactWithRopeSpot: () => set((state) => {
    if (state.position.z !== -1) return state;

    const ropeIndex = state.inventory.findIndex(item => item.id === 'rope' && item.quantity > 0);
    if (ropeIndex === -1) return state;

    const newInventory = [...state.inventory];
    newInventory[ropeIndex] = { ...newInventory[ropeIndex], quantity: newInventory[ropeIndex].quantity - 1 };
    
    if (newInventory[ropeIndex].quantity <= 0) {
      newInventory.splice(ropeIndex, 1);
    }

    return {
      position: { ...state.position, z: 0 },
      inventory: newInventory
    };
  }),

  equipItem: (itemId) => set((state) => {
    const item = state.inventory.find(i => i.id === itemId);
    if (!item) return state;
    if (item.type !== 'weapon' && item.type !== 'shield') return state;

    const newInventory = state.inventory.map(i => {
      // Se for do mesmo tipo (weapon ou shield), desequipa mutuamente
      if (i.type === item.type) {
        if (i.id === itemId) {
          // Toggle no equip da peça escolhida
          return { ...i, equipped: !i.equipped };
        }
        // Força desequipar outras peças do mesmo slot
        return { ...i, equipped: false };
      }
      return i;
    });

    return { inventory: newInventory };
  }),

  tickCombat: () => set((state) => {
    let nextHp = state.hp;
    let nextMana = state.mana;
    let nextInventory = [...state.inventory];
    let changed = false;

    // Gambit: Auto-Potion
    if (state.gambit.skillsEnabled) {
      const hpPercentage = nextHp / state.maxHp;
      if (hpPercentage <= state.gambit.potionThresholdPercent) {
        const potionIndex = nextInventory.findIndex(i => i.type === 'potion' && i.quantity > 0);
        if (potionIndex !== -1) {
          nextInventory[potionIndex] = { ...nextInventory[potionIndex], quantity: nextInventory[potionIndex].quantity - 1 };
          if (nextInventory[potionIndex].quantity <= 0) {
            nextInventory.splice(potionIndex, 1);
          }
          nextHp = Math.min(state.maxHp, nextHp + 50);
          changed = true;
        }
      }
    }

    // Gambit: Mage Mana Dump
    if (state.vocation === 'MAGE' && nextMana >= 100) {
      nextMana = 0;
      
      const runeIndex = nextInventory.findIndex(i => i.id === 'fire_rune');
      if (runeIndex !== -1) {
        nextInventory[runeIndex] = { ...nextInventory[runeIndex], quantity: nextInventory[runeIndex].quantity + 1 };
      } else {
        nextInventory.push({
          id: 'fire_rune',
          name: 'Fire Rune',
          quantity: 1,
          type: 'rune'
        });
      }
      changed = true;
    }

    if (!changed) return state;
    return { hp: nextHp, mana: nextMana, inventory: nextInventory };
  }),

  tickEconomy: () => set((state) => {
    const { commodities, currentEvent } = state.market;
    
    // Calcula multiplicador de evento
    let multiplier = 1.0;
    let nextEvent = currentEvent;
    if (currentEvent) {
      if (Date.now() > currentEvent.expiresAt) {
        nextEvent = null; // Evento expirou
      } else {
        multiplier = currentEvent.multiplier;
      }
    }

    // Função auxiliar para variação (ruído aleatório entre -10% e +10%)
    const getFluctuation = (base: number) => {
      const noise = 1 + (Math.random() * 0.2 - 0.1);
      return Math.max(1, Math.floor(base * noise * multiplier));
    };

    return {
      market: {
        currentEvent: nextEvent,
        commodities: {
          wood: { ...commodities.wood, currentPrice: getFluctuation(commodities.wood.basePrice) },
          stone: { ...commodities.stone, currentPrice: getFluctuation(commodities.stone.basePrice) },
          iron: { ...commodities.iron, currentPrice: getFluctuation(commodities.iron.basePrice) },
        }
      }
    };
  }),

  processOfflineProgress: (elapsedSeconds) => set((state) => {
    if (elapsedSeconds <= 0) return state;

    let totalSalaryPerSecond = 0;
    let resourceYields = { wood: 0, stone: 0 }; 

    state.workers.forEach(w => {
      totalSalaryPerSecond += w.salaryPerSecond;
      if (w.type === 'lumberjack') resourceYields.wood += w.resourcePerSecond;
      if (w.type === 'miner') resourceYields.stone += w.resourcePerSecond;
    });

    if (totalSalaryPerSecond === 0 && resourceYields.wood === 0 && resourceYields.stone === 0) {
      return state;
    }

    let activeSeconds = elapsedSeconds;
    
    // Se há custo, verificar quanto tempo o ouro aguenta
    if (totalSalaryPerSecond > 0) {
      const affordableSeconds = Math.floor(state.gold / totalSalaryPerSecond);
      if (affordableSeconds < activeSeconds) {
        activeSeconds = affordableSeconds;
      }
    }

    let nextGold = state.gold;
    let nextInventory = [...state.inventory];

    if (activeSeconds > 0) {
      nextGold -= activeSeconds * totalSalaryPerSecond;

      const addResource = (id: string, name: string, quantity: number) => {
        if (quantity <= 0) return;
        const index = nextInventory.findIndex(i => i.id === id);
        if (index !== -1) {
          nextInventory[index] = { ...nextInventory[index], quantity: nextInventory[index].quantity + quantity };
        } else {
          nextInventory.push({ id, name, type: 'resource', quantity });
        }
      };

      addResource('wood', 'Wood', activeSeconds * resourceYields.wood);
      addResource('stone', 'Stone', activeSeconds * resourceYields.stone);
    }

    return { gold: nextGold, inventory: nextInventory };
  }),

  setGambitConfig: (config) => set((state) => ({
    gambit: { ...state.gambit, ...config }
  })),

  buyCommodity: (commodityId, quantity) => set((state) => {
    const commodity = state.market.commodities[commodityId];
    const totalCost = commodity.currentPrice * quantity;
    if (state.gold < totalCost) return state; // not enough gold

    const nextInventory = [...state.inventory];
    const itemIndex = nextInventory.findIndex(i => i.id === commodityId);
    if (itemIndex !== -1) {
      nextInventory[itemIndex] = { ...nextInventory[itemIndex], quantity: nextInventory[itemIndex].quantity + quantity };
    } else {
      nextInventory.push({
        id: commodityId,
        name: commodityId === 'wood' ? 'Madeira' : commodityId === 'stone' ? 'Pedra' : 'Ferro',
        quantity,
        type: 'resource'
      });
    }

    // Aumento orgânico do preço baseado na Demanda
    const newBase = commodity.basePrice * 1.03;
    const newCurrent = Math.floor(commodity.currentPrice * 1.03);

    return {
      gold: state.gold - totalCost,
      inventory: nextInventory,
      market: {
        ...state.market,
        commodities: {
          ...state.market.commodities,
          [commodityId]: { basePrice: newBase, currentPrice: newCurrent }
        }
      }
    };
  }),

  sellCommodity: (commodityId) => set((state) => {
    const itemIndex = state.inventory.findIndex(i => i.id === commodityId);
    if (itemIndex === -1 || state.inventory[itemIndex].quantity <= 0) return state;

    const quantity = state.inventory[itemIndex].quantity;
    const commodity = state.market.commodities[commodityId];
    const totalRevenue = commodity.currentPrice * quantity;

    const nextInventory = [...state.inventory];
    nextInventory.splice(itemIndex, 1);

    // Queda orgânica do preço baseada na Oferta em excesso
    const newBase = Math.max(1, commodity.basePrice * 0.92);
    const newCurrent = Math.max(1, Math.floor(commodity.currentPrice * 0.92));

    return {
      gold: state.gold + totalRevenue,
      inventory: nextInventory,
      market: {
        ...state.market,
        commodities: {
          ...state.market.commodities,
          [commodityId]: { basePrice: newBase, currentPrice: newCurrent }
        }
      }
    };
  })
}));

// Listener de persistência híbrida (apenas no browser)
if (typeof window !== 'undefined') {
  useGameStore.subscribe((state) => {
    const stateToSave = {
      position: state.position,
      vocation: state.vocation,
      hp: state.hp,
      maxHp: state.maxHp,
      mana: state.mana,
      maxMana: state.maxMana,
      gold: state.gold,
      skills: state.skills,
      inventory: state.inventory,
      market: state.market,
      workers: state.workers,
      corpses: state.corpses,
      gambit: state.gambit
    };
    localStorage.setItem('idle_kingdoms_state', JSON.stringify(stateToSave));
    localStorage.setItem('idle_kingdoms_last_saved', Date.now().toString());
  });
}
