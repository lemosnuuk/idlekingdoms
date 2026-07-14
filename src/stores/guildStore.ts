import { create } from 'zustand';
import { useInventoryStore } from './inventoryStore';
import { useGameStore } from './gameStore';

export interface B2BContract {
  id: string;
  name: string;
  reqIron: number;
  reqWood: number;
  bailCost: number;
  baseDurationMs: number;
  rewardItem: string;
  rewardQty: number;
}

export interface ActiveShipment {
  id: string;
  contractId: string;
  name: string;
  startTime: number;
  endTime: number;
  status: 'TRANSIT' | 'READY';
  rewardItem: string;
  rewardQty: number;
}

interface GuildState {
  isOpen: boolean;
  fleetLevel: number;
  contracts: B2BContract[];
  activeShipments: ActiveShipment[];
  
  setIsOpen: (isOpen: boolean) => void;
  upgradeFleet: () => void;
  acceptContract: (contract: B2BContract) => void;
  collectShipment: (shipmentId: string) => void;
  checkShipments: () => void;
}

const initialContracts: B2BContract[] = [
  { id: 'c1', name: 'Armada Imperial', reqIron: 5000, reqWood: 2000, bailCost: 10000, baseDurationMs: 120000, rewardItem: 'obsidian_scroll', rewardQty: 1 },
  { id: 'c2', name: 'Torre de Marfim', reqIron: 2000, reqWood: 8000, bailCost: 8000, baseDurationMs: 150000, rewardItem: 'dark_iron', rewardQty: 3 },
  { id: 'c3', name: 'Mercadores do Sul', reqIron: 10000, reqWood: 10000, bailCost: 25000, baseDurationMs: 300000, rewardItem: 'crown_jewel', rewardQty: 1 },
];

export const useGuildStore = create<GuildState>((set, get) => ({
  isOpen: false,
  fleetLevel: 1,
  contracts: initialContracts,
  activeShipments: [],

  setIsOpen: (isOpen) => set({ isOpen }),

  upgradeFleet: () => {
    const { fleetLevel } = get();
    const inventory = useInventoryStore.getState();
    const costDarkIron = fleetLevel * 2;
    
    const darkIronItem = inventory.items.find(i => i.itemId === 'dark_iron');
    if (darkIronItem && darkIronItem.quantity >= costDarkIron) {
      inventory.removeItem('dark_iron', costDarkIron);
      set({ fleetLevel: fleetLevel + 1 });
      useGameStore.getState().addFloatingText(`Frota Nível ${fleetLevel + 1}!`, 2500, 2500, 'level_up');
    }
  },

  acceptContract: (contract) => {
    const inventory = useInventoryStore.getState();
    const wood = inventory.items.find(i => i.itemId === 'wood')?.quantity || 0;
    const iron = inventory.items.find(i => i.itemId === 'iron_ore')?.quantity || 0;
    
    if (wood >= contract.reqWood && iron >= contract.reqIron && inventory.gold >= contract.bailCost) {
      // Consume resources
      inventory.removeItem('wood', contract.reqWood);
      inventory.removeItem('iron_ore', contract.reqIron);
      inventory.removeGold(contract.bailCost);

      const { fleetLevel, activeShipments } = get();
      const timeReduction = (fleetLevel - 1) * 0.15; // 15% per level above 1
      const actualDuration = contract.baseDurationMs * (1 - timeReduction);
      
      const newShipment: ActiveShipment = {
        id: `shipment_${Date.now()}`,
        contractId: contract.id,
        name: contract.name,
        startTime: Date.now(),
        endTime: Date.now() + actualDuration,
        status: 'TRANSIT',
        rewardItem: contract.rewardItem,
        rewardQty: contract.rewardQty
      };

      set({ activeShipments: [...activeShipments, newShipment] });
    }
  },

  collectShipment: (shipmentId) => {
    const { activeShipments } = get();
    const shipment = activeShipments.find(s => s.id === shipmentId);
    
    if (shipment && shipment.status === 'READY') {
      // Deliver rewards
      useInventoryStore.getState().addItem(shipment.rewardItem, shipment.rewardQty);
      useGameStore.getState().addFloatingText(`✨ +${shipment.rewardQty} ${shipment.rewardItem.toUpperCase()}`, 2500, 2500, 'legendary_loot');
      
      // Remove from active
      set({ activeShipments: activeShipments.filter(s => s.id !== shipmentId) });
    }
  },

  checkShipments: () => {
    set((state) => {
      const now = Date.now();
      let changed = false;
      const nextShipments = state.activeShipments.map(s => {
        if (s.status === 'TRANSIT' && now >= s.endTime) {
          changed = true;
          return { ...s, status: 'READY' as const };
        }
        return s;
      });
      return changed ? { activeShipments: nextShipments } : state;
    });
  }
}));
