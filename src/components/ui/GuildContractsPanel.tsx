"use client";

import { useGuildStore } from "@/stores/guildStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { motion, AnimatePresence } from "framer-motion";
import { Anchor, ArrowUp, Briefcase, Clock, Ship, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

function CircularProgress({ progress }: { progress: number }) {
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg className="w-8 h-8 transform -rotate-90">
      <circle
        className="text-zinc-800"
        strokeWidth="3"
        stroke="currentColor"
        fill="transparent"
        r={radius}
        cx="16"
        cy="16"
      />
      <circle
        className="text-cyan-600 transition-all duration-100 ease-linear"
        strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        stroke="currentColor"
        fill="transparent"
        r={radius}
        cx="16"
        cy="16"
      />
    </svg>
  );
}

export function GuildContractsPanel() {
  const { isOpen, setIsOpen, contracts, activeShipments, fleetLevel, upgradeFleet, acceptContract, collectShipment, checkShipments } = useGuildStore();
  const { gold, items } = useInventoryStore();
  const [tick, setTick] = useState(0);

  const woodCount = items.find(i => i.itemId === 'wood')?.quantity || 0;
  const ironCount = items.find(i => i.itemId === 'iron_ore')?.quantity || 0;
  const darkIronCount = items.find(i => i.itemId === 'dark_iron')?.quantity || 0;

  const costDarkIron = fleetLevel * 2;

  // Background ticker for shipments UI & state
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      checkShipments();
      setTick(prev => prev + 1); // trigger re-render for progress bars
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, checkShipments]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        className="fixed top-20 left-4 w-[420px] max-h-[80vh] z-50 pointer-events-auto flex flex-col bg-zinc-950 border border-zinc-800 shadow-[0_0_30px_rgba(0,0,0,0.8)] font-mono text-zinc-300"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center bg-cyan-950 border border-cyan-900/50 text-cyan-500">
              <Briefcase size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-widest text-zinc-100 uppercase">Guild Logistics</h2>
              <p className="text-[10px] text-zinc-500 tracking-wider">B2B Mercantile Contracts</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-zinc-600 hover:text-white transition-colors">✕</button>
        </div>

        {/* FLEET UPGRADE */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/20 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase">Status da Frota</span>
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-2">
              <Ship size={14} /> Nível {fleetLevel} 
              <span className="text-zinc-600 font-normal">({(fleetLevel - 1) * 15}% Time Redux)</span>
            </span>
          </div>
          <button 
            disabled={darkIronCount < costDarkIron}
            onClick={upgradeFleet}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-sm"
          >
            <ArrowUp size={12} className="text-cyan-500" />
            <span>Melhorar</span>
            <span className={`text-[10px] px-1 rounded ${darkIronCount >= costDarkIron ? 'bg-cyan-900/30 text-cyan-400' : 'bg-red-900/30 text-red-400'}`}>
              {costDarkIron} Dark Iron
            </span>
          </button>
        </div>

        <div className="overflow-y-auto overflow-x-hidden p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
          
          {/* ACTIVE SHIPMENTS */}
          {activeShipments.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-1">Fretes Ativos</h3>
              {activeShipments.map(shipment => {
                const total = shipment.endTime - shipment.startTime;
                const elapsed = Date.now() - shipment.startTime;
                const progress = Math.min(100, (elapsed / total) * 100);
                const isReady = shipment.status === 'READY';
                
                return (
                  <div key={shipment.id} className={`flex items-center gap-3 p-3 border ${isReady ? 'border-cyan-900/50 bg-cyan-950/20' : 'border-zinc-800 bg-zinc-900/30'} rounded-sm`}>
                    <div className="relative flex-shrink-0">
                      {isReady ? (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-cyan-400 bg-cyan-950/50">
                          <CheckCircle2 size={18} />
                        </div>
                      ) : (
                        <CircularProgress progress={progress} />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-zinc-200 truncate">{shipment.name}</div>
                      <div className="text-[10px] text-zinc-500">Recompensa: {shipment.rewardQty}x {shipment.rewardItem.toUpperCase()}</div>
                    </div>
                    
                    {isReady ? (
                      <button onClick={() => collectShipment(shipment.id)} className="px-3 py-1 bg-cyan-900 hover:bg-cyan-800 text-cyan-100 text-[10px] font-bold uppercase rounded-sm transition-colors">
                        Coletar
                      </button>
                    ) : (
                      <div className="text-[10px] text-cyan-600 flex items-center gap-1 font-bold">
                        <Anchor size={12} /> {Math.ceil((shipment.endTime - Date.now()) / 1000)}s
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* AVAILABLE CONTRACTS */}
          <div className="space-y-3">
            <h3 className="text-[10px] text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-1">Mercado Futuro</h3>
            <div className="grid grid-cols-1 gap-3">
              {contracts.map(contract => {
                const canAfford = woodCount >= contract.reqWood && ironCount >= contract.reqIron && gold >= contract.bailCost;
                
                return (
                  <div key={contract.id} className="p-3 border border-zinc-800 bg-zinc-900/40 rounded-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="text-xs font-bold text-zinc-200">{contract.name}</div>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded-sm border border-zinc-800">
                        <Clock size={10} /> {(contract.baseDurationMs / 1000)}s
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className={`p-1.5 border rounded-sm ${ironCount >= contract.reqIron ? 'border-zinc-800 text-zinc-400' : 'border-red-900/50 text-red-500/80 bg-red-950/10'}`}>
                        <div className="uppercase opacity-50 mb-0.5">Ferro Requirido</div>
                        <div className="font-bold">{contract.reqIron.toLocaleString()}</div>
                      </div>
                      <div className={`p-1.5 border rounded-sm ${woodCount >= contract.reqWood ? 'border-zinc-800 text-zinc-400' : 'border-red-900/50 text-red-500/80 bg-red-950/10'}`}>
                        <div className="uppercase opacity-50 mb-0.5">Madeira Requirida</div>
                        <div className="font-bold">{contract.reqWood.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <div className={`text-[10px] font-bold ${gold >= contract.bailCost ? 'text-yellow-500/80' : 'text-red-500'}`}>
                        Fiança: {contract.bailCost.toLocaleString()}g
                      </div>
                      
                      <button 
                        disabled={!canAfford}
                        onClick={() => acceptContract(contract)}
                        className="px-4 py-1.5 bg-zinc-200 hover:bg-white text-zinc-900 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-[10px] font-bold uppercase tracking-widest rounded-sm transition-colors"
                      >
                        Assinar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
