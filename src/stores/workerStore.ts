import { create } from 'zustand';
import { useQuestStore } from '@/stores/questStore';
import { supabase, getLocalCharacterId, isSupabaseConfigured } from '@/lib/supabaseClient';

// ─── Rarity System ──────────────────────────────────────────

export type WorkerRarity = 'common' | 'rare' | 'legendary';

export interface WorkerData {
  id: string;
  name: string;
  type: 'lumberjack' | 'miner';
  assignedPlotId: string | null;
  assignedMapId: string;
  status: 'working' | 'sleeping';
  isRebelling?: boolean;

  // Dynamic RPG attributes
  level: number;
  xp: number;
  xpToNextLevel: number;
  efficiency: number;   // Resource multiplier per tick (1.0 – 2.5)
  speed: number;        // Tick interval in ms (lower = faster)
  rarity: WorkerRarity;
}

interface WorkerState {
  isOpen: boolean;
  workers: WorkerData[];
  setIsOpen: (isOpen: boolean) => void;
  toggleWorkers: () => void;
  hireWorker: (type: 'lumberjack' | 'miner') => void;
  assignWorker: (workerId: string, plotId: string) => void;
  updateWorkerStatus: (workerId: string, status: 'working' | 'sleeping') => void;
  setWorkerRebelling: (workerId: string, isRebelling: boolean) => void;
  dispatchWorkers: (type: 'lumberjack' | 'miner', count: number, mapId: string) => void;
  recallWorkers: (type: 'lumberjack' | 'miner', count: number, mapId: string) => void;
  gainWorkerXp: (workerId: string, amount: number) => void;
}

// ─── Expanded Name Pool ─────────────────────────────────────

const FIRST_NAMES = [
  "Garrick", "Elara", "Thorne", "Bram", "Lyra", "Kael", "Sylas",
  "Bruno", "Roderick", "Aldric", "Freya", "Cedric", "Isolde", "Oswin",
  "Hilda", "Leofric", "Rowan", "Astrid", "Gunther", "Maren",
  "Sigrid", "Torsten", "Ingrid", "Halvard", "Eirik", "Dagny",
  "Fenris", "Brynhild", "Ragnar", "Solveig", "Bjorn", "Ylva"
];

const SURNAMES = [
  "Ironhand", "Stonebreaker", "Oakfell", "Deepmine", "Ashford",
  "Blackthorn", "Goldvein", "Silveraxe", "Copperhill", "Mossbeard",
  "Coaldigger", "Timberfall", "Quarryheart", "Pinecrest", "Boulderback",
  "Forgehammer", "Rustpick", "Stonecutter", "Woodsplitter", "Embervein"
];

function generateWorkerName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  return `${first} ${last}`;
}

// ─── Rarity Roll & Stats ────────────────────────────────────

function rollRarity(): WorkerRarity {
  const roll = Math.random();
  if (roll < 0.08) return 'legendary';  // 8%
  if (roll < 0.30) return 'rare';       // 22%
  return 'common';                       // 70%
}

function generateInitialStats(rarity: WorkerRarity): {
  efficiency: number;
  speed: number;
  xpToNextLevel: number;
} {
  const lerp = (min: number, max: number) => min + Math.random() * (max - min);

  switch (rarity) {
    case 'legendary':
      return {
        efficiency: parseFloat(lerp(1.9, 2.5).toFixed(2)),
        speed: 7000,
        xpToNextLevel: 100,
      };
    case 'rare':
      return {
        efficiency: parseFloat(lerp(1.3, 1.8).toFixed(2)),
        speed: 8500,
        xpToNextLevel: 100,
      };
    case 'common':
    default:
      return {
        efficiency: parseFloat(lerp(1.0, 1.2).toFixed(2)),
        speed: 10000,
        xpToNextLevel: 100,
      };
  }
}

// ─── Persistence Helper ─────────────────────────────────────

function persistWorkers(workers: WorkerData[]) {
  localStorage.setItem('kingdoms_workers', JSON.stringify(workers));
}

// ─── Store ──────────────────────────────────────────────────

