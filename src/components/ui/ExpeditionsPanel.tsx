import React from 'react';
import { useWorkerStore } from '@/stores/workerStore';
import { useGameStore } from '@/stores/gameStore';
import { MapRegistry } from '@/engine/WorldMapDirector';
import { Pickaxe, Axe, Send, ArrowDownToLine, AlertTriangle } from 'lucide-react';

export const ExpeditionsPanel: React.FC = () => {
  const { workers, dispatchWorkers, recallWorkers } = useWorkerStore();
  const { expeditionAlerts, crownTaxRate } = useGameStore();

  const activeWorkers = workers.filter(w => w.status === 'working' || w.status === 'sleeping');
  const idleLumberjacks = activeWorkers.filter(w => w.type === 'lumberjack' && w.assignedMapId === 'HUB_VILA_CENTRAL' && !w.isRebelling);
  const idleMiners = activeWorkers.filter(w => w.type === 'miner' && w.assignedMapId === 'HUB_VILA_CENTRAL' && !w.isRebelling);

  const maps = Object.values(MapRegistry).filter(m => m.id !== 'HUB_VILA_CENTRAL');

  const eficiencia = 1 - (crownTaxRate / 100);

  return (
    <div className="bg-[#090a0f] border border-indigo-900/40 rounded-sm p-4 text-gray-300 shadow-[0_4px_20px_rgba(0,0,0,0.5)] w-full">
      <h2 className="text-indigo-400 font-bold text-xs tracking-widest uppercase mb-4 border-b border-indigo-900/50 pb-2 flex items-center gap-2">
        <span>🗺️</span> Expeditions Log
      </h2>

      <div className="flex justify-between items-center text-xs text-gray-500 mb-4 bg-black/40 p-2 rounded">
        <span>Hub Idle:</span>
        <div className="flex gap-3">
          <span className="flex items-center gap-1 text-amber-600 font-mono"><Axe size={12}/> {idleLumberjacks.length}</span>
          <span className="flex items-center gap-1 text-slate-400 font-mono"><Pickaxe size={12}/> {idleMiners.length}</span>
        </div>
      </div>

      <div className="space-y-3">
        {maps.map(map => {
          const mapLumberjacks = activeWorkers.filter(w => w.type === 'lumberjack' && w.assignedMapId === map.id);
          const mapMiners = activeWorkers.filter(w => w.type === 'miner' && w.assignedMapId === map.id);
          const isFrozen = expeditionAlerts[map.id];

          return (
            <div key={map.id} className="relative bg-gray-900 border border-gray-800 rounded p-3 overflow-hidden">
              {isFrozen && (
                <div className="absolute inset-0 bg-red-950/40 flex items-center justify-center backdrop-blur-[1px] z-10 border border-red-500/50">
                  <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest">
                    <AlertTriangle size={14} className="animate-pulse" /> Funds Depleted
                  </div>
                </div>
              )}

              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-gray-200">{map.name}</span>
                <span className="text-[10px] text-gray-600 uppercase tracking-wider">Lvl {map.baseLevel}</span>
              </div>

              {/* Native Resource Forecast */}
              <div className="mb-3 space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-500">{map.nativeResources?.lumberjack}</span>
                  <span className="font-mono text-emerald-500/80">+{Math.floor(mapLumberjacks.length * eficiencia * 6)}/m</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-500">{map.nativeResources?.miner}</span>
                  <span className="font-mono text-emerald-500/80">+{Math.floor(mapMiners.length * eficiencia * 6)}/m</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 border-t border-gray-800/60 pt-2">
                <div className="flex-1 flex items-center justify-between bg-black/30 rounded px-1.5 py-1 border border-amber-900/30">
                  <span className="text-[10px] text-amber-600 font-mono flex items-center gap-1"><Axe size={10}/> {mapLumberjacks.length}</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => dispatchWorkers('lumberjack', 1, map.id)}
                      disabled={idleLumberjacks.length === 0}
                      className="text-gray-500 hover:text-emerald-400 disabled:opacity-30 transition-colors"
                    >
                      <Send size={12} />
                    </button>
                    <button 
                      onClick={() => recallWorkers('lumberjack', 1, map.id)}
                      disabled={mapLumberjacks.length === 0}
                      className="text-gray-500 hover:text-amber-500 disabled:opacity-30 transition-colors"
                    >
                      <ArrowDownToLine size={12} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-between bg-black/30 rounded px-1.5 py-1 border border-slate-700/30">
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1"><Pickaxe size={10}/> {mapMiners.length}</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => dispatchWorkers('miner', 1, map.id)}
                      disabled={idleMiners.length === 0}
                      className="text-gray-500 hover:text-emerald-400 disabled:opacity-30 transition-colors"
                    >
                      <Send size={12} />
                    </button>
                    <button 
                      onClick={() => recallWorkers('miner', 1, map.id)}
                      disabled={mapMiners.length === 0}
                      className="text-gray-500 hover:text-amber-500 disabled:opacity-30 transition-colors"
                    >
                      <ArrowDownToLine size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
