import { useEffect, useRef } from "react";
import { useGameStore } from "@/stores/gameStore";
import { useCombatStore, MonsterData } from "@/stores/combatStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { LootTableDirector } from "@/engine/LootTableDirector";

export function useCombatEngine() {
  const lastPlayerAttack = useRef<number>(0);
  const lastMonsterAttack = useRef<number>(0);

  useEffect(() => {
    // Motor assíncrono para rodar a cada 200ms
    const interval = setInterval(() => {
      const game = useGameStore.getState();
      const combat = useCombatStore.getState();
      const inventory = useInventoryStore.getState();

      if (game.isDead) return;

      const player = game.characterPosition;
      
      let nearestMonster: MonsterData | null = null;
      let minDistance = Infinity;

      const mapId = game.currentMapId;
      const currentMonsters = combat.monstersByMap[mapId] || [];

      // 1. IA DE AGRO E MOVIMENTO
      for (const monster of currentMonsters) {
        if (monster.isDead) continue;

        // Ignorar monstros em outros andares
        if (monster.floor !== game.currentFloor) continue;

        const dist = Math.hypot(monster.x - player.x, monster.y - player.y);

        // Disengage if too far or different floor
        if (dist > 300) {
          if (monster.status === 'agro') {
            combat.setMonsterStatus(monster.id, 'idle');
            if (combat.activeMonsterId === monster.id) {
              combat.disengage();
            }
          }
          continue;
        }

        // Encontrar o monstro mais próximo para prioridade
        if (dist < minDistance) {
          minDistance = dist;
          nearestMonster = monster;
        }

        // Safe Zone Check for HUB (Radius 700)
        let isInSafeZone = false;
        if (mapId === 'HUB_VILA_CENTRAL' && monster.floor === 0) {
          const distToCenter = Math.hypot(monster.x - 2500, monster.y - 2500);
          if (distToCenter <= 700) {
            isInSafeZone = true;
          }
        }

        if (isInSafeZone) {
           if (monster.status === 'agro') {
             combat.setMonsterStatus(monster.id, 'idle');
             if (combat.activeMonsterId === monster.id) {
               combat.disengage();
             }
           }
           // Move back slightly or just stand idle
           continue;
        }

        // Lógica de Perseguição
        if (dist <= 250 && dist > 32) {
          if (monster.status !== 'agro') combat.setMonsterStatus(monster.id, 'agro');
          
          // Mover em direção ao jogador (step de 10px por tick)
          const angle = Math.atan2(player.y - monster.y, player.x - monster.x);
          const stepX = Math.cos(angle) * 10;
          const stepY = Math.sin(angle) * 10;
          
          combat.updateMonsterPosition(monster.id, monster.x + stepX, monster.y + stepY);
        }
      }

      // 2. ENGAGE COMBAT
      if (nearestMonster && minDistance <= 32) {
        if (combat.activeMonsterId !== nearestMonster.id) {
          combat.engageMonster(nearestMonster.id);
        }
      }

      // 3. MATEMÁTICA DE COMBATE (TICKS)
      if (combat.activeMonsterId) {
        const activeMonster = currentMonsters.find(m => m.id === combat.activeMonsterId);
        
        if (activeMonster && !activeMonster.isDead && minDistance <= 32 && activeMonster.floor === game.currentFloor) {
          const now = Date.now();

          // A. MONSTER ATTACK (Base de 2.0s)
          if (now - lastMonsterAttack.current >= 2000) {
            lastMonsterAttack.current = now;
            
            // Fórmulas
            const shieldItem = game.inventory.find(i => i.equipped && i.type === 'shield');
            const shieldDef = shieldItem?.defense || 0;
            const shieldingLvl = game.skills.shielding.level;
            const mitigation = Math.floor(shieldDef * (shieldingLvl / 10)); // Formula basica
            
            let finalMitigation = mitigation;
            if (activeMonster.isWorldBoss) {
              finalMitigation = Math.floor(finalMitigation * 0.7); // Fura 30% da armadura
            }
            
            let finalDamage = Math.max(0, activeMonster.attack - finalMitigation);
            
            if (activeMonster.isMiniBoss) {
              finalDamage = Math.floor(finalDamage * 1.05); // 5% crit multiplier
            }
            
            // Player XP de block
            if (mitigation > 0) {
              game.gainSkillXp('shielding', 1);
            }

            game.setHp(game.hp - finalDamage);
            game.addFloatingText(`-${finalDamage}`, player.x, player.y, 'player_damage');
          }

          // B. PLAYER ATTACK (Tick da arma equipada ou base de 2.0s)
          const weaponItem = game.inventory.find(i => i.equipped && i.type === 'weapon');
          let weaponTick = (weaponItem?.attackTickModifier || 2.0) * 1000;
          
          if (game.statusEffects.some(e => e.type === 'HASTE')) {
            weaponTick = weaponTick * 0.8; // 20% faster
          }
          
          if (now - lastPlayerAttack.current >= weaponTick) {
            lastPlayerAttack.current = now;

            // Fórmulas de dano do jogador
            let weaponDmg = weaponItem?.damage || game.attack;
            let skillLvl = game.skills.swordFighting.level; // assumindo melee basico por default
            
            // Simples mapping para paladin (spear) vs sword vs axe
            if (game.vocation === 'Paladin' && weaponItem?.id.includes('spear')) {
               skillLvl = game.skills.distanceFighting.level;
            } else if (weaponItem?.id.includes('axe')) {
               skillLvl = game.skills.axeFighting.level;
            }
            
            let playerFinalDamage = Math.floor(weaponDmg * (skillLvl / 10));
            
            // Aplicar debuff de Escuridão
            if (game.statusEffects.some(e => e.type === 'DARKNESS')) {
              playerFinalDamage = Math.floor(playerFinalDamage * 0.8);
            }
            
            // World Boss Lógica de Escudo
            if (activeMonster.isWorldBoss) {
               const { useWorldBossStore } = require('@/stores/worldBossStore');
               const worldBossState = useWorldBossStore.getState();
               
               // Ativa o escudo se chegou a 50% HP
               if (!worldBossState.worldEvent?.isShieldPhase && activeMonster.hp <= (activeMonster.maxHp * 0.5)) {
                 worldBossState.setShieldPhase(true);
                 game.addFloatingText("🛡️ BARREIRA ELEMENTAL ATIVADA!", activeMonster.x, activeMonster.y - 30, 'legendary_loot');
               }
               
               // Imunidade a dano físico
               if (worldBossState.worldEvent?.isShieldPhase) {
                 const isMagicWeapon = weaponItem?.id.includes('wand') || weaponItem?.id.includes('staff');
                 if (!isMagicWeapon) {
                   playerFinalDamage = 0;
                   game.addFloatingText("🛡️ IMUNE A FÍSICO", activeMonster.x, activeMonster.y, 'enemy_damage');
                 }
               }
            }
            
            // Aplicar Dano ao Monstro
            const nextHp = Math.max(0, activeMonster.hp - playerFinalDamage);
            combat.updateMonsterHp(activeMonster.id, nextHp);
            if (playerFinalDamage > 0) {
              game.addFloatingText(`-${playerFinalDamage}`, activeMonster.x, activeMonster.y, 'enemy_damage');
            }

              // C. AUTO-LOOT E MORTE DO MONSTRO
              if (nextHp <= 0) {
                combat.markMonsterDead(activeMonster.id);
                combat.disengage();
                
                // Ouro garantido
                let goldGain = Math.floor(Math.random() * (activeMonster.level * 5)) + 2;
                if (activeMonster.isMiniBoss) {
                  goldGain *= 3; // Ouro generoso
                }
                inventory.addGold(goldGain);
                
                let lootStr = `${goldGain}g`;
                
                // Procedural Drops via LootTableDirector
                const drops = LootTableDirector.generateLoot(activeMonster, game.currentMapId, game.currentFloor);
                
                let hasRareDrop = false;
                for (const drop of drops) {
                  inventory.addItem(drop.itemId, drop.quantity);
                  lootStr += ` + ${drop.quantity} ${drop.itemId.toUpperCase().replace('_', ' ')}`;
                  if (drop.rarity === 'rare' || drop.rarity === 'epic') {
                    hasRareDrop = true;
                  }
                }

                // If it has rare drop, ping with golden color (exp usually is cyan, we can just use a golden text style if floating engine supports it, or use standard exp)
                if (hasRareDrop || activeMonster.isMiniBoss) {
                  game.addFloatingText(`✨ LENDÁRIO: ${lootStr}`, activeMonster.x, activeMonster.y - 30, 'legendary_loot');
                } else {
                  game.addFloatingText(`💰 Loot: ${lootStr}`, activeMonster.x, activeMonster.y - 20, 'exp');
                }
                
                if (activeMonster.isMiniBoss && activeMonster.contractId) {
                  const rareItem = activeMonster.contractId === 'lobo_alfa' ? 'pele_de_lobo_rara' : 'medalhao_orc_sangrento';
                  inventory.addItem(rareItem, 1);
                  game.addFloatingText(`📜 CONTRATO CONCLUÍDO!`, activeMonster.x, activeMonster.y - 50, 'level_up');
                  
                  // Complete contract safely inside the interval without causing dependency cycles
                  const { useBountyStore } = require('@/stores/bountyStore');
                  useBountyStore.getState().completeContract(activeMonster.contractId);
                }
                
                if (activeMonster.isWorldBoss) {
                  const { useWorldBossStore } = require('@/stores/worldBossStore');
                  useWorldBossStore.getState().clearEvent();
                  
                  inventory.addItem('obsidian_scroll', 1);
                  inventory.addItem('crown_jewel', 1);
                  game.addFloatingText("🏆 CHEFE MUNDIAL DERROTADO!", activeMonster.x, activeMonster.y - 50, 'legendary_loot');
                  
                  // Add 500 XP to all skills
                  Object.keys(game.skills).forEach(skill => {
                    game.gainSkillXp(skill as any, 500);
                  });
                }
                
                game.gainExperience(activeMonster.level * 20); // XP Ganha
              }
          }
        }
      }

    }, 200);

    return () => clearInterval(interval);
  }, []);
}
