"use client";

import { useLogisticsStore } from "@/stores/logisticsStore";
import { Package } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CITY_POSITION } from "./CityNode";

// Player residential plot base position
const BASE_POSITION = { x: 2280, y: 2680 };

export default function CaravanNode() {
  const { activeCaravan, updateCaravanStatus } = useLogisticsStore();
  const [pos, setPos] = useState(BASE_POSITION);

  useEffect(() => {
    if (!activeCaravan || activeCaravan.status === 'preparing' || activeCaravan.status === 'arrived') return;

    const interval = setInterval(() => {
      const now = Date.now();
      const dispatch = activeCaravan.dispatchTime!;
      const returnT = activeCaravan.returnTime!;
      const totalDuration = returnT - dispatch;
      const elapsed = now - dispatch;

      if (elapsed >= totalDuration) {
        if (activeCaravan.status !== 'arrived') {
          updateCaravanStatus('arrived');
        }
        setPos(BASE_POSITION);
        return;
      }

      const halfDuration = totalDuration / 2;
      let progress = 0;
      let startX, startY, endX, endY;

      if (elapsed < halfDuration) {
        // Viagem de ida
        if (activeCaravan.status !== 'traveling_out') updateCaravanStatus('traveling_out');
        progress = elapsed / halfDuration;
        startX = BASE_POSITION.x;
        startY = BASE_POSITION.y;
        endX = CITY_POSITION.x;
        endY = CITY_POSITION.y;
      } else {
        // Viagem de volta
        if (activeCaravan.status !== 'traveling_back') updateCaravanStatus('traveling_back');
        progress = (elapsed - halfDuration) / halfDuration;
        startX = CITY_POSITION.x;
        startY = CITY_POSITION.y;
        endX = BASE_POSITION.x;
        endY = BASE_POSITION.y;
      }

      setPos({
        x: startX + (endX - startX) * progress,
        y: startY + (endY - startY) * progress
      });
    }, 100); // 10 FPS update for smoothness

    return () => clearInterval(interval);
  }, [activeCaravan, updateCaravanStatus]);

  if (!activeCaravan || activeCaravan.status === 'preparing') return null;

  return (
    <motion.div
      className="absolute flex flex-col items-center justify-center pointer-events-none"
      style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)', zIndex: Math.floor(pos.y) }}
    >
      <div className="w-8 h-8 bg-amber-900 border-2 border-fantasy-accent rounded flex items-center justify-center shadow-lg">
        <Package size={16} className="text-fantasy-accent" />
      </div>
      <div className="bg-black/80 px-2 py-0.5 rounded text-[10px] text-fantasy-accent font-bold mt-1 shadow-md border border-fantasy-border whitespace-nowrap">
        {activeCaravan.status === 'traveling_out' ? 'A Caminho da Capital' : 
         activeCaravan.status === 'traveling_back' ? 'Retornando com Ouro' : 'Chegou!'}
      </div>
    </motion.div>
  );
}
