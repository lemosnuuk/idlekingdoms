"use client";

import { motion } from "framer-motion";
import { useMultiplayerStore } from "@/stores/multiplayerStore";
import { useMarketStore } from "@/stores/marketStore";
import { useCraftingStore } from "@/stores/craftingStore";
import { useWorkerStore } from "@/stores/workerStore";

export const CITY_POSITION = { x: 2500, y: 2400 };

export default function CityNode() {
  const { toggleAlliancePanel } = useMultiplayerStore();
  const { toggleMarket } = useMarketStore();
  const { toggleCrafting } = useCraftingStore();
  const { toggleWorkers } = useWorkerStore();

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: CITY_POSITION.x,
        top: CITY_POSITION.y,
        width: 1,
        height: 1,
        zIndex: Math.floor(CITY_POSITION.y),
      }}
    >
      {/* 1. Castelo / Prefeitura (Centro) - Massivo */}
      <motion.div
        className="absolute pointer-events-auto cursor-pointer flex flex-col items-center justify-end group"
        style={{
          left: -130,
          top: -220,
          width: 260,
          height: 260,
          zIndex: Math.floor(CITY_POSITION.y - 10),
        }}
        whileHover={{ scale: 1.04 }}
        onClick={toggleAlliancePanel}
      >
        <div className="relative w-full h-[220px] filter drop-shadow-[0_0_30px_rgba(196,154,69,0.55)]">
          <img
            src="/assets/castle.png?v=3"
            alt="Castelo Real"
            className="w-full h-full object-contain select-none pointer-events-none animate-idle-wind"
          />
        </div>
        <div className="absolute top-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-zinc-950/80 backdrop-blur-md border border-fantasy-accent/65 px-3 py-1.5 rounded-lg shadow-xl z-20 flex flex-col items-center">
          <span className="text-[10px] text-fantasy-accent font-serif font-bold uppercase tracking-widest whitespace-nowrap">👑 Castelo Real</span>
          <span className="text-[8px] text-zinc-400 font-sans mt-0.5">Gerenciar Guildas</span>
        </div>
      </motion.div>

      {/* 2. Taverna do Javali (Oeste) - Grande */}
      <motion.div
        className="absolute pointer-events-auto cursor-pointer flex flex-col items-center justify-end group"
        style={{
          left: -290,
          top: -40,
          width: 160,
          height: 160,
          zIndex: Math.floor(CITY_POSITION.y + 10),
        }}
        whileHover={{ scale: 1.05 }}
        onClick={toggleWorkers}
      >
        <div className="relative w-full h-[135px] filter drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]">
          <img
            src="/assets/cabin.png?v=3"
            alt="Taverna do Javali"
            className="w-full h-full object-contain select-none pointer-events-none filter sepia-[0.25] saturate-[1.2] animate-idle-wind"
          />
        </div>
        <div className="absolute top-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-zinc-950/80 backdrop-blur-md border border-fantasy-border px-3 py-1.5 rounded-lg shadow-xl z-20 flex flex-col items-center">
          <span className="text-[10px] text-white font-serif font-bold uppercase tracking-widest whitespace-nowrap">🍺 Taverna do Javali</span>
          <span className="text-[8px] text-zinc-400 font-sans mt-0.5">Contratar Trabalhadores</span>
        </div>
      </motion.div>

      {/* 3. Mercado Central (Leste) - Grande */}
      <motion.div
        className="absolute pointer-events-auto cursor-pointer flex flex-col items-center justify-end group"
        style={{
          left: 130,
          top: -40,
          width: 150,
          height: 150,
          zIndex: Math.floor(CITY_POSITION.y + 10),
        }}
        whileHover={{ scale: 1.05 }}
        onClick={toggleMarket}
      >
        <div className="relative w-full h-[125px] filter drop-shadow-[0_0_20px_rgba(196,154,69,0.35)]">
          <img
            src="/assets/tent.png?v=3"
            alt="Mercado Central"
            className="w-full h-full object-contain select-none pointer-events-none filter hue-rotate-[20deg] animate-idle-wind"
          />
        </div>
        <div className="absolute top-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-zinc-950/80 backdrop-blur-md border border-fantasy-accent/30 px-3 py-1.5 rounded-lg shadow-xl z-20 flex flex-col items-center">
          <span className="text-[10px] text-fantasy-accent font-serif font-bold uppercase tracking-widest whitespace-nowrap">⚖️ Mercado da Vila</span>
          <span className="text-[8px] text-zinc-400 font-sans mt-0.5">Comprar e Vender</span>
        </div>
      </motion.div>

      {/* 4. Forja de Bronze - Ferreiro (Sul) - Grande */}
      <motion.div
        className="absolute pointer-events-auto cursor-pointer flex flex-col items-center justify-end group"
        style={{
          left: -80,
          top: 70,
          width: 160,
          height: 160,
          zIndex: Math.floor(CITY_POSITION.y + 20),
        }}
        whileHover={{ scale: 1.05 }}
        onClick={toggleCrafting}
      >
        <div className="relative w-full h-[135px] filter drop-shadow-[0_0_20px_rgba(249,115,22,0.35)]">
          <img
            src="/assets/cabin.png?v=3"
            alt="Forja de Bronze"
            className="w-full h-full object-contain select-none pointer-events-none filter brightness-[0.7] sepia-[0.3] hue-rotate-[180deg] animate-idle-wind"
          />
          {/* Animated Sparks from Chimney */}
          <div className="absolute top-8 right-8 w-2 h-2 bg-orange-500 rounded-full animate-ping pointer-events-none shadow-[0_0_8px_#f97316]" />
        </div>
        <div className="absolute top-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-zinc-950/80 backdrop-blur-md border border-red-900/60 px-3 py-1.5 rounded-lg shadow-xl z-20 flex flex-col items-center">
          <span className="text-[10px] text-red-400 font-serif font-bold uppercase tracking-widest whitespace-nowrap">🔥 Forja de Bronze</span>
          <span className="text-[8px] text-zinc-400 font-sans mt-0.5">Craft de Armamentos</span>
        </div>
      </motion.div>
    </div>
  );
}
