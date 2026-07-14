import { create } from 'zustand';

export interface OtherPlayer {
  id: string;
  name: string;
  x: number;
  y: number;
  isMoving: boolean;
  targetX: number;
  targetY: number;
}

export interface OtherPlot {
  id: string;
  ownerName: string;
  x: number;
  y: number;
}

export interface WorldBoss {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  isActive: boolean;
}

interface MultiplayerState {
  isAlliancePanelOpen: boolean;
  players: OtherPlayer[];
  plots: OtherPlot[];
  worldBoss: WorldBoss;
  
  setAlliancePanelOpen: (isOpen: boolean) => void;
  toggleAlliancePanel: () => void;
  
  // Mocks for moving players randomly
  updatePlayerPositions: () => void;
  
  // World Boss
  attackWorldBoss: (damage: number) => void;
}

export const useMultiplayerStore = create<MultiplayerState>((set) => ({
  isAlliancePanelOpen: false,
  
  players: [
    { id: 'p1', name: 'Arthas', x: 1500, y: 2900, isMoving: false, targetX: 1500, targetY: 2900 },
    { id: 'p2', name: 'Merlin', x: 3700, y: 2200, isMoving: false, targetX: 3700, targetY: 2200 },
    { id: 'p3', name: 'Ragnar', x: 2450, y: 2820, isMoving: false, targetX: 2450, targetY: 2820 },
  ],
  
  plots: [
    { id: 'pl1', ownerName: 'Arthas', x: 2000, y: 2700 },
    { id: 'pl2', ownerName: 'Merlin', x: 2900, y: 2700 },
  ],
  
  worldBoss: {
    id: 'boss1',
    name: 'Dragão Ancião',
    hp: 50000,
    maxHp: 50000,
    x: 4400,
    y: 800,
    isActive: true
  },

  setAlliancePanelOpen: (isOpen) => set({ isAlliancePanelOpen: isOpen }),
  toggleAlliancePanel: () => set((state) => ({ isAlliancePanelOpen: !state.isAlliancePanelOpen })),

  updatePlayerPositions: () => set((state) => {
    const updatedPlayers = state.players.map(p => {
      // Very simple random walk mock
      if (!p.isMoving && Math.random() > 0.8) {
        return {
          ...p,
          isMoving: true,
          targetX: p.x + (Math.random() - 0.5) * 200,
          targetY: p.y + (Math.random() - 0.5) * 200
        };
      }
      
      if (p.isMoving) {
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < 5) {
          return { ...p, isMoving: false };
        }
        
        return {
          ...p,
          x: p.x + (dx / dist) * 2,
          y: p.y + (dy / dist) * 2
        };
      }
      return p;
    });
    
    return { players: updatedPlayers };
  }),

  attackWorldBoss: (damage) => set((state) => {
    if (!state.worldBoss.isActive) return state;
    
    const newHp = Math.max(0, state.worldBoss.hp - damage);
    return {
      worldBoss: {
        ...state.worldBoss,
        hp: newHp,
        isActive: newHp > 0
      }
    };
  })
}));
