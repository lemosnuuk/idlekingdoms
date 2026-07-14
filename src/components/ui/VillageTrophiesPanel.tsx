import React, { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';

export function VillageTrophiesPanel() {
  const achievements = useGameStore(s => s.achievements);
  const skills = useGameStore(s => s.skills);
  const updateAchievement = useGameStore(s => s.updateAchievement);

  // Check for the Dummy Veteran achievement in real time
  useEffect(() => {
    if (!achievements.veteranDummy) {
      const hasSkill12 = Object.values(skills).some(skill => skill.level >= 12);
      if (hasSkill12) {
        updateAchievement('veteranDummy', true);
      }
    }
  }, [skills, achievements.veteranDummy, updateAchievement]);

  const trophies = [
    {
      id: 'ratKilled',
      title: 'Rato de Biblioteca',
      description: 'Derrotar o Rato de Esgoto.',
      buff: '+10 Max HP',
      unlocked: achievements.ratKilled,
      icon: '🐀'
    },
    {
      id: 'crownTaxActivated',
      title: 'Fiel à Coroa',
      description: 'Ativar a Taxa da Coroa.',
      buff: '+20 Max Mana',
      unlocked: achievements.crownTaxActivated,
      icon: '👑'
    },
    {
      id: 'manualCollects',
      title: 'Calos nas Mãos',
      description: `Coletar manualmente. (${Math.min(achievements.manualCollects, 100)}/100)`,
      buff: '+2 Attack',
      unlocked: achievements.manualCollects >= 100,
      icon: '🪓'
    },
    {
      id: 'veteranDummy',
      title: 'Veterano do Dummy',
      description: 'Atingir Nível 12 em uma habilidade.',
      buff: '+10 Max HP',
      unlocked: achievements.veteranDummy,
      icon: '⚔️'
    }
  ];

  return (
    <div className="w-64 bg-[#0f1115] border-l border-gray-800/60 flex flex-col pointer-events-auto h-full shadow-[-5px_0_15px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="h-10 border-b border-gray-800 flex items-center px-4 bg-[#14161a]">
        <h2 className="text-xs font-serif text-gray-300 uppercase tracking-widest">
          Troféus da Vila
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {trophies.map(t => (
          <div 
            key={t.id} 
            className={`
              relative p-3 border rounded transition-all duration-500
              ${t.unlocked 
                ? 'border-[#d4af37]/40 bg-[#d4af37]/5' 
                : 'border-gray-800/80 bg-[#121418] grayscale opacity-60'}
            `}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`
                w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-sm text-lg
                ${t.unlocked ? 'bg-[#d4af37]/10 text-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.2)]' : 'bg-gray-900 text-gray-500'}
              `}>
                {t.icon}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                  <h3 className={`text-[11px] font-bold uppercase tracking-wider truncate ${t.unlocked ? 'text-[#d4af37]' : 'text-gray-400'}`}>
                    {t.title}
                  </h3>
                  {t.unlocked && <span className="text-[10px] text-[#d4af37] animate-pulse">✓</span>}
                </div>
                
                <p className="text-[10px] text-gray-500 font-mono mt-1 leading-tight">
                  {t.description}
                </p>
                
                {t.unlocked && (
                  <p className="text-[9px] text-[#d4af37]/80 font-mono mt-1.5 flex items-center gap-1 before:content-[''] before:block before:w-1 before:h-1 before:bg-[#d4af37]/50 before:rounded-full">
                    {t.buff}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
