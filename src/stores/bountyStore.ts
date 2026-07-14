import { create } from 'zustand';
import { useCombatStore, MonsterData } from './combatStore';
import { useGameStore } from './gameStore';

export interface BountyContract {
  id: string;
  name: string;
  reqLvl: number;
  status: 'AVAILABLE' | 'ACTIVE' | 'COMPLETED';
  bossType: 'wolf' | 'orc';
  baseHp: number;
  baseAtk: number;
  baseDef: number;
}

interface BountyState {
  isOpen: boolean;
  contracts: BountyContract[];
  setIsOpen: (isOpen: boolean) => void;
  acceptContract: (id: string) => void;
  completeContract: (id: string) => void;
}

const initialContracts: BountyContract[] = [
  { id: 'lobo_alfa', name: 'Lobo Alfa', reqLvl: 5, status: 'AVAILABLE', bossType: 'wolf', baseHp: 300, baseAtk: 25, baseDef: 8 },
  { id: 'orc_renegado', name: 'Orc Renegado', reqLvl: 8, status: 'AVAILABLE', bossType: 'orc', baseHp: 450, baseAtk: 40, baseDef: 15 }
];

export const useBountyStore = create<BountyState>((set, get) => ({
  isOpen: false,
  contracts: initialContracts,

  setIsOpen: (isOpen) => set({ isOpen }),

  acceptContract: (id) => {
    set((state) => {
      const nextContracts = state.contracts.map(c => c.id === id ? { ...c, status: 'ACTIVE' as const } : c);
      const contract = state.contracts.find(c => c.id === id);
      
      if (contract) {
        // Spawn Mini Boss
        const spawnX = Math.random() > 0.5 ? 500 + Math.random() * 500 : 3500 + Math.random() * 800;
        const spawnY = 500 + Math.random() * 3500;
        
        const miniBoss: MonsterData = {
          id: `miniboss_${id}_${Date.now()}`,
          name: contract.name,
          type: contract.bossType,
          level: contract.reqLvl + 2,
          hp: contract.baseHp,
          maxHp: contract.baseHp,
          attack: contract.baseAtk,
          defense: contract.baseDef,
          x: spawnX,
          y: spawnY,
          spawnX,
          spawnY,
          isDead: false,
          floor: 0, // Superfície
          status: 'idle',
          isMiniBoss: true,
          contractId: id
        };

        useCombatStore.getState().addMonster(miniBoss);
        useGameStore.getState().addFloatingText("⚠️ Mini-boss Spawned!", spawnX, spawnY - 40, 'player_damage');
      }

      return { contracts: nextContracts };
    });
  },

  completeContract: (id) => {
    set((state) => {
      const nextContracts = state.contracts.map(c => c.id === id ? { ...c, status: 'COMPLETED' as const } : c);
      return { contracts: nextContracts };
    });
  }
}));
