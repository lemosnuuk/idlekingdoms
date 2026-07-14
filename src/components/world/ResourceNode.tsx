"use client";

import { motion } from "framer-motion";
import { useGameStore, NodeData } from "@/stores/gameStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useEffect, useState, memo } from "react";

interface ResourceNodeProps {
  node: NodeData;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

interface Branch {
  id: number;
  x: number;
  y: number;
}

export default memo(function ResourceNode({ node }: { node: NodeData }) {
  const { setTargetPosition, setIsMoving, damageNode } = useGameStore();
  const { addItem, isFull } = useInventoryStore();

  const isTree = node.type === 'oak_tree' || node.type === 'pine_tree';
  const isDummy = node.type === 'training_dummy';
  const isDepleted = node.currentHealth <= 0;

  // Local state for harvest VFX
  const [prevHealth, setPrevHealth] = useState(node.currentHealth);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [fallingBranches, setFallingBranches] = useState<Branch[]>([]);

  // Detect when the resource node is hit/damaged
  useEffect(() => {
    if (node.currentHealth < prevHealth) {
      triggerHitEffects();
    }
    setPrevHealth(node.currentHealth);
  }, [node.currentHealth]);

  const triggerHitEffects = () => {
    // 1. Spawn flying wood chips/stone chunks
    const colors = isTree 
      ? ['#854d0e', '#ca8a04', '#a16207', '#78350f'] // Wood brown/orange colors
      : ['#b91c1c', '#7f1d1d', '#ef4444', '#57534e']; // Iron red/grey colors

    const newParticles = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: 30 + (Math.random() - 0.5) * 12,
      y: isTree ? 35 : 40,
      vx: (Math.random() - 0.5) * 5,
      vy: -Math.random() * 6 - 3,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));

    setParticles(prev => [...prev.slice(-18), ...newParticles]);

    // 2. Spawn a falling branch (for trees only)
    if (isTree) {
      setFallingBranches(prev => [
        ...prev.slice(-3),
        {
          id: Date.now() + Math.random(),
          x: 10 + Math.random() * 40, // drops from canopy
          y: -70 - Math.random() * 20
        }
      ]);
    }
  };

  // Determine biome based on coordinates
  const getBiome = (x: number, y: number) => {
    if (y < 1400 && x >= 2000) return 'mountain';
    if (x < 2000) return 'forest';
    return 'grassland';
  };

