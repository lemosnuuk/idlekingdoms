import { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';

export const useEconomyEngine = () => {
  useEffect(() => {
    // Roda a cada 10 segundos
    const economyInterval = setInterval(() => {
      const level = useGameStore.getState().level;
      if (level >= 3) {
        useGameStore.getState().tickEconomy();
      }
    }, 15000);

    return () => clearInterval(economyInterval);
  }, []);
};
