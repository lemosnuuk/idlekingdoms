import { create } from 'zustand';
import { useInventoryStore } from '@/stores/inventoryStore';

export interface MarketPrices {
  wood: number;
  stone: number;
  iron_ore: number;
}

export interface PriceHistory {
  wood: number[];
  stone: number[];
  iron_ore: number[];
}

export type GlobalEvent = 'none' | 'winter' | 'volcano' | 'pirates';

interface MarketState {
  isOpen: boolean;
  prices: MarketPrices;
  basePrices: MarketPrices;
  history: PriceHistory;
  activeEvent: GlobalEvent;
  eventDuration: number; // ticks remaining
  eventNotification: string | null;
  
  setIsOpen: (isOpen: boolean) => void;
  toggleMarket: () => void;
  buyResource: (itemId: 'wood' | 'stone' | 'iron_ore', quantity: number) => boolean;
  sellResource: (itemId: 'wood' | 'stone' | 'iron_ore', quantity: number) => boolean;
  tickMarket: () => void;
  triggerEvent: (event: GlobalEvent) => void;
  clearNotification: () => void;
}

const MIN_PRICES: MarketPrices = { wood: 1.0, stone: 1.5, iron_ore: 3.0 };
const MAX_PRICES: MarketPrices = { wood: 6.0, stone: 9.0, iron_ore: 20.0 };