export const useWorkerStore = create<WorkerState>((set) => ({
  isOpen: false,
  workers: [],
  
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleWorkers: () => set((state) => ({ isOpen: !state.isOpen })),
  
  hireWorker: (type) => set((state) => {
    const rarity = rollRarity();
    const stats = generateInitialStats(rarity);

    const newWorker: WorkerData = {
      id: Math.random().toString(36).substr(2, 9),
      name: generateWorkerName(),
      type,
      assignedPlotId: null,
      assignedMapId: 'HUB_VILA_CENTRAL',
      status: 'sleeping',
      level: 1,
      xp: 0,
      xpToNextLevel: stats.xpToNextLevel,
      efficiency: stats.efficiency,
      speed: stats.speed,
      rarity,
    };

    const newWorkers = [...state.workers, newWorker];
    persistWorkers(newWorkers);

    // Supabase save (legacy table, fire-and-forget)
    const charId = getLocalCharacterId();
    if (charId && isSupabaseConfigured) {
      supabase.from('workers').insert([{
        id: newWorker.id,
        owner_id: charId,
        name: newWorker.name,
        type: newWorker.type,
        status: newWorker.status,
        salary: 1
      }]).then();
    }

    return { workers: newWorkers };
  }),

  assignWorker: (workerId, plotId) => set((state) => {
    useQuestStore.getState().progressQuest('hire_worker', 1);
    const newWorkers: WorkerData[] = state.workers.map(w => 
      w.id === workerId 
        ? { ...w, assignedPlotId: plotId, status: 'working' as const } 
        : w
    );
    persistWorkers(newWorkers);

    // Supabase save
    const charId = getLocalCharacterId();
    if (charId && isSupabaseConfigured) {
      supabase.from('workers').update({ assigned_plot_id: plotId, status: 'working' }).eq('id', workerId).then();
    }

    return { workers: newWorkers };
  }),

  updateWorkerStatus: (workerId, status) => set((state) => {
    const newWorkers = state.workers.map(w => 
      w.id === workerId ? { ...w, status } : w
    );
    persistWorkers(newWorkers);

    // Supabase save
    const charId = getLocalCharacterId();
    if (charId && isSupabaseConfigured) {
      supabase.from('workers').update({ status }).eq('id', workerId).then();
    }

    return { workers: newWorkers };
  }),

  setWorkerRebelling: (workerId, isRebelling) => set((state) => {
    const newWorkers = state.workers.map(w => 
      w.id === workerId ? { ...w, isRebelling } : w
    );
    persistWorkers(newWorkers);

    return { workers: newWorkers };
  }),

  dispatchWorkers: (type, count, mapId) => set((state) => {
    let toDispatch = count;
    const newWorkers = state.workers.map(w => {
      if (toDispatch > 0 && w.type === type && w.assignedMapId === 'HUB_VILA_CENTRAL' && !w.isRebelling) {
        toDispatch--;
        return { ...w, assignedMapId: mapId, status: 'working' as const };
      }
      return w;
    });
    persistWorkers(newWorkers);
    return { workers: newWorkers };
  }),

  recallWorkers: (type, count, mapId) => set((state) => {
    let toRecall = count;
    const newWorkers = state.workers.map(w => {
      if (toRecall > 0 && w.type === type && w.assignedMapId === mapId && !w.isRebelling) {
        toRecall--;
        // Retorna pro HUB dormindo, precisa re-alocar
        return { ...w, assignedMapId: 'HUB_VILA_CENTRAL', status: 'sleeping' as const, assignedPlotId: null };
      }
      return w;
    });
    persistWorkers(newWorkers);
    return { workers: newWorkers };
  }),

  // ─── Worker XP & Level Up ──────────────────────────────────
  gainWorkerXp: (workerId, amount) => set((state) => {
    const newWorkers = state.workers.map(w => {
      if (w.id !== workerId) return w;

      // XP multiplier by rarity
      const rarityMultiplier = w.rarity === 'legendary' ? 1.6 : w.rarity === 'rare' ? 1.3 : 1.0;
      let nextXp = w.xp + (amount * rarityMultiplier);
      let nextLevel = w.level;
      let nextXpToNext = w.xpToNextLevel;
      let nextEfficiency = w.efficiency;
      let nextSpeed = w.speed;

      // Level up loop
      while (nextXp >= nextXpToNext) {
        nextXp -= nextXpToNext;
        nextLevel += 1;
        nextXpToNext = Math.floor(nextXpToNext * 1.35); // Exponential growth
        nextEfficiency = parseFloat((nextEfficiency + 0.05).toFixed(2)); // +0.05 per level
        nextSpeed = Math.max(4000, Math.floor(nextSpeed * 0.98)); // -2% per level, min 4000ms
      }

      return {
        ...w,
        xp: nextXp,
        level: nextLevel,
        xpToNextLevel: nextXpToNext,
        efficiency: nextEfficiency,
        speed: nextSpeed,
      };
    });

    persistWorkers(newWorkers);
    return { workers: newWorkers };
  }),
}));
