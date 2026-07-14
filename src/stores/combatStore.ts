import { create } from 'zustand';
import { useQuestStore } from '@/stores/questStore';
import { useGameStore } from '@/stores/gameStore';

export interface MonsterData {
  id: string;
  name: string;
  type: 'wolf' | 'orc';
  level: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  x: number;
  y: number;
  isDead: boolean;
  floor: number;
  status: 'idle' | 'agro';
  spawnX: number;
  spawnY: number;
  isMiniBoss?: boolean;
  contractId?: string;
  isWorldBoss?: boolean;
  shieldActive?: boolean;
}

interface CombatLog {
  id: string;
  message: string;
  type: 'player' | 'enemy' | 'system';
}

interface CombatState {
  isOpen: boolean;
  monstersByMap: Record<string, MonsterData[]>;
  activeMonsterId: string | null;
  logs: CombatLog[];
  
  setIsOpen: (isOpen: boolean) => void;
  toggleCombatPanel: () => void;
  
  engageMonster: (monsterId: string) => void;
  disengage: () => void;
  
  addLog: (message: string, type: 'player' | 'enemy' | 'system') => void;
  clearLogs: () => void;
  
  updateMonsterHp: (monsterId: string, hp: number) => void;
  markMonsterDead: (monsterId: string) => void;
  addMonster: (monster: MonsterData) => void;
  addMonsterToMap: (mapId: string, monster: MonsterData) => void;
  updateMonsterPosition: (monsterId: string, x: number, y: number) => void;
  setMonsterStatus: (monsterId: string, status: 'idle' | 'agro') => void;
}

export const useCombatStore = create<CombatState>((set, get) => ({
  isOpen: false,
  monstersByMap: {
    'HUB_VILA_CENTRAL': [
      { id: 'm1', name: 'Lobo Selvagem', type: 'wolf', level: 1, hp: 50, maxHp: 50, attack: 5, defense: 2, x: 1800, y: 2200, isDead: false, floor: 0, status: 'idle', spawnX: 1800, spawnY: 2200 },
      { id: 'm2', name: 'Lobo Selvagem', type: 'wolf', level: 1, hp: 50, maxHp: 50, attack: 5, defense: 2, x: 1200, y: 3100, isDead: false, floor: 0, status: 'idle', spawnX: 1200, spawnY: 3100 },
      { id: 'm3', name: 'Orc Batedor', type: 'orc', level: 2, hp: 80, maxHp: 80, attack: 12, defense: 5, x: 3500, y: 1200, isDead: false, floor: 0, status: 'idle', spawnX: 3500, spawnY: 1200 },
      { id: 'm4', name: 'Orc Batedor', type: 'orc', level: 2, hp: 80, maxHp: 80, attack: 12, defense: 5, x: 3200, y: 3700, isDead: false, floor: 0, status: 'idle', spawnX: 3200, spawnY: 3700 },
      
      // Floor 1 (Mountain)
      { id: 'm5', name: 'Lobo da Montanha', type: 'wolf', level: 3, hp: 100, maxHp: 100, attack: 15, defense: 6, x: 2400, y: 950, isDead: false, floor: 1, status: 'idle', spawnX: 2400, spawnY: 950 },
      { id: 'm6', name: 'Orc Guerreiro', type: 'orc', level: 4, hp: 120, maxHp: 120, attack: 22, defense: 10, x: 2600, y: 1050, isDead: false, floor: 1, status: 'idle', spawnX: 2600, spawnY: 1050 },
      
      // Floor -1 (Caverns)
      { id: 'm7', name: 'Lobo das Cavernas', type: 'wolf', level: 3, hp: 110, maxHp: 110, attack: 18, defense: 8, x: 1900, y: 2400, isDead: false, floor: -1, status: 'idle', spawnX: 1900, spawnY: 2400 },
      { id: 'm8', name: 'Orc de Elite', type: 'orc', level: 5, hp: 160, maxHp: 160, attack: 30, defense: 15, x: 3700, y: 3500, isDead: false, floor: -1, status: 'idle', spawnX: 3700, spawnY: 3500 }
    ]
  },
  activeMonsterId: null,
  logs: [],

  setIsOpen: (isOpen) => set({ isOpen }),
  toggleCombatPanel: () => set((state) => ({ isOpen: !state.isOpen })),

  engageMonster: (monsterId) => set({ activeMonsterId: monsterId, isOpen: true }),
  
  disengage: () => set({ activeMonsterId: null }),

  addLog: (message, type) => set((state) => ({
    logs: [...state.logs, { id: Math.random().toString(), message, type }].slice(-20) // Keep last 20 logs
  })),

  clearLogs: () => set({ logs: [] }),

  updateMonsterHp: (monsterId, hp) => set((state) => {
    const mapId = useGameStore.getState().currentMapId;
    const currentMonsters = state.monstersByMap[mapId] || [];
    return {
      monstersByMap: {
        ...state.monstersByMap,
        [mapId]: currentMonsters.map(m => m.id === monsterId ? { ...m, hp: Math.max(0, hp) } : m)
      }
    };
  }),

  markMonsterDead: (monsterId) => set((state) => {
    useQuestStore.getState().progressQuest('kill_monster', 1);
    const game = useGameStore.getState();
    const mapId = game.currentMapId;
    const currentMonsters = state.monstersByMap[mapId] || [];
    
    // Check if the killed monster is the Sewer Rat
    const deadMonster = currentMonsters.find(m => m.id === monsterId);
    if (deadMonster && deadMonster.name === 'Rato de Esgoto' && !game.achievements.ratKilled) {
      game.updateAchievement('ratKilled', true);
    }
    
    return {
      monstersByMap: {
        ...state.monstersByMap,
        [mapId]: currentMonsters.map(m => m.id === monsterId ? { ...m, isDead: true, hp: 0 } : m)
      },
      activeMonsterId: state.activeMonsterId === monsterId ? null : state.activeMonsterId
    };
  }),

  addMonster: (monster) => set((state) => {
    const mapId = useGameStore.getState().currentMapId;
    return {
      monstersByMap: {
        ...state.monstersByMap,
        [mapId]: [...(state.monstersByMap[mapId] || []), monster]
      }
    };
  }),

  addMonsterToMap: (mapId, monster) => set((state) => {
    return {
      monstersByMap: {
        ...state.monstersByMap,
        [mapId]: [...(state.monstersByMap[mapId] || []), monster]
      }
    };
  }),

  updateMonsterPosition: (monsterId, x, y) => set((state) => {
    const mapId = useGameStore.getState().currentMapId;
    const currentMonsters = state.monstersByMap[mapId] || [];
    return {
      monstersByMap: {
        ...state.monstersByMap,
        [mapId]: currentMonsters.map(m => m.id === monsterId ? { ...m, x, y } : m)
      }
    };
  }),
  
  setMonsterStatus: (monsterId, status) => set((state) => {
    const mapId = useGameStore.getState().currentMapId;
    const currentMonsters = state.monstersByMap[mapId] || [];
    return {
      monstersByMap: {
        ...state.monstersByMap,
        [mapId]: currentMonsters.map(m => m.id === monsterId ? { ...m, status } : m)
      }
    };
  })
}));
