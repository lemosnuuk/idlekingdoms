"use client";

import { useGameStore } from "@/stores/gameStore";
import { useCombatStore } from "@/stores/combatStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Character() {
  const { currentMapId, characterPosition, targetPosition, isMoving, isSwimming, nodesByMap, timeOfDay, setCharacterPosition, setIsMoving, vocation, playerName } = useGameStore();
  const nodes = nodesByMap[currentMapId] || [];
  const { activeMonsterId } = useCombatStore();
  const { items } = useInventoryStore();
  const [facingRight, setFacingRight] = useState(true);

  const getVocationIcon = () => {
    switch(vocation) {
      case 'Knight': return '🛡️ ';
      case 'Paladin': return '🏹 ';
      case 'Mage': return '🔮 ';
      default: return '';
    }
  };

  // Check inventory crafted tools
  const hasIronAxe = items.some(i => i.itemId === 'iron_axe');
  const hasStoneAxe = items.some(i => i.itemId === 'stone_axe');

  useEffect(() => {
    if (targetPosition) {
      if (targetPosition.x > characterPosition.x) setFacingRight(true);
      else if (targetPosition.x < characterPosition.x) setFacingRight(false);
    }
  }, [targetPosition, characterPosition.x]);

  // Velocidade de movimento em pixels por segundo (slowing down in water)
  const SPEED = isSwimming ? 75 : 150; 

  // Calcula duração baseada na distância
  const getDuration = () => {
    if (!targetPosition) return 0;
    const dx = targetPosition.x - characterPosition.x;
    const dy = targetPosition.y - characterPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance / SPEED;
  };

  const isAttacking = !!activeMonsterId;

  // Find target node from coordinate (node click positions are node.x, node.y + 20)
  const targetNode = targetPosition 
    ? nodes.find(n => n.x === targetPosition.x && n.y === targetPosition.y - 20) 
    : null;

  // Detect proximity to any harvesting node (within 50px) to play swinging animation
  const activeHarvestNode = !isMoving 
    ? nodes.find(n => Math.hypot(n.x - characterPosition.x, n.y + 20 - characterPosition.y) < 50 && n.currentHealth > 0)
    : null;

  const isHarvesting = !!activeHarvestNode;
  const isSwinging = isAttacking || isHarvesting;

  // Determine what tool/weapon graphic to render
  const getWeaponType = () => {
    if (isAttacking) return 'sword';
    
    // Check if moving to harvest or actively harvesting
    const activeNode = activeHarvestNode || targetNode;
    if (activeNode) {
      if (activeNode.type === 'oak_tree' || activeNode.type === 'pine_tree') {
        return hasIronAxe ? 'iron_axe' : 'stone_axe';
      }
      if (activeNode.type === 'iron_ore') {
        return 'pickaxe';
      }
    }
    return 'sword';
  };

  const weaponType = getWeaponType();

  return (
    <motion.div
      className="absolute w-16 h-16 -ml-8 -mt-16" // Centraliza na base do pé (z-index is sorted dynamically)
      animate={{
        x: targetPosition ? targetPosition.x : characterPosition.x,
        y: targetPosition ? targetPosition.y : characterPosition.y,
      }}
      transition={{
        duration: getDuration(),
        ease: "linear",
      }}
      onAnimationComplete={() => {
        if (targetPosition) {
          setCharacterPosition(targetPosition);
          // Só desbloqueia se a automação não iniciou um novo ciclo durante esta animação
          const { getAutomationMovementId } = require('@/hooks/useAutomationEngine');
          // O motor de automação já terá feito setIsMoving(false) se precisar;
          // aqui apenas sincronizamos a posição visual com a lógica.
          setIsMoving(false);
        }
      }}
      style={{
        x: characterPosition.x,
        y: characterPosition.y,
        zIndex: Math.floor(characterPosition.y) // Depth sorting relative to scenery
      }}
    >
      <div 
        className={`w-full h-full relative ${!isSwimming ? 'after:content-[\'\'] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-[60%] after:h-2 after:bg-black/40 after:blur-[2px] after:rounded-full after:-z-10' : ''}`}
        style={{ transform: `scaleX(${facingRight ? 1 : -1})` }}
      >
        {/* Efeito de Água / Ondas se estiver nadando */}
        {isSwimming && (
          <>
            <div className="absolute bottom-[0px] left-1/2 -translate-x-1/2 w-12 h-6 border-2 border-cyan-400/40 rounded-full animate-ping pointer-events-none z-40" />
            <div className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-10 h-4 bg-cyan-600/30 border border-cyan-300/50 rounded-full blur-[1px] pointer-events-none z-40" />
          </>
        )}

        {/* Nighttime torch light under player */}
        {timeOfDay === 'night' && (
          <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-48 h-32 bg-amber-500/10 rounded-full filter blur-xl pointer-events-none -z-10 shadow-[0_0_40px_rgba(245,158,11,0.2)] animate-pulse" />
        )}

        {/* Player Sprite Container */}
        <motion.div 
          className="relative w-full h-full flex flex-col items-center justify-end origin-bottom"
          animate={isMoving && !isAttacking ? { y: [0, -3, 0] } : { y: 0 }}
          transition={{ repeat: Infinity, duration: 0.3 }}
          style={isSwimming ? { clipPath: 'inset(0px 0px 14px 0px)', y: 8 } : {}}
        >
          {/* Lemos Pixel Art Sprite */}
          <img 
            src="/assets/lemos.png?v=3" 
            alt={playerName} 
            className="w-14 h-14 object-contain filter drop-shadow-md select-none pointer-events-none z-10"
          />

          {/* Swinging Tool overlay (Axe / Pickaxe) */}
          {weaponType !== 'sword' && (
            <motion.div 
              className="absolute z-20 right-[-4px] top-[16px] origin-top-left"
              animate={isSwinging ? { rotate: [0, -75, 10, 0] } : { rotate: -15 }}
              transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
            >
              {weaponType === 'stone_axe' && (
                <div className="w-1.5 h-10 bg-amber-800 border border-amber-950 origin-top rotate-180 shadow-md">
                  <div className="absolute bottom-[-6px] left-[-8px] w-5 h-5 bg-slate-500 border border-slate-600 rounded-l-md rounded-tr-lg" />
                  <div className="absolute bottom-[-1px] left-[-2px] w-3 h-1.5 bg-yellow-600 opacity-85" />
                </div>
              )}
              {weaponType === 'iron_axe' && (
                <div className="w-1.5 h-10 bg-amber-800 border border-amber-950 origin-top rotate-180 shadow-md">
                  <div className="absolute bottom-[-8px] left-[-10px] w-7 h-7 bg-gradient-to-br from-cyan-200 to-slate-400 border border-slate-600" style={{ clipPath: 'polygon(0% 20%, 30% 0%, 70% 0%, 100% 20%, 80% 50%, 100% 80%, 70% 100%, 30% 100%, 0% 80%, 20% 50%)' }} />
                  <div className="absolute bottom-0 left-[-1.5px] w-2 h-2 bg-fantasy-accent rounded-full" />
                </div>
              )}
              {weaponType === 'pickaxe' && (
                <div className="w-1.5 h-10 bg-amber-800 border border-amber-950 origin-top rotate-180 shadow-md">
                  <div className="absolute bottom-[-4px] left-[-14px] w-8 h-1.5 bg-gradient-to-r from-slate-400 via-slate-500 to-slate-400 rounded-full border border-slate-600 rotate-12" />
                  <div className="absolute bottom-[-5px] left-[-2px] w-2 h-3 bg-slate-600 rounded-sm border border-slate-700" />
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
      
      {/* Nome do Player */}
      <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 text-[10px] font-serif whitespace-nowrap text-fantasy-accent font-bold drop-shadow-[0_2px_2px_rgba(0,0,0,1)] bg-black/70 px-2 py-0.5 rounded border border-fantasy-accent/30 flex items-center justify-center">
        <span>{getVocationIcon()}{playerName}</span>
      </div>
    </motion.div>
  );
}
