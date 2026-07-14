import { create } from 'zustand';

export interface CaravanPayloadItem {
  itemId: string;
  quantity: number;
}

export interface CaravanData {
  id: string;
  payload: CaravanPayloadItem[];
  status: 'preparing' | 'traveling_out' | 'traveling_back' | 'arrived';
  dispatchTime: number | null;
  returnTime: number | null;
  goldReward: number;
}

interface LogisticsState {
  isOpen: boolean;
  activeCaravan: CaravanData | null;
  
  setIsOpen: (isOpen: boolean) => void;
  toggleLogistics: () => void;
  
  loadItem: (itemId: string, quantity: number) => void;
  unloadItem: (itemId: string, quantity: number) => void;
  
  dispatchCaravan: (expectedReward: number, durationSeconds: number) => void;
  updateCaravanStatus: (status: CaravanData['status']) => void;
  collectReward: () => void;
}

export const useLogisticsStore = create<LogisticsState>((set) => ({
  isOpen: false,
  activeCaravan: null,

  setIsOpen: (isOpen) => set({ isOpen }),
  toggleLogistics: () => set((state) => ({ isOpen: !state.isOpen })),

  loadItem: (itemId, quantity) => set((state) => {
    let caravan = state.activeCaravan;
    if (!caravan) {
      caravan = {
        id: Math.random().toString(),
        payload: [],
        status: 'preparing',
        dispatchTime: null,
        returnTime: null,
        goldReward: 0,
      };
    }
    if (caravan.status !== 'preparing') return state;

    const existing = caravan.payload.find(i => i.itemId === itemId);
    let newPayload;
    if (existing) {
      newPayload = caravan.payload.map(i => i.itemId === itemId ? { ...i, quantity: i.quantity + quantity } : i);
    } else {
      newPayload = [...caravan.payload, { itemId, quantity }];
    }

    return { activeCaravan: { ...caravan, payload: newPayload } };
  }),

  unloadItem: (itemId, quantity) => set((state) => {
    if (!state.activeCaravan || state.activeCaravan.status !== 'preparing') return state;
    
    const newPayload = state.activeCaravan.payload.map(i => {
      if (i.itemId === itemId) return { ...i, quantity: Math.max(0, i.quantity - quantity) };
      return i;
    }).filter(i => i.quantity > 0);

    // Se esvaziou a caravana e ela não foi despachada, pode anular
    if (newPayload.length === 0) return { activeCaravan: null };

    return { activeCaravan: { ...state.activeCaravan, payload: newPayload } };
  }),

  dispatchCaravan: (expectedReward, durationSeconds) => set((state) => {
    if (!state.activeCaravan || state.activeCaravan.status !== 'preparing') return state;
    const now = Date.now();
    return {
      activeCaravan: {
        ...state.activeCaravan,
        status: 'traveling_out',
        dispatchTime: now,
        returnTime: now + (durationSeconds * 1000), // ida e volta
        goldReward: expectedReward
      }
    };
  }),

  updateCaravanStatus: (status) => set((state) => {
    if (!state.activeCaravan) return state;
    return { activeCaravan: { ...state.activeCaravan, status } };
  }),

  collectReward: () => set({ activeCaravan: null }),
}));
