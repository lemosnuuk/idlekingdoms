"use client";

import { OtherPlayer } from "@/stores/multiplayerStore";
import { motion } from "framer-motion";
import { memo } from "react";

export default memo(function OtherPlayerNode({ player }: { player: OtherPlayer }) {
  const isMerlin = player.name.toLowerCase().includes('merlin');
  const spriteSrc = isMerlin ? '/assets/merlin.png?v=3' : '/assets/arthas.png?v=3';

  return (
    <div
      className="absolute flex flex-col items-center pointer-events-none -ml-7 -mt-14"
      style={{ 
        left: player.x, 
        top: player.y, 
        zIndex: Math.floor(player.y), 
        transition: 'left 0.1s linear, top 0.1s linear' 
      }}
    >
      <motion.div 
        animate={player.isMoving ? { y: [0, -3, 0] } : { y: 0 }}
        transition={{ repeat: Infinity, duration: 0.3 }}
        className="relative flex justify-center"
      >
        {/* Foot Shadow */}
        <div className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-8 h-2 bg-black/50 rounded-full blur-[1px] -z-10" />
        
        {/* Pixel Art NPC Sprite */}
        <img 
          src={spriteSrc} 
          alt={player.name} 
          className="w-14 h-14 object-contain filter drop-shadow-md select-none pointer-events-none"
        />
      </motion.div>
      
      <div className="bg-black/85 px-1.5 py-0.5 rounded text-[8px] text-indigo-300 font-serif font-bold tracking-wider mt-0.5 shadow-md border border-indigo-500/25 whitespace-nowrap">
        {player.name}
      </div>
    </div>
  );
});
