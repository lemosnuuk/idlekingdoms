import { useEffect } from 'react';
import { useWorldBossStore } from '@/stores/worldBossStore';

export function useWorldBossDirector() {
  const triggerInvasion = useWorldBossStore(state => state.triggerInvasion);
  const worldEvent = useWorldBossStore(state => state.worldEvent);

  useEffect(() => {
    // Roda a verificação a cada 1 minuto (reduzido para não pesar, mas a simulação é de 15 minutos)
    const CHECK_INTERVAL = 60000; // 1 minuto real
    // 5% de chance equivale a dizer que a cada 15 min teremos aprox 1 invasão se checarmos a cada 1 min? Não, 5% por tick é estatístico.
    // O requisito: A cada 15 minutos, há 5% de chance.
    // Vamos rodar a cada 15 min (900000ms), com 5% de chance.
    const INVASION_INTERVAL = 900000; // 15 minutos
    
    // Debug only (Para testes fáceis se o usuário precisar alterar)
    // const INVASION_INTERVAL = 10000; // 10 segundos

    const intervalId = setInterval(() => {
      if (!worldEvent?.isActive) {
        const chance = Math.random();
        if (chance <= 0.05) { // 5% chance
          triggerInvasion();
        }
      }
    }, INVASION_INTERVAL);

    return () => clearInterval(intervalId);
  }, [triggerInvasion, worldEvent?.isActive]);

  return null;
}
