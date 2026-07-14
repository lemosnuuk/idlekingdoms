"use client";

import { useHousingStore, PlotData } from "@/stores/housingStore";
import { useWorkerStore } from "@/stores/workerStore";
import { motion } from "framer-motion";
import BuildingNode from "./BuildingNode";
import WorkerNode from "./WorkerNode";

export default function PlotNode({ plot }: { plot: PlotData }) {
  const { isConstructionMode, openPlotMenu, buildings } = useHousingStore();
  const { workers } = useWorkerStore();
  
  const building = buildings.find(b => b.plotId === plot.id);
  const worker = workers.find(w => w.assignedPlotId === plot.id);

  if (!isConstructionMode && !building) return null; // Esconde terrenos vazios se não estiver construindo

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConstructionMode) {
      openPlotMenu(plot.id);
    }
  };

  return (
    <motion.div
      onClick={handleClick}
      className={`absolute flex items-center justify-center transition-all ${
        isConstructionMode ? 'cursor-pointer hover:bg-white/10' : ''
      } ${
        plot.isOwned 
          ? 'border-2 border-fantasy-accent bg-fantasy-accent/5' 
          : 'border-2 border-dashed border-fantasy-text-muted bg-white/5'
      }`}
      style={{
        left: plot.x,
        top: plot.y,
        width: plot.width,
        height: plot.height,
        zIndex: Math.floor(plot.y + plot.height)
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Label de status no modo construção */}
      {isConstructionMode && !building && (
        <div className="absolute -top-6 text-[10px] font-bold text-white bg-black/80 px-2 py-1 rounded border border-fantasy-border whitespace-nowrap">
          {plot.isOwned ? 'Seu Terreno (Clique para Construir)' : `À Venda: ${plot.basePrice} Gold`}
        </div>
      )}

      {/* Renderiza a construção se houver */}
      {building && (
        <div className="relative">
          <BuildingNode building={building} />
          {worker && <WorkerNode worker={worker} />}
        </div>
      )}
    </motion.div>
  );
}
