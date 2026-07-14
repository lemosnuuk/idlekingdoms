"use client";

import { useGameStore } from "@/stores/gameStore";
import { useMultiplayerStore } from "@/stores/multiplayerStore";
import { useCombatStore } from "@/stores/combatStore";
import { useHousingStore } from "@/stores/housingStore";
import { Castle, Award } from "lucide-react";
import { useMemo } from "react";

export default function Minimap() {
  const characterPosition = useGameStore(state => state.characterPosition);
  const currentMapId = useGameStore(state => state.currentMapId);
  const currentFloor = useGameStore(state => state.currentFloor);
  const nodes = useGameStore(state => state.nodesByMap[currentMapId]) || [];
  const targetPosition = useGameStore(state => state.targetPosition);
  const players = useMultiplayerStore(state => state.players);
  const worldBoss = useMultiplayerStore(state => state.worldBoss);
  const monsters = useCombatStore(state => state.monstersByMap[currentMapId]) || [];
  const plots = useHousingStore(state => state.plots);

  // Map 5000x5000 to percentage with static precision to avoid hydration mismatch
  const getPos = (x: number, y: number) => {
    return {
      left: `${((x / 5000) * 100).toFixed(4)}%`,
      top: `${((y / 5000) * 100).toFixed(4)}%`,
    };
  };

  return (
    <div className="w-48 h-48 rounded-full border-4 border-fantasy-border bg-fantasy-darker/90 backdrop-blur-sm overflow-hidden relative shadow-[0_0_25px_rgba(0,0,0,0.6)] group hover:border-fantasy-accent transition-colors cursor-pointer select-none">
      
      {/* Dynamic inline styles for the path marching animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes routeDash {
          to { stroke-dashoffset: -20; }
        }
        .route-dashed-line {
          animation: routeDash 1.2s linear infinite;
        }
      `}} />

      {/* Biomes Background representation on minimap */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            radial-gradient(circle at 50% 0%, #f1f5f9 0%, transparent 65%), /* North: Mountains (Snowy Grey) */
            radial-gradient(circle at 15% 70%, #15803d 0%, transparent 60%), /* West: Dense Forest (Dark Green) */
            radial-gradient(circle at 80% 65%, #0284c7 0%, transparent 45%), /* East: Lakes (Blue) */
            radial-gradient(circle at 25% 25%, #0284c7 0%, transparent 40%), /* North-West Lake (Blue) */
            #22c55e /* Center/Plains: Grassland (Light Green) */
          `
        }}
      />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-15 pointer-events-none" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '16px 16px'
        }}
      />

      {/* Minimap Inner Content */}
      <div className="absolute inset-2 rounded-full overflow-hidden">
        
        {/* Render Plots */}
        {plots.map((plot) => (
          <div
            key={plot.id}
            className="absolute w-2 h-2 border border-amber-600/40 bg-amber-900/20 -translate-x-1/2 -translate-y-1/2"
            style={getPos(plot.x + plot.width / 2, plot.y + plot.height / 2)}
            title="Seu Terreno"
          />
        ))}

        {/* Render Resource Nodes (Wood/Stone) within 800px radar range */}
        {useMemo(() => {
          return nodes && nodes
            .filter(node => Math.hypot(node.x - characterPosition.x, node.y - characterPosition.y) < 800 && node.floor === currentFloor)
            .map((node) => (
              <div
                key={node.id}
                className={`absolute w-1 h-1 rounded-full -translate-x-1/2 -translate-y-1/2 ${
                  node.type !== 'iron_ore' ? 'bg-green-400' : 'bg-slate-400'
                }`}
                style={getPos(node.x, node.y)}
              />
            ));
        }, [nodes, characterPosition.x, characterPosition.y])}

        {/* Render Traveled Target Route Path (Suave dashed line) */}
        {targetPosition && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <line
              x1={`${((characterPosition.x / 5000) * 100).toFixed(4)}%`}
              y1={`${((characterPosition.y / 5000) * 100).toFixed(4)}%`}
              x2={`${((targetPosition.x / 5000) * 100).toFixed(4)}%`}
              y2={`${((targetPosition.y / 5000) * 100).toFixed(4)}%`}
              stroke="#fbbf24" // Warm golden fantasy glow
              strokeWidth="2"
              strokeDasharray="4 4"
              className="route-dashed-line"
              opacity="0.8"
            />
          </svg>
        )}

        {/* Render Monsters */}
        {monsters.map((monster) => (
          !monster.isDead && monster.floor === currentFloor && (
            <div
              key={monster.id}
              className="absolute w-1.5 h-1.5 rounded-full bg-red-500 -translate-x-1/2 -translate-y-1/2"
              style={getPos(monster.x, monster.y)}
              title={monster.name}
            />
          )
        ))}

        {/* Capital City */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 text-fantasy-accent animate-pulse z-20"
          style={getPos(2500, 2400)}
          title="Capital do Reino"
        >
          <Castle size={14} className="drop-shadow-[0_0_4px_rgba(196,154,69,0.8)]" />
        </div>

        {/* Map Landmarks (Apenas HUB) */}
        {currentMapId === 'HUB_VILA_CENTRAL' && (
          <>
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 text-[10px] filter drop-shadow-[0_0_2px_rgba(234,179,8,0.8)] z-15 select-none"
              style={getPos(1000, 3200)}
              title="Árvore Gigante Ancestral"
            >
              🌳
            </div>
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 text-[10px] filter drop-shadow-[0_0_2px_rgba(168,85,247,0.8)] z-15 select-none"
              style={getPos(3800, 3800)}
              title="Ruínas de Aethelgard"
            >
              🏛️
            </div>
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 text-[10px] filter drop-shadow-[0_0_2px_rgba(239,68,68,0.8)] z-15 select-none"
              style={getPos(2500, 1000)}
              title="Mina do Vulcão Adormecido"
            >
              🌋
            </div>
          </>
        )}

        {/* World Boss */}
        {worldBoss.isActive && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 text-red-500 animate-bounce"
            style={getPos(worldBoss.x, worldBoss.y)}
            title="Dragão Ancião (Boss)"
          >
            <Award size={14} className="drop-shadow-[0_0_6px_red]" />
          </div>
        )}

        {/* Other Players (NPCs Arthas & Merlin) */}
        {players.map((p) => (
          <div
            key={p.id}
            className="absolute w-1.5 h-1.5 rounded-full bg-indigo-400 border border-indigo-600 -translate-x-1/2 -translate-y-1/2"
            style={getPos(p.x, p.y)}
            title={p.name}
          />
        ))}

        {/* Local Player (Pulsing Indicator) */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
          style={getPos(characterPosition.x, characterPosition.y)}
        >
          <span className="absolute inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 opacity-75 animate-ping -left-[3.5px] -top-[3.5px]" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-white shadow-md" />
        </div>
      </div>

      {/* Minimap Label */}
      <div className="absolute bottom-1 left-0 right-0 text-center pointer-events-none">
        <span className="text-[9px] font-serif uppercase tracking-widest text-fantasy-accent bg-fantasy-darker/90 px-2 py-0.5 rounded border border-fantasy-border/40 font-bold">
          X: {Math.round(characterPosition.x)} Y: {Math.round(characterPosition.y)}
        </span>
      </div>
    </div>
  );
}