export const useMarketStore = create<MarketState>((set, get) => ({
  isOpen: false,
  
  // Starting prices
  prices: { wood: 2.0, stone: 3.0, iron_ore: 7.0 },
  basePrices: { wood: 2.0, stone: 3.0, iron_ore: 7.0 },
  
  // Starting histories (fill with base values to render chart lines immediately)
  history: {
    wood: [2.0, 2.1, 1.9, 2.0, 2.2, 2.0, 2.1, 1.9, 2.0, 2.2, 2.0],
    stone: [3.0, 2.9, 3.1, 3.0, 3.2, 3.0, 2.9, 3.1, 3.0, 3.2, 3.0],
    iron_ore: [7.0, 7.2, 6.8, 7.1, 7.5, 7.0, 7.2, 6.8, 7.1, 7.5, 7.0]
  },
  
  activeEvent: 'none',
  eventDuration: 0,
  eventNotification: null,
  
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleMarket: () => set((state) => ({ isOpen: !state.isOpen })),
  
  clearNotification: () => set({ eventNotification: null }),

  buyResource: (itemId, quantity) => {
    const state = get();
    const price = state.prices[itemId];
    const totalCost = Math.round(price * quantity);
    
    const inventory = useInventoryStore.getState();
    if (inventory.gold >= totalCost && !inventory.isFull()) {
      // 1. Process trade
      inventory.removeGold(totalCost);
      inventory.addItem(itemId, quantity);
      
      // 2. Adjust base price upwards (demand increases value)
      const currentBase = state.basePrices[itemId];
      const newBase = Math.min(MAX_PRICES[itemId], currentBase + quantity * 0.05);
      
      set((s) => {
        const nextBasePrices = { ...s.basePrices, [itemId]: newBase };
        const nextPrices = recalculatePrices(nextBasePrices, s.activeEvent);
        return {
          basePrices: nextBasePrices,
          prices: nextPrices
        };
      });
      return true;
    }
    return false;
  },

  sellResource: (itemId, quantity) => {
    const state = get();
    const price = state.prices[itemId];
    const totalEarn = Math.round(price * quantity);
    
    const inventory = useInventoryStore.getState();
    const invQty = inventory.getQuantity(itemId);
    
    if (invQty >= quantity) {
      // 1. Process trade
      inventory.removeItem(itemId, quantity);
      inventory.addGold(totalEarn);
      
      // 2. Adjust base price downwards (supply floods the market)
      const currentBase = state.basePrices[itemId];
      const newBase = Math.max(MIN_PRICES[itemId], currentBase - quantity * 0.05);
      
      set((s) => {
        const nextBasePrices = { ...s.basePrices, [itemId]: newBase };
        const nextPrices = recalculatePrices(nextBasePrices, s.activeEvent);
        return {
          basePrices: nextBasePrices,
          prices: nextPrices
        };
      });
      return true;
    }
    return false;
  },

  tickMarket: () => {
    set((s) => {
      // 1. Decrypt or process event duration
      let nextEvent = s.activeEvent;
      let nextDuration = s.eventDuration;
      let notification = s.eventNotification;

      if (nextDuration > 0) {
        nextDuration--;
        if (nextDuration === 0) {
          nextEvent = 'none';
          notification = "📢 Evento Climático Encerrado: Os preços voltaram ao normal.";
        }
      }

      // If no active event, 8% chance to trigger a new event per tick
      if (nextEvent === 'none' && Math.random() < 0.08) {
        const events: GlobalEvent[] = ['winter', 'volcano', 'pirates'];
        const chosen = events[Math.floor(Math.random() * events.length)];
        nextEvent = chosen;
        nextDuration = 12; // lasts 12 ticks (2 minutes at 10s tick)

        if (chosen === 'winter') {
          notification = "❄️ Inverno Rigoroso! A escassez de lenha aumentou o preço da Madeira em 50%.";
        } else if (chosen === 'volcano') {
          notification = "🌋 Atividade Vulcânica! Novas veias de ferro expostas derrubaram o preço do Ferro em 40%.";
        } else if (chosen === 'pirates') {
          notification = "🏴‍☠️ Ataque de Piratas! Rotas de caravanas bloqueadas elevaram o valor de tudo em 30%.";
        }
      }

      // 2. Add random price fluctuations to the base prices
      const nextBasePrices = { ...s.basePrices };
      (Object.keys(nextBasePrices) as Array<keyof MarketPrices>).forEach((key) => {
        const volatility = key === 'iron_ore' ? 0.6 : 0.25;
        const noise = (Math.random() - 0.5) * volatility;
        const nextBase = Math.max(MIN_PRICES[key], Math.min(MAX_PRICES[key], nextBasePrices[key] + noise));
        nextBasePrices[key] = nextBase;
      });

      // 3. Recalculate dynamic prices with event multipliers
      const nextPrices = recalculatePrices(nextBasePrices, nextEvent);

      // 4. Update histories
      const nextHistory = { ...s.history };
      (Object.keys(nextHistory) as Array<keyof PriceHistory>).forEach((key) => {
        const arr = [...nextHistory[key], nextPrices[key]].slice(-15); // keep last 15 points
        nextHistory[key] = arr;
      });

      return {
        activeEvent: nextEvent,
        eventDuration: nextDuration,
        eventNotification: notification,
        basePrices: nextBasePrices,
        prices: nextPrices,
        history: nextHistory
      };
    });
  },

  triggerEvent: (event) => {
    set((s) => {
      let duration = 12;
      let notification = null;
      if (event === 'winter') {
        notification = "❄️ Inverno Rigoroso! Preço da Madeira subiu 50%.";
      } else if (event === 'volcano') {
        notification = "🌋 Atividade Vulcânica! Preço do Ferro desabou 40%.";
      } else if (event === 'pirates') {
        notification = "🏴‍☠️ Ataque de Piratas! Todos os preços subiram 30%.";
      } else {
        duration = 0;
        notification = "📢 Mercado Estável: Preços normalizados.";
      }

      const nextPrices = recalculatePrices(s.basePrices, event);
      return {
        activeEvent: event,
        eventDuration: duration,
        eventNotification: notification,
        prices: nextPrices
      };
    });
  }
}));

// Helper to apply event multipliers to base prices
function recalculatePrices(base: MarketPrices, event: GlobalEvent): MarketPrices {
  const nextPrices = { ...base };
  
  if (event === 'winter') {
    nextPrices.wood = base.wood * 1.5;
  } else if (event === 'volcano') {
    nextPrices.iron_ore = base.iron_ore * 0.6;
  } else if (event === 'pirates') {
    nextPrices.wood = base.wood * 1.3;
    nextPrices.stone = base.stone * 1.3;
    nextPrices.iron_ore = base.iron_ore * 1.3;
  }

  // Format to 2 decimal places
  nextPrices.wood = Math.round(nextPrices.wood * 100) / 100;
  nextPrices.stone = Math.round(nextPrices.stone * 100) / 100;
  nextPrices.iron_ore = Math.round(nextPrices.iron_ore * 100) / 100;

  return nextPrices;
}
