"use client";

import { useCombatStore, MonsterData } from "@/stores/combatStore";
import { useGameStore } from "@/stores/gameStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { X, Swords, Shield, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

export default function CombatPanel() {
  const { isOpen, toggleCombatPanel, activeMonsterId, logs, addLog, updateMonsterHp, markMonsterDead, disengage } = useCombatStore();
  const { currentMapId, hp, maxHp, attack, defense, setHp, mana, maxMana, setMana } = useGameStore();
  const { addItem } = useInventoryStore();
  
  const monsters = useCombatStore(state => state.monstersByMap[currentMapId]) || [];
  const logsEndRef = useRef<HTMLDivElement>(null);
  const activeMonster = monsters.find(m => m.id === activeMonsterId);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Auto-battler loop using a master interval ticking every 100ms
  useEffect(() => {
    if (!activeMonster || activeMonster.isDead) return;

    let elapsedPlayer = 0;
    let elapsedMonster = 0;
    let mageFireRuneTicks = 0;

    const masterInterval = setInterval(() => {
      const game = useGameStore.getState();
      const combat = useCombatStore.getState();
      const currentMap = game.currentMapId;
      const latestMonster = combat.monstersByMap[currentMap]?.find(m => m.id === activeMonster.id);

      if (!latestMonster || latestMonster.isDead || latestMonster.hp <= 0) {
        clearInterval(masterInterval);
        return;
      }

      // 1. ESCAPE RANGE CHECK: Disengage if distance > 300px or different floor
      const dist = Math.hypot(
        game.characterPosition.x - latestMonster.x, 
        game.characterPosition.y - latestMonster.y
      );
      const differentFloor = game.currentFloor !== latestMonster.floor;

      if (dist > 300 || differentFloor) {
        disengage();
        addLog(`Você escapou do combate com ${latestMonster.name}!`, 'system');
        clearInterval(masterInterval);
        return;
      }

      // 2. GAMBIT SYSTEM: Use Potion automatically if HP < custom threshold
      const hpPercent = game.hp / game.maxHp;
      if (hpPercent < game.gambitPotionThreshold) {
        const inventory = useInventoryStore.getState();
        const potionIndex = inventory.items.findIndex(item => item.itemId === 'health_potion' || item.itemId === 'Potion');
        if (potionIndex !== -1) {
          const potion = inventory.items[potionIndex];
          // Consume 1 potion
          inventory.addItem(potion.itemId, -1);
          // Heal 50 HP (capped at max HP)
          const nextHp = Math.min(game.maxHp, game.hp + 50);
          game.setHp(nextHp);
          // Feedback
          game.addFloatingText("+50 HP", game.characterPosition.x, game.characterPosition.y - 60, 'harvest');
          addLog("Gambit: Poção de Vida usada automaticamente! +50 HP", 'system');
        }
      }

      // 3. GAMBIT SYSTEM: Cast Exori Spell when Mana is full (100) and enabled
      if (game.gambitExoriEnabled && game.mana >= 100) {
        game.setMana(0);
        const swordLvl = game.skills.swordFighting.level;
        const weaponAtk = game.equippedWeapon === 'iron_sword' ? 8 : game.equippedWeapon === 'heavy_axe' ? 15 : 0;
        const scaledAttack = Math.floor((game.attack + weaponAtk) * (1 + (swordLvl - 10) * 0.05));
        const spellDamage = Math.max(2, (scaledAttack * 2) - latestMonster.defense);
        
        const nextMonsterHp = Math.max(0, latestMonster.hp - spellDamage);
        updateMonsterHp(latestMonster.id, nextMonsterHp);
        
        game.addFloatingText(`🔥 EXORI! -${spellDamage}`, latestMonster.x, latestMonster.y - 40, 'player_damage');
        addLog(`Você conjurou EXORI! Causou ${spellDamage} de dano!`, 'player');
        game.triggerShake();

        if (nextMonsterHp <= 0) {
          handleMonsterDefeated(latestMonster);
          clearInterval(masterInterval);
          return;
        }
      }

      // 4. PLAYER ATTACK TICK
      // Cooldown: based on weapon base, reduced by 15ms per level above 10, capped at 600ms
      const swordLvl = game.skills.swordFighting.level;
      const baseCooldown = game.equippedWeapon === 'iron_sword' ? 1100 : game.equippedWeapon === 'heavy_axe' ? 2000 : 1500;
      const playerCooldown = Math.max(600, baseCooldown - (swordLvl - 10) * 15);
      elapsedPlayer += 100;

      if (elapsedPlayer >= playerCooldown) {
        elapsedPlayer = 0;
        
        let damageToMonster = 0;
        let isMagicAttack = false;

        // Vocation Logic
        if (game.vocation === 'Paladin') {
          const inventory = useInventoryStore.getState();
          if (inventory.getQuantity('spear') < 1) {
            addLog(`❌ Sem munição! (Lanças)`, 'system');
            disengage();
            clearInterval(masterInterval);
            return;
          }
          inventory.removeItem('spear', 1);
          game.gainSkillXp('distanceFighting', 1);
          const distLvl = game.skills.distanceFighting.level;
          const spearAtk = 10;
          const scaledAttack = Math.floor((game.attack + spearAtk) * (1 + (distLvl - 10) * 0.04));
          damageToMonster = Math.max(1, scaledAttack - latestMonster.defense);

        } else if (game.vocation === 'Mage') {
          mageFireRuneTicks++;
          const inventory = useInventoryStore.getState();
          
          if (game.gambitMageHealingEnabled && game.hp < (game.maxHp * 0.5) && inventory.getQuantity('healing_rune') >= 1) {
            inventory.removeItem('healing_rune', 1);
            const heal = 100;
            game.setHp(Math.min(game.maxHp, game.hp + heal));
            game.addFloatingText(`+${heal} HP`, game.characterPosition.x, game.characterPosition.y - 60, 'harvest');
            addLog(`Runa de Cura usada! +${heal} HP`, 'system');
          }

          if (game.gambitMageFireEnabled && mageFireRuneTicks >= 4 && inventory.getQuantity('fire_rune') >= 1) {
            mageFireRuneTicks = 0;
            inventory.removeItem('fire_rune', 1);
            isMagicAttack = true;
            game.gainSkillXp('magicLevel', 1);
            const magicLvl = game.skills.magicLevel.level;
            damageToMonster = Math.floor(game.attack + (magicLvl * 3));
            addLog(`Você conjurou uma Runa de Fogo!`, 'player');
            game.addFloatingText(`🔥 -${damageToMonster}`, latestMonster.x, latestMonster.y - 20, 'player_damage');
          } else {
            // normal mage attack (weak)
            game.gainSkillXp('swordFighting', 1);
            const weaponAtk = game.equippedWeapon === 'iron_sword' ? 8 : game.equippedWeapon === 'heavy_axe' ? 15 : 0;
            const scaledAttack = Math.floor((game.attack + weaponAtk) * (1 + (game.skills.swordFighting.level - 10) * 0.03));
            damageToMonster = Math.max(1, scaledAttack - latestMonster.defense);
          }

        } else {
          // Knight or None
          game.gainSkillXp('swordFighting', 1);
          const weaponAtk = game.equippedWeapon === 'iron_sword' ? 8 : game.equippedWeapon === 'heavy_axe' ? 15 : 0;
          const swordLvl = game.skills.swordFighting.level; 
          const scaledAttack = Math.floor((game.attack + weaponAtk) * (1 + (swordLvl - 10) * 0.03));
          damageToMonster = Math.max(1, scaledAttack - latestMonster.defense);
          
          // Knight Cleave
          if (game.vocation === 'Knight' && Math.random() < 0.20) {
            // find another agro monster nearby
            const currentMonsters = combat.monstersByMap[currentMap] || [];
            const otherMonster = currentMonsters.find(m => m.id !== latestMonster.id && !m.isDead && m.status === 'agro' && m.floor === latestMonster.floor && Math.hypot(game.characterPosition.x - m.x, game.characterPosition.y - m.y) < 200);
            if (otherMonster) {
              const cleaveDmg = Math.floor(damageToMonster * 0.3);
              if (cleaveDmg > 0) {
                updateMonsterHp(otherMonster.id, Math.max(0, otherMonster.hp - cleaveDmg));
                game.addFloatingText(`⚔️ Cleave! -${cleaveDmg}`, otherMonster.x, otherMonster.y - 20, 'player_damage');
                addLog(`Knight Cleave atingiu ${otherMonster.name} por ${cleaveDmg}!`, 'player');
              }
            }
          }
        }

        const nextMonsterHp = Math.max(0, latestMonster.hp - damageToMonster);
        updateMonsterHp(latestMonster.id, nextMonsterHp);
        
        if (!isMagicAttack) {
          game.addFloatingText(`-${damageToMonster}`, latestMonster.x, latestMonster.y - 20, 'player_damage');
          addLog(`Você causou ${damageToMonster} de dano!`, 'player');
        }
        game.triggerShake();

        if (nextMonsterHp <= 0) {
          handleMonsterDefeated(latestMonster);
          clearInterval(masterInterval);
          return;
        }
      }

      // 5. MONSTER ATTACK TICK
      // Cooldown: 2000ms
      elapsedMonster += 100;

      if (elapsedMonster >= 2000) {
        elapsedMonster = 0;

        game.gainSkillXp('shielding', 1);
        const shieldLvl = game.skills.shielding.level;
        // Shielding reduces incoming damage: 2% reduction per level above 10, up to 60% max
        const shieldReduct = Math.min(0.60, (shieldLvl - 10) * 0.02);
        
        // Subtract equipped shield defense from monster attack first
        const shieldDef = game.equippedShield === 'wooden_shield' ? 3 : game.equippedShield === 'iron_shield' ? 12 : 0;
        const monsterAttack = latestMonster.attack;
        const reducedAtk = Math.max(0, monsterAttack - shieldDef);
        let damageToPlayer = Math.max(1, Math.floor(reducedAtk * (1 - shieldReduct) - game.defense));

        if (game.vocation === 'Knight') {
          damageToPlayer = Math.max(1, damageToPlayer - 2);
        }

        const nextPlayerHp = Math.max(0, game.hp - damageToPlayer);
        game.setHp(nextPlayerHp);

        game.addFloatingText(`-${damageToPlayer}`, game.characterPosition.x, game.characterPosition.y - 20, 'enemy_damage');
        addLog(`${latestMonster.name} causou ${damageToPlayer} de dano!`, 'enemy');

        if (nextPlayerHp <= 0) {
          addLog(`Você foi derrotado! Perdendo XP e habilidades...`, 'system');
          clearInterval(masterInterval);
          setTimeout(() => {
            disengage();
            useGameStore.getState().characterDie();
          }, 800);
          return;
        }
      }

    }, 100);

    return () => clearInterval(masterInterval);
  }, [activeMonsterId]);

  const handleMonsterDefeated = (monster: MonsterData) => {
    markMonsterDead(monster.id);
    addLog(`${monster.name} foi derrotado!`, 'system');
    
    // Auto-Loot Gold
    const goldGained = monster.level * 5;
    useInventoryStore.getState().addGold(goldGained);
    useGameStore.getState().addFloatingText(`+${goldGained} Gold`, useGameStore.getState().characterPosition.x, useGameStore.getState().characterPosition.y - 60, 'harvest');
    
    // Auto-Loot Experience
    const expGained = monster.level * 15;
    useGameStore.getState().gainExperience(expGained);
    
    // Auto-Loot Items: 50% chance of resources
    const inventory = useInventoryStore.getState();
    if (Math.random() < 0.5) {
      const loot = monster.type === 'wolf' ? 'wood' : 'stone';
      if (!inventory.isFull()) {
        inventory.addItem(loot, 1);
        useGameStore.getState().addFloatingText(`+1 ${loot}`, useGameStore.getState().characterPosition.x - 20, useGameStore.getState().characterPosition.y - 40, 'harvest');
        addLog(`Auto-Loot: 1 ${loot} coletado automaticamente!`, 'system');
      } else {
        addLog(`Inventário cheio! Não foi possível coletar 1 ${loot}.`, 'system');
      }
    }

    // Auto-Loot Potion: 40% chance of health potion drop
    if (Math.random() < 0.40) {
      if (!inventory.isFull()) {
        inventory.addItem('health_potion', 1);
        useGameStore.getState().addFloatingText("+1 Poção", useGameStore.getState().characterPosition.x + 20, useGameStore.getState().characterPosition.y - 40, 'harvest');
        addLog("Auto-Loot: 1 Poção de Vida coletada automaticamente!", 'system');
      }
    }

    setTimeout(() => {
      disengage();
    }, 1000);
  };

  return (
    <AnimatePresence>
      {(isOpen || activeMonsterId) && activeMonster && (
        <motion.div 
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 384, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="h-full pointer-events-auto overflow-hidden flex-shrink-0"
        >
          <div className="w-96 h-full bg-gradient-to-b from-[#2a0808]/95 to-[#0b0b0d]/98 border-l border-red-900/30 backdrop-blur-md shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-[#ffffff]/5 bg-black/30">
              <div className="flex items-center gap-3">
                <span className="animate-pulse text-sm">⚔️</span>
                <h2 className="font-serif font-bold text-lg text-red-500 uppercase tracking-widest animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]">
                  Combate Ativo
                </h2>
              </div>
              <button onClick={toggleCombatPanel} className="text-fantasy-text-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 flex-1 flex flex-col gap-6 overflow-y-auto">
              
              {/* Monster Status */}
              <div className="bg-[#0a0a0c] border border-red-900/20 rounded-lg p-4 shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)] relative overflow-hidden">
                <div className="absolute inset-0 bg-red-500/5 animate-pulse pointer-events-none" />
                <div className="flex justify-between items-center text-xs font-serif mb-3 relative z-10">
                  <span className="text-red-400 font-bold uppercase tracking-widest text-sm">{activeMonster.name}</span>
                  <span className="text-slate-400 font-mono text-[10px] bg-black px-2 py-0.5 rounded border border-[#ffffff]/10">Lvl {activeMonster.level}</span>
                </div>
                <div className="w-full h-4 bg-black rounded-full overflow-hidden border border-[#ffffff]/10 relative flex items-center justify-center shadow-[inset_0_1px_3px_rgba(0,0,0,0.9)] z-10">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-900 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] transition-all duration-300" 
                    style={{ width: `${(activeMonster.hp / activeMonster.maxHp) * 100}%` }} 
                  />
                  <span className="relative z-10 text-[10px] font-bold text-white font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                    HP: {Math.max(0, Math.floor(activeMonster.hp))} / {activeMonster.maxHp}
                  </span>
                </div>
              </div>

              {/* Player Status */}
              <div className="bg-[#0a0a0c] border border-[#ffffff]/5 rounded-lg p-4 shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)]">
                <div className="text-[11px] text-fantasy-text-muted font-bold font-serif uppercase tracking-widest mb-4">Seus Status</div>
                
                <div className="space-y-4">
                  {/* HP Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-mono text-fantasy-text-muted">
                      <span>VIDA</span>
                    </div>
                    <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-[#ffffff]/10 relative flex items-center justify-center shadow-[inset_0_1px_3px_rgba(0,0,0,0.9)]">
                      <div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-900 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)] transition-all duration-300" 
                        style={{ width: `${(hp / maxHp) * 100}%` }} 
                      />
                      <span className="relative z-10 text-[9px] font-bold text-white font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                        {Math.floor(hp)} / {maxHp}
                      </span>
                    </div>
                  </div>

                  {/* Mana Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-mono text-fantasy-text-muted">
                      <span>MANA</span>
                    </div>
                    <div className="w-full h-3 bg-black rounded-full overflow-hidden border border-[#ffffff]/10 relative flex items-center justify-center shadow-[inset_0_1px_3px_rgba(0,0,0,0.9)]">
                      <div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-900 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)] transition-all duration-300" 
                        style={{ width: `${(mana / maxMana) * 100}%` }} 
                      />
                      <span className="relative z-10 text-[9px] font-bold text-white font-mono drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                        {Math.floor(mana)} / {maxMana}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Combat Log */}
              <div className="flex-1 bg-[#050505] border border-[#ffffff]/5 rounded-lg p-3 flex flex-col gap-1.5 font-serif overflow-y-auto shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] relative">
                <div className="sticky top-0 bg-[#050505]/90 backdrop-blur pb-2 mb-1 border-b border-[#ffffff]/5 z-10">
                  <span className="text-[10px] text-fantasy-text-muted font-bold uppercase tracking-widest">Diário de Batalha</span>
                </div>
                {logs.slice(-6).map(log => (
                  <div key={log.id} className={`text-[11px] leading-relaxed border-l-2 pl-2 py-0.5 ${
                    log.type === 'player' ? 'text-emerald-400 border-emerald-500/30' : 
                    log.type === 'enemy' ? 'text-red-400 border-red-500/30' : 'text-[#d4af37] border-[#d4af37]/30 font-bold'
                  }`}>
                    {log.message}
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-[11px] text-fantasy-text-muted text-center italic opacity-50 my-auto">
                    Aguardando início do combate...
                  </div>
                )}
                <div ref={logsEndRef} />
              </div>

            </div>

            {/* Footer Action */}
            <div className="p-5 border-t border-[#ffffff]/5 bg-black/40">
              <button 
                onClick={disengage}
                className="w-full py-3 bg-red-950/40 hover:bg-red-900 border border-red-900/50 hover:border-red-500 text-red-400 hover:text-white rounded text-xs font-bold transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              >
                Fugir do Combate
              </button>
            </div>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
