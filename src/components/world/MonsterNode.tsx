"use client";

import { useCombatStore, MonsterData } from "@/stores/combatStore";
import { useGameStore } from "@/stores/gameStore";
import { useWorldBossStore } from "@/stores/worldBossStore";
import { motion } from "framer-motion";
import { memo } from "react";

export default memo(function MonsterNode({ monster }: { monster: MonsterData }) {
  const { engageMonster, activeMonsterId } = useCombatStore();
  const { setTargetPosition, setIsMoving, characterPosition } = useGameStore();
  const worldEvent = useWorldBossStore(state => state.worldEvent);

  if (monster.isDead) return null;

  const isEngaged = activeMonsterId === monster.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Move to monster base position
    setTargetPosition({ x: monster.x, y: monster.y + 20 });
    setIsMoving(true);

    // Calc distance (mock simulation for engage delay)
    const dist = Math.hypot(characterPosition.x - monster.x, characterPosition.y - monster.y);
    const timeToReach = (dist / 150) * 1000;

    setTimeout(() => {
      engageMonster(monster.id);
    }, timeToReach);
  };

  const getMonsterFilters = (mx: number, my: number) => {
    const getBiome = (px: number, py: number) => {
      if (py < 1400 && px >= 2000) return 'mountain';
      if (px < 2000) return 'forest';
      return 'grassland';
    };
    
    const biome = getBiome(mx, my);
    switch (biome) {
      case 'mountain':
        return "hue-rotate-[20deg] brightness-[1.3] saturate-[0.4] contrast-[1.05]";
      case 'forest':
        return "hue-rotate-[65deg] saturate-[0.6] brightness-[0.65]";
      default:
        return "";
    }
  };

  return (
    <motion.div
      onClick={handleClick}
      className={`absolute cursor-pointer flex flex-col items-center justify-center transition-all hover:scale-110`}
      style={{ 
        left: monster.x, 
        top: monster.y, 
        transform: 'translate(-50%, -50%)',
        zIndex: isEngaged ? 9999 : Math.floor(monster.y)
      }}
      animate={isEngaged ? { x: [-3, 3, -3], y: [-5, 5, -5] } : { y: [-2, 2, -2] }}
      transition={isEngaged ? { repeat: Infinity, duration: 0.3 } : { repeat: Infinity, duration: 2, ease: "easeInOut" }}
    >
      <div 
        className={`${monster.isWorldBoss ? 'w-32 h-32 scale-150' : 'w-16 h-16'} flex items-center justify-center relative ${isEngaged ? 'filter drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]' : 'filter drop-shadow-md'} after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-3/4 after:h-2 after:bg-black/40 after:blur-[2px] after:rounded-full after:-z-10`}
        style={{ filter: getMonsterFilters(monster.x, monster.y) }}
      >

        {/* Pixel Art Monster Sprite */}
        {monster.isWorldBoss ? (
          <>
            <img 
              src="/assets/dragon.png?v=3" 
              alt="World Boss" 
              className="w-full h-full object-contain select-none pointer-events-none drop-shadow-[0_0_20px_rgba(255,0,0,0.6)]"
            />
            {worldEvent?.isShieldPhase && (
              <motion.div 
                className="absolute inset-0 rounded-full border-[4px] border-cyan-400 bg-cyan-500/20 mix-blend-screen"
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            )}
          </>
        ) : monster.type === 'orc' ? (
          <img 
            src="/assets/orc_danger.png?v=3" 
            alt="Orc Scout" 
            className="w-13 h-13 object-contain select-none pointer-events-none"
          />
        ) : (
          <img 
            src="/assets/wolf_danger.png?v=3" 
            alt="Wild Wolf" 
            className="w-13 h-13 object-contain select-none pointer-events-none"
          />
        )}
      </div>
      
      {/* Name and HP Bar */}
      <div className={`absolute ${monster.isWorldBoss ? 'top-32 w-32' : 'top-14 w-24'} flex flex-col items-center`}>
        <span className={`text-[10px] font-bold ${isEngaged ? 'text-fantasy-danger animate-pulse' : 'text-white'} drop-shadow-md`}>
          {monster.name}
        </span>
        <div className="w-full h-1.5 bg-black rounded-full overflow-hidden border border-fantasy-border mt-0.5 shadow-inner">
          <div 
            className="h-full bg-fantasy-danger transition-all"
            style={{ width: `${(monster.hp / monster.maxHp) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Aggro Ring */}
      {isEngaged && (
        <div className="absolute w-16 h-16 rounded-full border border-fantasy-danger animate-ping opacity-55" />
      )}
    </motion.div>
  );
});
