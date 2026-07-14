import { create } from 'zustand';
import { useGameStore } from './gameStore';
import { useMarketStore } from './marketStore';
import { useCombatStore, MonsterData } from './combatStore';

export interface WorldEvent {
  bossId: string;
  bossName: string;
  mapId: string;
  isActive: boolean;
  isShieldPhase: boolean;
}

interface WorldBossState {
  worldEvent: WorldEvent | null;
  triggerInvasion: () => void;
  setShieldPhase: (active: boolean) => void;
  clearEvent: () => void;
}

export const useWorldBossStore = create<WorldBossState>((set, get) => ({
  worldEvent: null,

  triggerInvasion: () => {
    // Evita duplicidade se já houver um evento
    if (get().worldEvent?.isActive) return;

    const bossId = `gorgoroth_${Date.now()}`;
    const bossName = "Gorgoroth o Devorador";
    const mapId = "DESERT_INSTANCE";
    
    // Configura o Monstro
    const bossData: MonsterData = {
      id: bossId,
      name: bossName,
      type: 'orc', // Base Type
      level: 50,
      hp: 10000,
      maxHp: 10000,
      attack: 300,
      defense: 50,
      x: 1000,
      y: 1000,
      spawnX: 1000,
      spawnY: 1000,
      isDead: false,
      floor: 0,
      status: 'idle',
      isWorldBoss: true,
      shieldActive: false
    };

    // Injera diretamente no combate do mapa alvo
    useCombatStore.getState().addMonsterToMap(mapId, bossData);
    
    // Mostra HUD Global
    useMarketStore.setState({ eventNotification: `🚨 ALERTA: ANCIÃO DESPERTOU NO DESERTO!` });
    
    // Limpa o banner após 15 segundos
    setTimeout(() => {
      useMarketStore.getState().clearNotification();
    }, 15000);

    set({
      worldEvent: {
        bossId,
        bossName,
        mapId,
        isActive: true,
        isShieldPhase: false
      }
    });
  },

  setShieldPhase: (active) => set((state) => ({
    worldEvent: state.worldEvent ? { ...state.worldEvent, isShieldPhase: active } : null
  })),

  clearEvent: () => set({ worldEvent: null })
}));
