import { create } from 'zustand';

// ─── Types ──────────────────────────────────────────────────

export type LandBiome = 'forest' | 'mountain' | 'plains' | 'riverside';

export interface LandPlot {
  id: string;
  name: string;
  x: number;
  y: number;
  cost: number;
  isUnlocked: boolean;
  assignedWorkerId: string | null;
  biome: LandBiome;
}

interface LandState {
  plots: LandPlot[];
  buyPlot: (plotId: string) => boolean;
  assignWorkerToPlot: (plotId: string, workerId: string) => void;
  unassignWorkerFromPlot: (plotId: string) => void;
  setPlots: (plots: LandPlot[]) => void;
}

// ─── Default Land Plots ─────────────────────────────────────

const DEFAULT_LAND_PLOTS: LandPlot[] = [
  {
    id: 'land_1',
    name: 'Clareira do Aprendiz',
    x: 2650, y: 2700,
    cost: 100,
    isUnlocked: false,
    assignedWorkerId: null,
    biome: 'plains',
  },
  {
    id: 'land_2',
    name: 'Floresta Próxima',
    x: 2200, y: 2750,
    cost: 200,
    isUnlocked: false,
    assignedWorkerId: null,
    biome: 'forest',
  },
  {
    id: 'land_3',
    name: 'Encosta Mineral',
    x: 2800, y: 2400,
    cost: 500,
    isUnlocked: false,
    assignedWorkerId: null,
    biome: 'mountain',
  },
  {
    id: 'land_4',
    name: 'Margem do Rio',
    x: 1950, y: 2900,
    cost: 800,
    isUnlocked: false,
    assignedWorkerId: null,
    biome: 'riverside',
  },
  {
    id: 'land_5',
    name: 'Bosque Denso Oeste',
    x: 1400, y: 2600,
    cost: 1500,
    isUnlocked: false,
    assignedWorkerId: null,
    biome: 'forest',
  },
  {
    id: 'land_6',
    name: 'Veio Montanhoso',
    x: 2500, y: 1200,
    cost: 2500,
    isUnlocked: false,
    assignedWorkerId: null,
    biome: 'mountain',
  },
  {
    id: 'land_7',
    name: 'Floresta de Outono',
    x: 3400, y: 2500,
    cost: 3500,
    isUnlocked: false,
    assignedWorkerId: null,
    biome: 'forest',
  },
  {
    id: 'land_8',
    name: 'Mina Profunda Norte',
    x: 3200, y: 1000,
    cost: 5000,
    isUnlocked: false,
    assignedWorkerId: null,
    biome: 'mountain',
  },
];

// ─── Persistence Helper ─────────────────────────────────────

function persistLandPlots(plots: LandPlot[]) {
  localStorage.setItem('kingdoms_land_plots', JSON.stringify(plots));
}

// ─── Store ──────────────────────────────────────────────────

export const useLandStore = create<LandState>((set, get) => ({
  plots: DEFAULT_LAND_PLOTS,

  buyPlot: (plotId) => {
    const state = get();
    const plot = state.plots.find(p => p.id === plotId);
    if (!plot || plot.isUnlocked) return false;

    // Consume gold from inventoryStore (lazy load to avoid circular deps)
    const invStore = require('@/stores/inventoryStore').useInventoryStore.getState();
    if (invStore.gold < plot.cost) return false;

    invStore.removeGold(plot.cost);

    const newPlots = state.plots.map(p =>
      p.id === plotId ? { ...p, isUnlocked: true } : p
    );

    persistLandPlots(newPlots);
    set({ plots: newPlots });
    return true;
  },

  assignWorkerToPlot: (plotId, workerId) => {
    const state = get();
    const plot = state.plots.find(p => p.id === plotId);
    if (!plot || !plot.isUnlocked || plot.assignedWorkerId) return;

    // Update the worker in workerStore
    const workerStore = require('@/stores/workerStore').useWorkerStore.getState();
    const worker = workerStore.workers.find((w: any) => w.id === workerId);
    if (!worker || worker.assignedPlotId) return; // Worker already assigned somewhere

    // Set worker as working on this plot
    workerStore.assignWorker(workerId, plotId);

    // Update land plot
    const newPlots = state.plots.map(p =>
      p.id === plotId ? { ...p, assignedWorkerId: workerId } : p
    );

    persistLandPlots(newPlots);
    set({ plots: newPlots });
  },

  unassignWorkerFromPlot: (plotId) => {
    const state = get();
    const plot = state.plots.find(p => p.id === plotId);
    if (!plot || !plot.assignedWorkerId) return;

    // Free the worker in workerStore
    const workerStore = require('@/stores/workerStore').useWorkerStore.getState();
    const workerId = plot.assignedWorkerId;

    // Reset worker to sleeping with no plot
    const newWorkers = workerStore.workers.map((w: any) =>
      w.id === workerId
        ? { ...w, assignedPlotId: null, status: 'sleeping' as const }
        : w
    );
    workerStore.workers = newWorkers; // Direct mutation avoided — use setState
    require('@/stores/workerStore').useWorkerStore.setState({ workers: newWorkers });
    localStorage.setItem('kingdoms_workers', JSON.stringify(newWorkers));

    // Clear land plot assignment
    const newPlots = state.plots.map(p =>
      p.id === plotId ? { ...p, assignedWorkerId: null } : p
    );

    persistLandPlots(newPlots);
    set({ plots: newPlots });
  },

  setPlots: (plots) => {
    persistLandPlots(plots);
    set({ plots });
  },
}));
