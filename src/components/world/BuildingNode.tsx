"use client";

import { BuildingData, useHousingStore } from "@/stores/housingStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useGameStore } from "@/stores/gameStore";
import { Flame, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function BuildingNode({ building }: { building: BuildingData }) {
  const { upgradeBuilding } = useHousingStore();
  const { items, getQuantity, removeItem } = useInventoryStore();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const getIcon = () => {
    switch (building.type) {
      case 'tent': return <TentSprite />;
      case 'cabin': return <CabinSprite />;
      case 'campfire': return <Flame size={48} className="text-orange-500 animate-pulse drop-shadow-[0_0_15px_rgba(255,165,0,0.8)]" />;
      case 'training_dummy': return (
        <div className="w-14 h-14 flex items-center justify-center bg-amber-900/30 border border-fantasy-accent/60 rounded-xl relative hover:border-fantasy-accent transition-all shadow-lg">
          <span className="text-3xl animate-pulse">🎯</span>
        </div>
      );
      default: return null;
    }
  };

  const handleUpgrade = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (building.type === 'tent') {
      const wood = getQuantity('wood');
      const leather = getQuantity('leather');
      if (wood >= 50 && leather >= 10) {
        removeItem('wood', 50);
        removeItem('leather', 10);
        upgradeBuilding(building.id, 'cabin');
      }
    }
  };

  return (
    <motion.div
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      className="flex flex-col items-center justify-center relative cursor-pointer group"
      onClick={(e) => {
        e.stopPropagation();
        if (building.type === 'tent') setShowUpgrade(!showUpgrade);
        if (building.type === 'training_dummy') {
          const game = useGameStore.getState();
          const nextTraining = !game.isTraining;
          game.setIsTraining(nextTraining);
          game.addFloatingText(
            nextTraining ? "Treino Iniciado! ⚔️" : "Treino Parado 🛑", 
            game.characterPosition.x, 
            game.characterPosition.y - 45, 
            'level_up'
          );
        }
      }}
    >
      {getIcon()}
      <div className="absolute -bottom-4 bg-black/60 px-2 py-0.5 rounded text-[10px] text-white font-serif uppercase tracking-widest border border-fantasy-border/50">
        {building.type}
      </div>

      <AnimatePresence>
        {showUpgrade && building.type === 'tent' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: -30 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-10 flex flex-col items-center z-50 bg-black/90 p-2 rounded border border-fantasy-accent"
          >
            <span className="text-[10px] text-white whitespace-nowrap mb-1">Upgrade para Cabana</span>
            <span className="text-[8px] text-fantasy-text-muted mb-2">Custo: 50 Madeira, 10 Couro</span>
            <button 
              onClick={handleUpgrade}
              className="bg-fantasy-accent hover:bg-fantasy-accent-hover text-black text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"
            >
              <ArrowUp size={10} /> Upgrade
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TentSprite() {
  return (
    <img 
      src="/assets/tent.png?v=3" 
      alt="Tent" 
      className="w-16 h-16 object-contain filter drop-shadow-md select-none pointer-events-none"
    />
  );
}

function CabinSprite() {
  return (
    <img 
      src="/assets/cabin.png?v=3" 
      alt="Cabin" 
      className="w-20 h-20 object-contain filter drop-shadow-lg select-none pointer-events-none mt-[-6px]"
    />
  );
}
