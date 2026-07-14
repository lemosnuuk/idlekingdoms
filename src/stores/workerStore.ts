import { create } from 'zustand';
import { useQuestStore } from '@/stores/questStore';
import { supabase, getLocalCharacterId, isSupabaseConfigured } from '@/lib/supabaseClient';

export interface WorkerData {
  id: string;
  name: string;
  type: 'lumberjack' | 'miner';
  assignedPlotId: string | null;
  assignedMapId: string;
  status: 'working' | 'sleeping';
  isRebelling?: boolean;
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
}

const NAMES = ["Garrick", "Elara", "Thorne", "Bram", "Lyra", "Kael", "Sylas"];

export const useWorkerStore = create<WorkerState>((set) => ({
  isOpen: false,
  workers: [],
  
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleWorkers: () => set((state) => ({ isOpen: !state.isOpen })),
  
  hireWorker: (type) => set((state) => {
    const newWorker: WorkerData = {
      id: Math.random().toString(36).substr(2, 9),
      name: NAMES[Math.floor(Math.random() * NAMES.length)],
      type,
      assignedPlotId: null,
      assignedMapId: 'HUB_VILA_CENTRAL',
      status: 'sleeping'
    };
    const newWorkers = [...state.workers, newWorker];

    // LocalStorage fallback
    localStorage.setItem('kingdoms_workers', JSON.stringify(newWorkers));

    // Supabase save
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

    // LocalStorage fallback
    localStorage.setItem('kingdoms_workers', JSON.stringify(newWorkers));

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

    // LocalStorage fallback
    localStorage.setItem('kingdoms_workers', JSON.stringify(newWorkers));

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

    // LocalStorage fallback
    localStorage.setItem('kingdoms_workers', JSON.stringify(newWorkers));

    // Supabase save
    const charId = getLocalCharacterId();
    if (charId && isSupabaseConfigured) {
      // Assuming we can save this metadata in Supabase if we have a column, else we ignore or do JSON.
      // For now, fire-and-forget
    }

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
    localStorage.setItem('kingdoms_workers', JSON.stringify(newWorkers));
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
    localStorage.setItem('kingdoms_workers', JSON.stringify(newWorkers));
    return { workers: newWorkers };
  })
}));
