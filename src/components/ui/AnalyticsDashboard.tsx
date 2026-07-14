import React, { useState, useEffect, useRef } from 'react';
import { useWorkerStore } from '@/stores/workerStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useGameStore } from '@/stores/gameStore';
import { Flame } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const workers = useWorkerStore(s => s.workers);
  const gold = useInventoryStore(s => s.gold);
  const currentMapId = useGameStore(s => s.currentMapId);
  const corpses = useGameStore(s => s.corpsesByMap[currentMapId]) || [];
  const crownTaxRate = useGameStore(s => s.crownTaxRate);
  const setCrownTaxRate = useGameStore(s => s.setCrownTaxRate);
  const quellRebellion = useGameStore(s => s.quellRebellion);
  
  const activeWorkers = workers.filter(w => w.status === 'working');
  const rebellingWorkers = activeWorkers.filter(w => w.isRebelling);
  const workingClass = activeWorkers.filter(w => !w.isRebelling);
  
  // Production rules (Per Minute equivalent of 10s tick)
  const SALARY_PER_WORKER = 6; // 6 Gold per min (1 per tick)
  const PRODUCTION_PER_WORKER = 6; // 6 Resources per min (1 per tick)
  
  const eficiencia = 1 - (crownTaxRate / 100);
  const grossIncomePerMin = Math.floor(workingClass.length * PRODUCTION_PER_WORKER * eficiencia);
  
  const ouroTributadoPorMin = Math.floor(activeWorkers.length * SALARY_PER_WORKER * (crownTaxRate / 100));
  const expensesPerMin = (activeWorkers.length * SALARY_PER_WORKER) - ouroTributadoPorMin;
  
  const netBalance = grossIncomePerMin - expensesPerMin;
  const isNegative = netBalance < 0;

  // Gold Sparkline SVG logic
  const [goldHistory, setGoldHistory] = useState<number[]>([]);
  const MAX_SAMPLES = 15;

  useEffect(() => {
    setGoldHistory(prev => {
      // Prevent consecutive duplicates if gold hasn't changed to make the graph more active,
      // but in an idle game tick it might be fine. We just sample every change.
      if (prev.length > 0 && prev[prev.length - 1] === gold) {
        return prev;
      }
      
      const newHistory = [...prev, gold];
      if (newHistory.length > MAX_SAMPLES) {
        newHistory.shift();
      }
      return newHistory;
    });
  }, [gold]);

  // Risk metrics
  const totalHeroDeaths = corpses.length;
  const lostGoldInCorpses = corpses.reduce((acc, c) => acc + c.gold, 0);

  // SVG drawing logic
  const svgWidth = 260;
  const svgHeight = 50;
  
  const maxGold = Math.max(...goldHistory, 10);
  const minGold = Math.min(...goldHistory, 0);
  const range = maxGold - minGold || 1;
  
  const points = goldHistory.map((g, i) => {
    // scale x from 0 to svgWidth
    const x = goldHistory.length > 1 ? (i / (goldHistory.length - 1)) * svgWidth : 0;
    // scale y from svgHeight (min) to 0 (max)
    const y = svgHeight - ((g - minGold) / range) * svgHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-[#090a0f] border border-gray-800 rounded-sm p-4 text-gray-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] w-full">
      <h2 className="text-gray-100 font-bold text-xs tracking-widest uppercase mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
        <span className="text-emerald-500">📈</span> Analytics & Ops
      </h2>

      {/* Accounting Balance */}
      <div className="mb-5 space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Gross Production <span className="text-[9px] opacity-70">({(eficiencia*100).toFixed(0)}% eff)</span></span>
          <span className="font-mono text-emerald-500">+{grossIncomePerMin} res/m</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 border-b border-gray-800 pb-1.5">
          <span>Op. Expenses <span className="text-[9px] opacity-70">(-{ouroTributadoPorMin}g tax)</span></span>
          <span className="font-mono text-rose-600">-{expensesPerMin} g/m</span>
        </div>
        <div className="flex justify-between text-xs pt-1.5 font-bold">
          <span className="text-gray-400">Net Balance</span>
          <span className={`font-mono ${isNegative ? 'text-red-400/80 drop-shadow-[0_0_2px_rgba(248,113,113,0.3)]' : 'text-emerald-400'}`}>
            {isNegative ? '' : '+'}{netBalance} net/m
          </span>
        </div>
      </div>

      {/* Crown Tax Slider */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <h3 className="text-[10px] text-gray-500 uppercase tracking-widest">Taxa de Proteção da Coroa</h3>
          <span className="text-xs font-mono text-[#d4af37]">{crownTaxRate}%</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="40" 
          step="5"
          value={crownTaxRate}
          onChange={(e) => setCrownTaxRate(parseInt(e.target.value))}
          className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#d4af37]"
        />
        <div className="flex justify-between text-[9px] text-gray-600 mt-1 font-mono">
          <span>0%</span>
          <span>40% MAX</span>
        </div>
      </div>

      {/* Peasant Revolts Alert */}
      {rebellingWorkers.length > 0 && (
        <div className="mb-6 space-y-2">
          <h3 className="text-[10px] text-rose-500 uppercase tracking-widest flex items-center gap-1">
            <Flame size={12} /> Sedition Detected
          </h3>
          {rebellingWorkers.map(worker => (
            <div key={worker.id} className="bg-rose-950/20 border border-red-900/60 rounded-sm p-2 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-rose-400 font-bold">{worker.name} <span className="opacity-60 text-[10px]">({worker.type})</span></span>
                <span className="text-rose-500/70 text-[10px] font-mono">Lote {worker.assignedPlotId}</span>
              </div>
              <button 
                onClick={() => quellRebellion(worker.id)}
                className="w-full py-1 bg-black/40 hover:bg-rose-900/30 border border-rose-900/50 text-rose-300 text-[10px] uppercase tracking-widest transition-colors font-mono"
              >
                [ Subornar e Pacificar (50g) ]
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Sparkline Chart */}
      <div className="mb-6">
        <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Wealth Fluctuation (Gold)</h3>
        <div className="w-full h-[50px] bg-[#050608] border border-gray-900 relative overflow-hidden rounded-sm">
          {goldHistory.length > 1 ? (
            <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" className="overflow-visible">
              <defs>
                <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <polyline
                points={points}
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                filter="url(#glow-green)"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-700 font-mono">
              [ AWAITING DATA ]
            </div>
          )}
        </div>
        <div className="flex justify-between text-[9px] text-gray-600 mt-1 font-mono">
          <span>T-15</span>
          <span className="text-emerald-500 drop-shadow-[0_0_1px_rgba(16,185,129,0.5)]">{gold} G</span>
        </div>
      </div>

      {/* ROI & Risk Metrics */}
      <div>
        <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 border-b border-gray-800 pb-1">Risk & Biome ROI</h3>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-[#0c0d12] p-2 rounded-sm border border-gray-800/60">
            <span className="block text-[9px] text-gray-500 mb-0.5">Fields / Forest</span>
            <span className="block text-xs text-emerald-500 font-mono drop-shadow-[0_0_1px_rgba(16,185,129,0.3)]">1.2x EFF</span>
          </div>
          <div className="bg-[#0c0d12] p-2 rounded-sm border border-gray-800/60">
            <span className="block text-[9px] text-gray-500 mb-0.5">Mountains / Caves</span>
            <span className="block text-xs text-rose-500 font-mono drop-shadow-[0_0_1px_rgba(244,63,94,0.3)]">0.6x EFF</span>
          </div>
        </div>

        <div className="space-y-1 mt-3">
          <div className="flex justify-between items-center text-[10px] bg-rose-950/10 border border-rose-900/20 px-2 py-1.5 rounded-sm">
            <span className="text-gray-400">Total Casualties</span>
            <span className="text-rose-500 font-mono font-bold">{totalHeroDeaths}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] bg-rose-950/10 border border-rose-900/20 px-2 py-1.5 rounded-sm">
            <span className="text-gray-400">Retained Gold (Corpses)</span>
            <span className="text-rose-500 font-mono font-bold">{lostGoldInCorpses}g</span>
          </div>
        </div>
      </div>

    </div>
  );
};
