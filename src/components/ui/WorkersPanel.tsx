"use client";

import { useWorkerStore } from "@/stores/workerStore";
import { useHousingStore } from "@/stores/housingStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useMarketStore } from "@/stores/marketStore";
import { X, Users, TreePine, Diamond, Coins, Tent, ChevronDown, AlertTriangle, Package, Truck, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

function CustomSelect({ value, options, onChange, placeholder }: { value: string, options: {value: string, label: string}[], onChange: (val: string) => void, placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const currentOption = options.find(o => o.value === value);
  
  return (
    <div className="relative text-[10px] font-mono w-full" onMouseLeave={() => setIsOpen(false)}>
      <div 
        className="bg-[#1a1811] border border-[#d4af37]/30 hover:border-[#d4af37] rounded px-2 py-1.5 text-[#d4af37] cursor-pointer flex justify-between items-center shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {currentOption ? currentOption.label : placeholder}
        <ChevronDown size={12} className={`transition-transform opacity-70 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            className="absolute z-50 left-0 right-0 top-[110%] bg-[#0b0b0d] border border-[#ffffff]/10 rounded shadow-2xl overflow-hidden max-h-32 overflow-y-auto"
          >
            {options.map(opt => (
              <div 
                key={opt.value}
                className="px-2 py-1.5 hover:bg-[#d4af37]/20 hover:text-[#d4af37] cursor-pointer transition-colors text-slate-300"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
              >
                {opt.label}
              </div>
            ))}
            {options.length === 0 && (
              <div className="px-2 py-1.5 text-fantasy-text-muted opacity-50">Nenhuma Casa Livre</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WorkersPanel() {
  const { workers, isOpen, toggleWorkers, hireWorker, assignWorker } = useWorkerStore();
  const { gold, removeGold, getQuantity, removeItem, addGold } = useInventoryStore();
  const { plots, buildings } = useHousingStore();

  const [caravanActive, setCaravanActive] = useState(false);
  const [caravanTimer, setCaravanTimer] = useState(0); // 30s
  const [caravanLoad, setCaravanLoad] = useState({ wood: 0, stone: 0, iron_ore: 0 });

  // Caravan Simulation Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (caravanActive && caravanTimer > 0) {
      interval = setInterval(() => {
        setCaravanTimer(prev => prev - 1);
      }, 1000);
    } else if (caravanActive && caravanTimer === 0) {
      const currentPrices = useMarketStore.getState().prices;
      const totalEarned = 
        Math.round(caravanLoad.wood * currentPrices.wood) +
        Math.round(caravanLoad.stone * currentPrices.stone) +
        Math.round(caravanLoad.iron_ore * currentPrices.iron_ore);
      
      if (totalEarned > 0) {
        addGold(totalEarned);
      }
      setCaravanActive(false);
      setCaravanLoad({ wood: 0, stone: 0, iron_ore: 0 });
    }
    return () => clearInterval(interval);
  }, [caravanActive, caravanTimer, caravanLoad, addGold]);

  const handleHire = (type: 'lumberjack' | 'miner', cost: number) => {
    if (gold >= cost) {
      removeGold(cost);
      hireWorker(type);
    } else {
      alert("Ouro insuficiente para contratar!");
    }
  };

  const handleLoadCaravan = () => {
    const wood = getQuantity('wood');
    const stone = getQuantity('stone');
    const iron = getQuantity('iron_ore');
    
    if (wood > 0) removeItem('wood', wood);
    if (stone > 0) removeItem('stone', stone);
    if (iron > 0) removeItem('iron_ore', iron);

    setCaravanLoad(prev => ({
      wood: prev.wood + wood,
      stone: prev.stone + stone,
      iron_ore: prev.iron_ore + iron,
    }));
  };

  const dispatchCaravan = () => {
    if (caravanLoad.wood === 0 && caravanLoad.stone === 0 && caravanLoad.iron_ore === 0) return;
    setCaravanActive(true);
    setCaravanTimer(30);
  };

  const getAvailablePlots = () => {
    return plots.filter(p => 
      p.isOwned && 
      buildings.find(b => b.plotId === p.id) &&
      !workers.find(w => w.assignedPlotId === p.id)
    ).map(p => ({ value: p.id, label: `Lote ${p.id}` }));
  };

  const availablePlotsOptions = getAvailablePlots();
  const assignedWorkers = workers.filter(w => w.assignedPlotId);
  const lumberjacksCount = assignedWorkers.filter(w => w.type === 'lumberjack').length;
  const minersCount = assignedWorkers.filter(w => w.type === 'miner').length;

  const goldSpentPerSec = (assignedWorkers.length / 5).toFixed(1);
  const woodGenPerSec = (lumberjacksCount / 5).toFixed(1);
  const stoneGenPerSec = (minersCount / 5).toFixed(1);
  const isOutOfFunds = gold === 0 && assignedWorkers.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 384, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="h-full pointer-events-auto overflow-hidden flex-shrink-0"
        >
          <div className="w-96 h-full bg-gradient-to-b from-[#141417]/95 to-[#0b0b0d]/98 border-l border-[#ffffff]/5 backdrop-blur-md shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-[#ffffff]/5 bg-black/20">
              <div className="flex items-center gap-3">
                <Users className="text-[#d4af37]" size={20} />
                <h2 className="font-serif font-bold text-lg text-[#d4af37] uppercase tracking-widest">Súditos</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-[#0a0a0c] px-3 py-1 rounded-full border border-[#d4af37]/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
                  <Coins size={12} className="text-[#d4af37]" />
                  <span className="text-[#d4af37] font-bold text-[11px] font-mono">{gold}</span>
                </div>
                <button onClick={toggleWorkers} className="text-fantasy-text-muted hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* STATUS DOS LOTES E FOLHA SALARIAL */}
              <div>
                <h3 className="text-[11px] font-bold text-fantasy-text-muted uppercase tracking-widest mb-3">Monitoramento & Logística</h3>
                <div className="bg-[#0b0b0d] border border-[#ffffff]/5 rounded-lg p-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] space-y-3">
                  {/* Lotes */}
                  <div className="flex gap-2">
                    {plots.map((p, i) => {
                      const hasBuilding = buildings.find(b => b.plotId === p.id);
                      const assignedWorker = workers.find(w => w.assignedPlotId === p.id);
                      let statusColor = "bg-slate-900 border-slate-800 text-slate-700"; // Não comprado
                      if (p.isOwned) statusColor = "bg-yellow-950/30 border-yellow-900/50 text-yellow-700"; // Comprado, sem construção
                      if (hasBuilding) statusColor = "bg-blue-950/30 border-blue-900/50 text-blue-500"; // Construído, vazio
                      if (assignedWorker) statusColor = "bg-green-950/40 border-green-900/60 text-green-500"; // Ocupado
                      
                      return (
                        <div key={p.id} className={`flex-1 h-8 rounded border flex items-center justify-center text-[10px] font-bold ${statusColor}`} title={`Lote ${p.id}`}>
                          L{i+1}
                        </div>
                      );
                    })}
                  </div>

                  {/* Folha Salarial */}
                  <div className="pt-2 border-t border-[#ffffff]/5 flex justify-between items-center font-mono text-[10px]">
                    <div className="flex flex-col gap-1">
                      <span className="text-fantasy-text-muted">Custo Operacional</span>
                      <span className="text-red-400 flex items-center gap-1">-{goldSpentPerSec} <Coins size={8}/> /s</span>
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                      <span className="text-fantasy-text-muted">Produção Estimada</span>
                      <span className="text-green-400">+{woodGenPerSec} W / +{stoneGenPerSec} S /s</span>
                    </div>
                  </div>

                  {isOutOfFunds && (
                    <div className="bg-red-950/40 border border-red-900/50 text-red-500 rounded p-2 text-[10px] font-bold flex items-center justify-center gap-2 uppercase tracking-widest animate-pulse">
                      <AlertTriangle size={14} /> Produção Pausada - Sem Fundos
                    </div>
                  )}
                </div>
              </div>

              {/* CARAVANAS */}
              <div>
                <h3 className="text-[11px] font-bold text-fantasy-text-muted uppercase tracking-widest mb-3 flex items-center justify-between">
                  Caravanas p/ a Capital
                  <Truck size={14} className="text-[#d4af37]" />
                </h3>
                <div className="bg-[#0b0b0d] border border-[#ffffff]/5 rounded-lg p-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] relative overflow-hidden">
                  
                  {caravanActive && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4">
                      <Truck size={24} className="text-emerald-500 mb-2 animate-bounce" />
                      <div className="w-full h-1 bg-emerald-950 rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                          style={{ width: `${((30 - caravanTimer) / 30) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold tracking-widest uppercase">
                        Em Trânsito: {caravanTimer}s
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-end mb-3">
                    <div className="flex flex-col gap-1.5 font-mono text-[10px]">
                      <div className="text-fantasy-text-muted">Carga Atual:</div>
                      <div className="flex gap-3">
                        <span className="text-amber-700">W: {caravanLoad.wood}</span>
                        <span className="text-slate-500">S: {caravanLoad.stone}</span>
                        <span className="text-cyan-600">I: {caravanLoad.iron_ore}</span>
                      </div>
                    </div>
                    <button 
                      onClick={handleLoadCaravan}
                      disabled={caravanActive}
                      className="text-[10px] bg-[#1a1811] hover:bg-[#d4af37]/20 border border-[#d4af37]/30 text-[#d4af37] px-2 py-1 rounded transition-colors flex items-center gap-1"
                    >
                      <Package size={10} /> Carregar Estoque
                    </button>
                  </div>

                  <button 
                    onClick={dispatchCaravan}
                    disabled={caravanActive || (caravanLoad.wood === 0 && caravanLoad.stone === 0 && caravanLoad.iron_ore === 0)}
                    className="w-full bg-[#142818] hover:bg-emerald-800 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-800 border border-emerald-900/50 text-emerald-400 py-2 rounded text-[11px] font-bold transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    Despachar Caravana <ArrowRight size={12} />
                  </button>
                </div>
              </div>

              {/* CONTRATAÇÃO */}
              <div>
                <h3 className="text-[11px] font-bold text-fantasy-text-muted uppercase tracking-widest mb-3">Taverna (Contratação)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0b0b0d] border border-[#ffffff]/5 rounded-lg p-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-green-950/40 p-1.5 rounded text-green-500 border border-green-900"><TreePine size={14}/></div>
                        <span className="text-[11px] font-bold text-slate-200">Lenhador</span>
                      </div>
                      <div className="text-[10px] text-fantasy-text-muted mb-3 font-mono leading-tight flex flex-col gap-0.5">
                        <span className="text-red-400">-0.2 Gold /s</span>
                        <span className="text-green-400">+0.2 Wood /s</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleHire('lumberjack', 100)}
                      className="w-full bg-[#1a1811] hover:bg-[#d4af37] border border-[#d4af37]/30 hover:text-black text-[#d4af37] py-1.5 rounded text-[10px] font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-1 mt-auto"
                    >
                      100 <Coins size={10} />
                    </button>
                  </div>

                  <div className="bg-[#0b0b0d] border border-[#ffffff]/5 rounded-lg p-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-slate-800/40 p-1.5 rounded text-slate-400 border border-slate-700"><Diamond size={14}/></div>
                        <span className="text-[11px] font-bold text-slate-200">Mineiro</span>
                      </div>
                      <div className="text-[10px] text-fantasy-text-muted mb-3 font-mono leading-tight flex flex-col gap-0.5">
                        <span className="text-red-400">-0.2 Gold /s</span>
                        <span className="text-green-400">+0.2 Stone /s</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleHire('miner', 150)}
                      className="w-full bg-[#1a1811] hover:bg-[#d4af37] border border-[#d4af37]/30 hover:text-black text-[#d4af37] py-1.5 rounded text-[10px] font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-1 mt-auto"
                    >
                      150 <Coins size={10} />
                    </button>
                  </div>
                </div>
              </div>

              {/* TRABALHADORES ATUAIS */}
              <div>
                <h3 className="text-[11px] font-bold text-fantasy-text-muted uppercase tracking-widest mb-3 flex justify-between items-center">
                  Sua Comunidade
                  <span className="text-[#d4af37] bg-[#1a1811] px-2 py-0.5 rounded border border-[#d4af37]/20 font-mono">
                    {workers.length} / 4
                  </span>
                </h3>
                
                {workers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-fantasy-text-muted opacity-50 font-serif border border-dashed border-[#ffffff]/10 rounded-lg">
                    <Users size={24} className="mb-2" />
                    <p className="text-[10px] tracking-wider uppercase">Você não tem súditos.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workers.map(w => (
                      <div key={w.id} className="bg-[#0a0a0c] border border-[#ffffff]/5 rounded-lg p-3 flex flex-col gap-2 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded ${w.type === 'lumberjack' ? 'text-green-500 bg-green-950/40 border border-green-900' : 'text-slate-400 bg-slate-800/40 border border-slate-700'}`}>
                              {w.type === 'lumberjack' ? <TreePine size={12} /> : <Diamond size={12} />}
                            </div>
                            <div>
                              <div className="font-bold text-slate-200 text-xs">{w.name}</div>
                              <div className="text-[10px] font-mono text-fantasy-text-muted flex items-center gap-1 mt-0.5">
                                Status: <span className={w.status === 'working' ? (isOutOfFunds ? 'text-red-400 animate-pulse' : 'text-green-400 font-bold') : 'text-slate-500'}>{isOutOfFunds ? 'Pausado' : w.status}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t border-[#ffffff]/5 pt-2">
                          {w.assignedPlotId ? (
                            <div className="text-[10px] font-mono text-[#d4af37] bg-[#1a1811] px-2 py-1.5 rounded border border-[#d4af37]/20 flex items-center gap-2 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                              <Tent size={12} /> Lote {w.assignedPlotId}
                            </div>
                          ) : (
                            <CustomSelect 
                              value="" 
                              options={availablePlotsOptions} 
                              onChange={(val) => assignWorker(w.id, val)} 
                              placeholder="Designar Lote..." 
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