  const biome = getBiome(node.x, node.y);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDepleted) return;
    
    setTargetPosition({ x: node.x, y: node.y + 20 });
    setIsMoving(true);

    setTimeout(() => {
      const latestGameStore = useGameStore.getState();
      const latestMapId = latestGameStore.currentMapId;
      const latestNodes = latestGameStore.nodesByMap[latestMapId] || [];
      const latestNode = latestNodes.find(n => n.id === node.id);
      if (isDummy) {
        if (latestNode && latestNode.currentHealth > 0) {
          const game = useGameStore.getState();
          const voc = game.vocation;
          
          let skill: keyof typeof game.skills = 'swordFighting';
          if (voc === 'Mage') skill = 'magicLevel';
          else if (voc === 'Paladin') skill = 'distanceFighting';
          
          game.gainSkillXp(skill, 2);
          
          const lvl = game.skills[skill].level;
          const damage = Math.floor(10 * (1 + (lvl - 10) * 0.05));
          damageNode(node.id, damage);
          
          useGameStore.getState().addFloatingText(
            "⚔️ Treinando...", 
            node.x, 
            node.y - 45, 
            'exp'
          );
          
          if (latestNode.currentHealth <= 25) {
            useGameStore.getState().triggerShake();
          }
        }
      } else {
        const currentFull = useInventoryStore.getState().isFull();
        if (!currentFull && latestNode && latestNode.currentHealth > 0) {
          addItem(isTree ? 'wood' : 'stone', 1);
          
          // Track achievement
          const game = useGameStore.getState();
          game.updateAchievement('manualCollects', game.achievements.manualCollects + 1);

          // Dynamic Tibia skills progression
          if (isTree) {
            game.gainSkillXp('axeFighting', 1);
            const axeLvl = game.skills.axeFighting.level;
            const damage = Math.floor(25 * (1 + (axeLvl - 10) * 0.05));
            damageNode(node.id, damage);
          } else {
            game.gainSkillXp('pickaxeFighting', 1);
            const pickLvl = game.skills.pickaxeFighting.level;
            const damage = Math.floor(25 * (1 + (pickLvl - 10) * 0.05));
            damageNode(node.id, damage);
          }
          
          // Spawn floating harvest text feedback directly above the character
          useGameStore.getState().addFloatingText(
            isTree ? "+1 🪵 Madeira" : "+1 🪨 Ferro", 
            node.x, 
            node.y - 45, 
            'harvest'
          );

          if (latestNode.currentHealth <= 25) {
            useGameStore.getState().triggerShake();
          }
        }
      }
      
      // GARANTIA: Destravar engine no fim da ação manual
      useGameStore.getState().setIsMoving(false);
    }, 2000);
  };

  const getNodeFilters = () => {
    if (isDepleted) {
      return "grayscale(1) brightness(0.3) contrast(0.7)";
    }
    // Check if this is a tree in the Autumn Grove coordinates (bottom-right: x > 3100, y > 2300, y < 3500)
    if (node.x > 3100 && node.y > 2300 && node.y < 3500 && node.type !== 'iron_ore') {
      // Red/Orange foliage filter (autumn trees)
      return "hue-rotate-[-35deg] saturate-[1.3] brightness-[0.95]";
    }
    switch (biome) {
      case 'mountain':
        return "hue-rotate-[15deg] saturate-[0.6] brightness-[1.1] contrast-[1.05]";
      case 'forest':
        return "hue-rotate-[45deg] saturate-[0.8] brightness-[0.6] contrast-[0.9]";
      default:
        return "";
    }
  };

  const getAssetSrc = () => {
    if (node.type === 'oak_tree') return '/assets/oak_tree.png?v=3';
    if (node.type === 'pine_tree') return '/assets/pine_tree.png?v=3';
    return '/assets/iron_ore.png?v=3';
  };

  // Gradually crumble scale based on HP percent
  const getRockScale = () => {
    if (isDepleted) return 0.25;
    if (node.currentHealth <= 25) return 0.65;
    if (node.currentHealth <= 50) return 0.78;
    if (node.currentHealth <= 75) return 0.88;
    return 1;
  };

  const getSpriteStyle = (): React.CSSProperties => {
    // Sementes Pseudo-Random determinísticas (0 a 1)
    const seed1 = Math.abs(Math.sin(node.x * 12.9898 + node.y * 78.233)) % 1;
    
    if (isTree) {
      // Diferenciação das Árvores
      const isPine = node.type === 'pine_tree';
      
      // Variação de Escala Orgânica (0.9 a 1.15)
      const proceduralScale = 0.9 + (seed1 * 0.25);
      const treeScale = isDepleted ? 1.15 : (0.85 + (node.currentHealth / node.maxHealth) * 0.15) * proceduralScale;
      
      return {
        width: isPine ? '80px' : '120px', 
        height: isPine ? '130px' : '110px',
        marginTop: isPine ? '-120px' : '-100px', // A base toca exatamente o Y do node (Sem offset artificial)
        clipPath: isDepleted ? 'inset(80% 0% 0% 0%)' : 'none',
        transform: isDepleted 
          ? 'translateY(70px) scaleY(1.15)' 
          : `scale(${treeScale})`,
        opacity: isDepleted ? 0.5 : 1
      };
    } else {
      // Iron Ore Outcrop (Facetado e Cristalino via CSS filters)
      return {
        width: '60px',
        height: '60px',
        marginTop: '-30px',
        transform: isDepleted 
          ? 'scaleY(0.25) translateY(90px)' 
          : `scale(${getRockScale()})`,
        opacity: isDepleted ? 0.4 : 1,
        filter: isDepleted ? 'grayscale(1) brightness(0.3)' : 'contrast(1.3) brightness(1.1) saturate(0.8) drop-shadow(0 8px 6px rgba(0,0,0,0.7))'
      };
    }
  };

  // Jitter Posicional (Deslocamento orgânico de -8px a +8px)
  const seed2 = Math.abs(Math.sin(node.x * 17.123 + node.y * 45.412)) % 1;
  const seed3 = Math.abs(Math.cos(node.x * 21.841 + node.y * 31.987)) % 1;
  const jitterX = isTree ? -8 + (seed2 * 16) : 0;
  const jitterY = isTree ? -8 + (seed3 * 16) : 0;

  return (
    <motion.div
      className={`absolute flex flex-col items-center group ${isDepleted ? 'pointer-events-none' : 'cursor-pointer'}`}
      style={{ 
        left: node.x + jitterX, 
        top: node.y + jitterY,
        zIndex: Math.floor(node.y + jitterY)
      }}
      whileHover={isDepleted ? {} : { scale: 1.05 }}
      onClick={handleClick}
    >
      <div className="flex items-center justify-center relative select-none">
        
        {/* Shadow */}
        {!isDepleted && isTree && (
          <div className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-[80%] h-[15%] bg-black/45 blur-[3px] rounded-[50%] -z-10" />
        )}
        {!isDepleted && !isTree && !isDummy && (
          <div className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-[60%] h-[15%] bg-black/60 blur-[2px] rounded-[50%] -z-10" />
        )}
        
        {isDummy ? (
          <div className="relative w-12 h-16 bg-transparent flex flex-col items-center justify-end" style={{ marginTop: '-40px' }}>
            {/* Base Wood Log */}
            <div className="w-2 h-8 bg-amber-900 border-x border-amber-950" />
            {/* Dummy Body */}
            <div className="absolute top-2 w-8 h-10 bg-[#c2a278] border border-amber-900 rounded-sm">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-rose-800/40 border border-rose-900/50 flex items-center justify-center">
                <div className="w-1 h-1 bg-rose-900 rounded-full" />
              </div>
              {/* Straw/Hay protruding */}
              <div className="absolute -top-1 left-1 w-1 h-2 bg-yellow-600/80 -rotate-12" />
              <div className="absolute -top-2 right-1 w-1 h-3 bg-yellow-600/80 rotate-12" />
            </div>
            {/* Dummy Arms */}
            <div className="absolute top-4 -left-2 w-3 h-1 bg-amber-800 rounded-l-full rotate-[15deg]" />
            <div className="absolute top-4 -right-2 w-3 h-1 bg-amber-800 rounded-r-full -rotate-[15deg]" />
          </div>
        ) : (
          <div className="relative">
            <img 
              src={getAssetSrc()} 
              alt={node.type} 
              className={`select-none pointer-events-none object-contain transition-all duration-300 ${isTree ? 'animate-idle-wind origin-bottom' : ''}`}
              style={{
                ...getSpriteStyle(),
                filter: isTree ? getNodeFilters() : getSpriteStyle().filter, // Tree keeps its biome filter, ore keeps its faceted filter
                animationDelay: isTree ? `-${Math.abs(Math.sin(node.x * 11 + node.y * 13)) * 4}s` : '0s'
              }}
            />
            {/* Efeito de Glint (Shimmer) no Minério */}
            {!isTree && !isDepleted && (
              <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none" style={{ maskImage: `url(${getAssetSrc()})`, maskSize: '100% 100%' }}>
                <div className="w-[200%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer absolute top-0 -left-[100%]" />
              </div>
            )}
            {/* Partículas de poeira mágica no Minério */}
            {!isTree && !isDepleted && (
              <>
                <div className="absolute bottom-4 left-2 w-1 h-1 bg-cyan-200 rounded-full animate-float-up opacity-0" style={{ animationDelay: '0s', animationDuration: '3s', animationIterationCount: 'infinite' }} />
                <div className="absolute bottom-2 right-4 w-1 h-1 bg-teal-100 rounded-full animate-float-up opacity-0" style={{ animationDelay: '1.5s', animationDuration: '4s', animationIterationCount: 'infinite' }} />
                <div className="absolute bottom-6 right-2 w-1 h-1 bg-white rounded-full animate-float-up opacity-0" style={{ animationDelay: '0.7s', animationDuration: '2.5s', animationIterationCount: 'infinite' }} />
              </>
            )}
          </div>
        )}{/* Gradual cracks overlay on damaged iron ore rock */}
        {!isTree && !isDepleted && node.currentHealth < 100 && (
          <div 
            className="absolute inset-0 pointer-events-none select-none font-bold text-red-800/80 flex items-center justify-center filter blur-[0.5px]"
            style={{ 
              fontSize: node.currentHealth <= 25 ? '18px' : node.currentHealth <= 50 ? '14px' : '10px',
              transform: 'translateY(-12px)'
            }}
          >
            ⚡
          </div>
        )}

        {/* Biome Snowcaps (Mountain) Overlay */}
        {biome === 'mountain' && !isDepleted && isTree && (
          <div className="absolute top-[-92px] w-6 h-2 bg-sky-50/90 rounded-t-full blur-[0.5px] pointer-events-none border-b border-sky-200/40 shadow-inner" />
        )}

        {/* Depleted Indicator Label */}
        {isDepleted && (
          <span className="absolute text-[8px] font-bold text-fantasy-text-muted bg-black/85 px-1 py-0.5 rounded border border-fantasy-border/60 whitespace-nowrap top-[10px]">
            Esgotado
          </span>
        )}

        {/* Tooltip Hover Premium */}
        {!isDepleted && (
          <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-zinc-950/90 backdrop-blur-md border border-fantasy-border px-3 py-1.5 rounded-lg shadow-xl z-[9999] flex flex-col items-center pointer-events-none">
            <span className="text-[10px] text-white font-serif font-bold uppercase tracking-widest whitespace-nowrap">
              {isTree ? 'Madeira Bruta' : isDummy ? 'Boneco de Treino' : 'Minério de Ferro'}
            </span>
            <span className="text-[8px] text-zinc-400 font-sans mt-0.5 whitespace-nowrap">Clique para coletar</span>
          </div>
        )}

        {/* Flying wood chips / ore chunk particles */}
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute w-1.5 h-1.5 rounded-sm z-30 pointer-events-none"
            style={{ left: p.x, top: p.y, backgroundColor: p.color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ 
              x: p.vx * 14, 
              y: [0, p.vy * 6, p.vy * 6 + 75],
              opacity: 0,
              scale: 0.3
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            onAnimationComplete={() => {
              setParticles(prev => prev.filter(item => item.id !== p.id));
            }}
          />
        ))}

        {/* Visual falling branch from tree */}
        {fallingBranches.map(b => (
          <motion.div
            key={b.id}
            className="absolute text-xs z-30 pointer-events-none select-none"
            style={{ left: b.x, top: b.y }}
            initial={{ y: 0, rotate: 0, opacity: 1 }}
            animate={{ 
              y: 85,
              rotate: [0, 45, -45, 90], 
              opacity: [1, 1, 0] 
            }}
            transition={{ duration: 1.3, ease: "easeOut" }}
            onAnimationComplete={() => {
              setFallingBranches(prev => prev.filter(item => item.id !== b.id));
            }}
          >
            🌿
          </motion.div>
        ))}
      </div>
      
      {/* HP Bar */}
      {!isDepleted && (
        <div 
          className="w-10 h-1 bg-fantasy-darker border border-fantasy-border rounded-full overflow-hidden opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity z-50 pointer-events-none"
          style={{ marginTop: isTree ? '2px' : '6px' }}
        >
          <div 
            className={`h-full ${isTree ? 'bg-fantasy-success' : 'bg-fantasy-accent'}`} 
            style={{ width: `${(node.currentHealth / node.maxHealth) * 100}%` }}
          />
        </div>
      )}
    </motion.div>
  );
});
