import { useEffect, useRef } from 'react';
import { useGameStore as useLegacyGameStore } from '@/stores/gameStore';
import { useInventoryStore } from '@/stores/inventoryStore';

const FISHING_INTERVAL_MS = 8000;
const FISHING_SPOTS = [
  { x: 3000, y: 2200 },
  { x: 1700, y: 3000 },
  { x: 1200, y: 3600 }
];

export function useIdleFishingEngine() {
  const isFishing = useLegacyGameStore(state => state.isFishing);
  const position = useLegacyGameStore(state => state.characterPosition);
  const addFloatingText = useLegacyGameStore(state => state.addFloatingText);

  // Use refs to avoid triggering effect resets on coordinate changes
  const posRef = useRef(position);
  useEffect(() => {
    posRef.current = position;
  }, [position]);

  useEffect(() => {
    if (!isFishing) return;

    const intervalId = setInterval(() => {
      const pos = posRef.current;
      
      // Verify if player is still near a fishing spot
      const isNearSpot = FISHING_SPOTS.some(spot => {
        const dx = spot.x - pos.x;
        const dy = spot.y - pos.y;
        return Math.sqrt(dx * dx + dy * dy) <= 60;
      });

      if (!isNearSpot) {
        useLegacyGameStore.getState().setIsFishing(false);
        addFloatingText("🛑 Muito longe da água!", pos.x, pos.y, 'harvest');
        return;
      }

      // 40% chance of catch
      if (Math.random() < 0.4) {
        const r = Math.random();
        const catchType = r < 0.33 ? 'raw_fish' : (r < 0.66 ? 'lobo_do_mar_pequeno' : 'runa_alagada');
        
        // Add to inventory
        useInventoryStore.getState().addItem(catchType, 1);
        
        // Visual feedback
        if (catchType === 'raw_fish') {
          addFloatingText("🐟 +1 Peixe Cru", pos.x, pos.y - 30, 'harvest');
        } else if (catchType === 'lobo_do_mar_pequeno') {
          addFloatingText("🐟 +1 Lobo do Mar Pequeno", pos.x, pos.y - 30, 'harvest');
        } else {
          addFloatingText("💧 +1 Runa Alagada", pos.x, pos.y - 30, 'level_up');
        }
      } else {
        // Just bubble visual
        addFloatingText("🫧 ...", pos.x, pos.y - 30, 'player_damage');
      }

    }, FISHING_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isFishing, addFloatingText]);
}
