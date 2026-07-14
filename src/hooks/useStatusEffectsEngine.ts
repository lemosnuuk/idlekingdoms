import { useEffect } from "react";
import { useGameStore, StatusEffect } from "@/stores/gameStore";

export function useStatusEffectsEngine() {
  useEffect(() => {
    // 1 Tick = 200ms
    const interval = setInterval(() => {
      const game = useGameStore.getState();
      
      if (game.isDead) return;

      const player = game.characterPosition;
      
      // 1. Process Active Status Effects
      let newEffects: StatusEffect[] = [];
      let hpChange = 0;
      let textsToSpawn: { text: string; type: 'poison' | 'heal' }[] = [];

      for (const effect of game.statusEffects) {
        let remaining = effect.remainingTicks - 1;

        // Effect triggers every 5 ticks (1 second)
        if (remaining % 5 === 0 && remaining > 0) {
          if (effect.type === 'POISON') {
            hpChange -= effect.magnitude;
            textsToSpawn.push({ text: `-${effect.magnitude}`, type: 'poison' });
          } else if (effect.type === 'REGENERATION') {
            hpChange += effect.magnitude;
            textsToSpawn.push({ text: `+${effect.magnitude}`, type: 'heal' });
          }
        }

        if (remaining > 0) {
          // Re-add to new array, unless it was darkness and we moved out of cave
          // Wait, DARKNESS is passive, we will handle its addition/removal outside this array loop or just rely on inventory check below
          newEffects.push({ ...effect, remainingTicks: remaining });
        }
      }

      // 2. Passive Biome Effects (DARKNESS)
      const hasTorch = game.inventory.some(i => i.equipped && i.id === 'torch');
      const inCave = game.currentFloor === -1;

      if (inCave && !hasTorch) {
        if (!newEffects.some(e => e.type === 'DARKNESS')) {
          newEffects.push({
            id: `DARKNESS-${Date.now()}`,
            name: 'Escuridão Profunda',
            type: 'DARKNESS',
            magnitude: 0.2, // 20% debuff
            durationTicks: 99999, // Infinite while in condition
            remainingTicks: 99999
          });
        }
      } else {
        // Remove darkness if we have torch or left cave
        newEffects = newEffects.filter(e => e.type !== 'DARKNESS');
      }

      // Apply State Changes
      if (hpChange !== 0 || newEffects.length !== game.statusEffects.length) {
        let nextHp = game.hp;
        if (hpChange > 0) {
          nextHp = Math.min(game.maxHp, game.hp + hpChange);
        } else if (hpChange < 0) {
          nextHp = Math.max(0, game.hp + hpChange);
        }

        // We avoid calling game.setHp if there is no hpChange to prevent unnecessary saves
        if (hpChange !== 0) {
           game.setHp(nextHp);
        }

        game.setStatusEffects(newEffects);

        // Spawn Floating Texts safely after state change
        for (const t of textsToSpawn) {
          game.addFloatingText(t.text, player.x, player.y, t.type);
        }
      } else if (newEffects.some((e, i) => e.remainingTicks !== game.statusEffects[i]?.remainingTicks)) {
        // Just ticking down durations silently
        game.setStatusEffects(newEffects);
      }

    }, 200);

    return () => clearInterval(interval);
  }, []);
}
