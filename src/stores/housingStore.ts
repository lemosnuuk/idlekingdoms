import { create } from 'zustand';
import { supabase, getLocalCharacterId, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useQuestStore } from '@/stores/questStore';
import { isNearRiver, isPointInLake } from '@/utils/mapCollision';

export interface PlotData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isOwned: boolean;
  basePrice: number;
}

export interface BuildingData {
  id: string;
  plotId: string;
  type: 'tent' | 'campfire' | 'cabin' | 'training_dummy';
}

interface HousingState {
  plots: PlotData[];
  buildings: BuildingData[];
  isConstructionMode: boolean;
  selectedPlotId: string | null;
  toggleConstructionMode: () => void;
  buyPlot: (plotId: string) => void;
  openPlotMenu: (plotId: string | null) => void;
  addPlot: (plot: PlotData) => void;
  addBuilding: (building: BuildingData) => void;
  buildStructure: (plotId: string, type: string) => void;
  upgradeBuilding: (buildingId: string, newType: string) => void;
}

export const useHousingStore = create<HousingState>((set, get) => ({
  plots: [
    { id: 'p1', x: 2150, y: 2550, width: 100, height: 100, isOwned: false, basePrice: 50 },
    { id: 'p2', x: 2280, y: 2680, width: 100, height: 100, isOwned: false, basePrice: 100 },
    { id: 'p3', x: 2620, y: 2680, width: 100, height: 100, isOwned: false, basePrice: 150 },
    { id: 'p4', x: 2750, y: 2550, width: 100, height: 100, isOwned: false, basePrice: 200 },
  ],
  buildings: [],
  isConstructionMode: false,
  selectedPlotId: null,

  toggleConstructionMode: () => set((state) => ({ 
    isConstructionMode: !state.isConstructionMode,
    selectedPlotId: null // Close menu if exiting mode
  })),

  openPlotMenu: (plotId) => set({ selectedPlotId: plotId }),

  buyPlot: (plotId) => set((state) => {
    const plot = state.plots.find(p => p.id === plotId);
    if (!plot) return state;

    const charId = getLocalCharacterId();
    if (charId && isSupabaseConfigured) {
      supabase.from('plots').select('id').eq('id', plotId).then(({ data }) => {
        if (data && data.length > 0) {
          supabase.from('plots').update({ owner_id: charId }).eq('id', plotId).then();
        } else {
          supabase.from('plots').insert([{
            id: plotId,
            owner_id: charId,
            x: plot.x,
            y: plot.y,
            width: plot.width,
            height: plot.height,
            base_price: plot.basePrice
          }]).then();
        }
      });
    }

    const newPlots = state.plots.map(p => p.id === plotId ? { ...p, isOwned: true } : p);
    localStorage.setItem('kingdoms_owned_plots', JSON.stringify(newPlots.filter(p => p.isOwned).map(p => p.id)));
    return { plots: newPlots };
  }),

  addPlot: (plot) => set((state) => {
    // Prevent spawning a plot inside water bodies (River/Lake collision mask)
    if (isNearRiver(plot.x, plot.y, 180) || isPointInLake(plot.x, plot.y)) {
      console.warn(`Spawning plot at (${plot.x}, ${plot.y}) blocked: Collides with water body.`);
      return state;
    }
    const newPlots = [...state.plots, plot];
    const charId = getLocalCharacterId();
    if (charId && isSupabaseConfigured) {
      supabase.from('plots').insert([{ id: plot.id, owner_id: charId, x: plot.x, y: plot.y }]).then();
    }
    localStorage.setItem('kingdoms_owned_plots', JSON.stringify(newPlots.filter(p => p.isOwned).map(p => p.id)));
    return { plots: newPlots };
  }),
  addBuilding: (building) => set((state) => {
    const newBuildings = [...state.buildings, building];
    const charId = getLocalCharacterId();
    if (charId && isSupabaseConfigured) {
      supabase.from('buildings').insert([{ id: building.id, plot_id: building.plotId, type: building.type }]).then();
    }
    localStorage.setItem('kingdoms_buildings', JSON.stringify(newBuildings));
    return { buildings: newBuildings };
  }),

  buildStructure: (plotId, type) => {
    // A plot only supports one main building in MVP
    const state = get();
    const hasBuilding = state.buildings.find(b => b.plotId === plotId);
    if (hasBuilding) return;

    if (type === 'tent') {
      useQuestStore.getState().progressQuest('build_tent', 1);
    }

    get().addBuilding({
      id: Math.random().toString(),
      plotId,
      type: type as BuildingData['type']
    });
    set({ selectedPlotId: null });
  },

  upgradeBuilding: (buildingId, newType) => set((state) => {
    const newBuildings = state.buildings.map(b => b.id === buildingId ? { ...b, type: newType as BuildingData['type'] } : b);
    const charId = getLocalCharacterId();
    if (charId && isSupabaseConfigured) {
      supabase.from('buildings').update({ type: newType }).eq('id', buildingId).then();
    }
    localStorage.setItem('kingdoms_buildings', JSON.stringify(newBuildings));
    return { buildings: newBuildings };
  })
}));
