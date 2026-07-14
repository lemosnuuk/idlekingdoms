import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useCombatStore } from '@/stores/combatStore';

const SPELLS = [
  { id: 'exura', name: 'Exura', type: 'healing', mlReq: 10, manaCost: 20, desc: 'Cura Leve' },
  { id: 'exori', name: 'Exori', type: 'attack', mlReq: 15, manaCost: 50, desc: 'Ataque em Área' },
  { id: 'exori_gran', name: 'Exori Gran', type: 'attack', mlReq: 25, manaCost: 100, desc: 'Tremor Crítico' }
];

export const SpellbookPanel: React.FC = () => {
  const game = useGameStore();
  const combat = useCombatStore();
  
  const [cooldown, setCooldown] = useState(0);

  // Tick for global spell cooldown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const magicLevel = game.skills?.magicLevel?.level || 0;

  const castSpell = (spellId: string) => {
    const spell = SPELLS.find(s => s.id === spellId);
    if (!spell) return;

    const currentMapId = useGameStore.getState().currentMapId;
    const monsters = useCombatStore.getState().monstersByMap[currentMapId] || [];

    if (magicLevel < spell.mlReq) return;
    if (game.mana < spell.manaCost) return;
    if (cooldown > 0) return;

    // Consume Mana
    game.setMana(game.mana - spell.manaCost);
    setCooldown(2); // 2s global cooldown

    game.addFloatingText(`"${spell.name}"`, game.characterPosition.x, game.characterPosition.y - 40, 'heal');

    if (spell.id === 'exura') {
      const healAmount = 50 + (magicLevel * 2);
      game.setHp(Math.min(game.maxHp, game.hp + healAmount));
    } 
    else if (spell.id === 'exori') {
      const damage = 30 + (magicLevel * 3);
      monsters.forEach(m => {
        if (!m.isDead && m.status === 'agro') {
          combat.updateMonsterHp(m.id, m.hp - damage);
          if (m.hp - damage <= 0) combat.markMonsterDead(m.id);
        }
      });
      combat.addLog(`Você lançou Exori causando ${damage} de dano em área!`, 'player');
    }
    else if (spell.id === 'exori_gran') {
      const damage = 80 + (magicLevel * 5);
      game.triggerShake();
      monsters.forEach(m => {
        if (!m.isDead && m.status === 'agro') {
          combat.updateMonsterHp(m.id, m.hp - damage);
          if (m.hp - damage <= 0) combat.markMonsterDead(m.id);
        }
      });
      combat.addLog(`Você lançou Exori Gran! Tremor crítico de ${damage} de dano!`, 'player');
    }
  };

  return (
    <div className="bg-[#0f0a14] border border-[#a22bcf]/40 text-gray-200 p-4 rounded shadow-[0_0_8px_rgba(162,43,207,0.15)] mb-4 w-full">
      <h2 className="text-[#d87cff] font-bold text-lg mb-3 flex items-center gap-2 border-b border-[#a22bcf]/20 pb-2 drop-shadow-[0_0_2px_rgba(216,124,255,0.5)]">
        <span className="text-xl">🕮</span> Spellbook
      </h2>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2 text-sm">
          <span>Magic Level: <strong className="text-[#d87cff] drop-shadow-[0_0_2px_rgba(216,124,255,0.5)]">{magicLevel}</strong></span>
          <span>Mana: <strong className="text-blue-400">{game.mana}</strong> / {game.maxMana}</span>
        </div>
        
        <div className="space-y-2">
          {SPELLS.map(spell => {
            const isUnlocked = magicLevel >= spell.mlReq;
            const canCast = isUnlocked && game.mana >= spell.manaCost && cooldown === 0;
            
            return (
              <button
                key={spell.id}
                onClick={() => castSpell(spell.id)}
                disabled={!canCast}
                className={`w-full flex justify-between items-center p-2 rounded transition-all duration-300
                  ${isUnlocked 
                    ? canCast 
                      ? 'border border-[#a22bcf] bg-[#2a133d] hover:bg-[#3d1c5a] hover:shadow-[0_0_10px_rgba(162,43,207,0.3)] cursor-pointer' 
                      : 'border border-[#a22bcf]/20 bg-[#150d1e] opacity-60 cursor-not-allowed'
                    : 'border border-gray-800 bg-black opacity-30 cursor-not-allowed grayscale'
                  }
                `}
              >
                <div className="flex flex-col items-start">
                  <span className={`font-bold ${isUnlocked ? 'text-[#d87cff]' : 'text-gray-500'}`}>
                    {spell.name}
                  </span>
                  <span className="text-[10px] text-gray-400">{spell.desc}</span>
                </div>
                <div className="flex flex-col items-end text-xs">
                  <span className="text-blue-400 font-mono">-{spell.manaCost} MP</span>
                  {!isUnlocked && <span className="text-red-400 text-[10px]">Req ML {spell.mlReq}</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-[#a22bcf]/20">
        <h3 className="text-xs font-bold text-[#d87cff] mb-2 uppercase tracking-wider drop-shadow-[0_0_2px_rgba(216,124,255,0.4)]">
          🛠️ Automação (Mana Dump)
        </h3>
        
        <label className="flex items-center gap-2 mb-2 text-xs cursor-pointer hover:text-[#d87cff] transition-colors">
          <input 
            type="checkbox" 
            checked={game.gambitRuneCraftingEnabled}
            onChange={(e) => game.setGambitRuneCraftingEnabled(e.target.checked)}
            className="accent-[#a22bcf] w-3 h-3 cursor-pointer"
          />
          Craft Automático em 100% Mana
        </label>
        
        {game.gambitRuneCraftingEnabled && (
          <div className="mt-2 flex flex-col gap-1.5">
            <span className="text-[10px] text-gray-400">Runa Alvo:</span>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => game.setGambitRuneType('fire')}
                className={`py-1.5 px-1 text-[10px] border rounded transition-all whitespace-nowrap
                  ${game.gambitRuneType === 'fire' 
                    ? 'border-red-500/50 bg-red-950/40 text-red-300 shadow-[0_0_5px_rgba(239,68,68,0.2)]' 
                    : 'border-gray-800 bg-[#0f0a14] text-gray-500 hover:border-red-900/50'}`}
              >
                Fire Rune
              </button>
              <button
                onClick={() => game.setGambitRuneType('healing')}
                className={`py-1.5 px-1 text-[10px] border rounded transition-all whitespace-nowrap
                  ${game.gambitRuneType === 'healing' 
                    ? 'border-blue-500/50 bg-blue-950/40 text-blue-300 shadow-[0_0_5px_rgba(59,130,246,0.2)]' 
                    : 'border-gray-800 bg-[#0f0a14] text-gray-500 hover:border-blue-900/50'}`}
              >
                Heal Rune
              </button>
              <button
                onClick={() => game.setGambitRuneType('energy_wall')}
                className={`py-1.5 px-1 text-[10px] border rounded transition-all whitespace-nowrap
                  ${game.gambitRuneType === 'energy_wall' 
                    ? 'border-[#a22bcf]/50 bg-[#2a133d]/40 text-[#d87cff] shadow-[0_0_5px_rgba(162,43,207,0.2)]' 
                    : 'border-gray-800 bg-[#0f0a14] text-gray-500 hover:border-[#a22bcf]/50'}`}
              >
                Energy Wall
              </button>
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
};
