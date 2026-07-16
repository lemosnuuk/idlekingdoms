"use client";

import React, { MouseEvent, useRef, useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// STORES
import { useGameStore } from "@/store/useGameStore";
import { useGameStore as useLegacyGameStore } from "@/stores/gameStore";
import { useCombatStore } from "@/stores/combatStore";
import { useHousingStore } from "@/stores/housingStore";
import { useMultiplayerStore } from "@/stores/multiplayerStore";
import { useLogisticsStore } from "@/stores/logisticsStore";
import { useLandStore } from "@/stores/landStore";

// NODES
import Character from "./Character";
import ResourceNode from "./ResourceNode";
import MonsterNode from "./MonsterNode";
import PlotNode from "./PlotNode";
import CityNode from "./CityNode";
import CaravanNode from "./CaravanNode";
import OtherPlotNode from "./OtherPlotNode";
import OtherPlayerNode from "./OtherPlayerNode";
import WorldBossNode from "./WorldBossNode";
import FloatingTextEngine from "./FloatingTextEngine";
import WaystoneNode from "./WaystoneNode";
import { PortalBarrier } from './PortalBarrier';
import NPCNode from "./NPCNode";
import LandPlotNode from "./LandPlotNode";

// ENGINE
import { useIdleFishingEngine } from "@/hooks/useIdleFishingEngine";

// CONFIGURATIONS
import mapConfig from "../../../map_config.json";

export default function MapRenderer() {
  useIdleFishingEngine();

  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // NOVO ESTADO
  const holes = useGameStore(state => state.holes);
  const movePlayer = useGameStore(state => state.movePlayer);
  const interactWithRopeSpot = useGameStore(state => state.interactWithRopeSpot);
  const isFishing = useLegacyGameStore(state => state.isFishing);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Hotkey de resgate para o andar 0 (Superfície) - Tecla R
      if (e.key === 'r' || e.key === 'R') {
        useLegacyGameStore.getState().setCurrentFloor(0);
        useLegacyGameStore.getState().setCharacterPosition({ x: 2500, y: 2500 });
        useLegacyGameStore.getState().setTargetPosition(null);
        // Sync na store nova se existir
        useGameStore.getState().movePlayer({ x: 2500, y: 2500, z: 0 });
        // @ts-ignore
        if (useLegacyGameStore.getState().addFloatingText) {
            useLegacyGameStore.getState().addFloatingText("✨ Teleporte de Resgate", 2500, 2450, 'level_up');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // ESTADO LEGADO (Entidades e Posição Real)
  const legacyPosition = useLegacyGameStore(state => state.characterPosition);
  const legacyFloor = useLegacyGameStore(state => state.currentFloor);
  const position = { x: legacyPosition.x, y: legacyPosition.y, z: legacyFloor };
  
  const currentMapId = useLegacyGameStore(state => state.currentMapId);
  const nodes = useLegacyGameStore(state => state.nodesByMap[currentMapId]) || [];
  const npcs = useLegacyGameStore(state => state.npcsByMap?.[currentMapId]) || [];
  const zoom = useLegacyGameStore(state => state.zoom);
  const timeOfDay = useLegacyGameStore(state => state.timeOfDay);
  const shakeActive = useLegacyGameStore(state => state.shakeActive);
  
  // OUTROS STORES
  const currentMonsters = useCombatStore(state => state.monstersByMap[currentMapId]) || [];
  const plots = useHousingStore(state => state.plots);
  const otherPlayers = useMultiplayerStore(state => state.players);
  const otherPlots = useMultiplayerStore(state => state.plots);
  const landPlots = useLandStore(state => state.plots);

  // VIEWPORT
  const [viewport, setViewport] = useState({ w: 1000, h: 1000 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      if (entries.length > 0) {
        setViewport({
          w: entries[0].contentRect.width,
          h: entries[0].contentRect.height
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // CÁLCULO DA CÂMERA (Camera Clamping para não revelar o vazio)
  const mapWidth = mapConfig.mapSize.width;
  const mapHeight = mapConfig.mapSize.height;
  
  const minCameraX = 0;
  const minCameraY = 0;
  const maxCameraX = mapWidth - (viewport.w / zoom);
  const maxCameraY = mapHeight - (viewport.h / zoom);

  const cameraX = Math.max(minCameraX, Math.min(position.x - (viewport.w / 2) / zoom, maxCameraX));
  const cameraY = Math.max(minCameraY, Math.min(position.y - (viewport.h / 2) / zoom, maxCameraY));

  // CLIQUES NO MAPA
  const handleMapClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current || !mapRef.current.parentElement) return;
    const rect = mapRef.current.parentElement.getBoundingClientRect();
    
    const clickX = (e.clientX - rect.left) / zoom + cameraX;
    const clickY = (e.clientY - rect.top) / zoom + cameraY;

    // Atualiza store novo (req. arquitetural)
    movePlayer({ x: clickX, y: clickY, z: position.z });
    
    // Atualiza store legado (move o Character visualmente)
    useLegacyGameStore.getState().setTargetPosition({ x: clickX, y: clickY });
    useLegacyGameStore.getState().setIsMoving(true);
  };

  // CULLING 2D + Z-Axis
  const visibleHalfW = (viewport.w / 2) / zoom;
  const visibleHalfH = (viewport.h / 2) / zoom;
  
  const padding = 300;
  const minX = position.x - visibleHalfW - padding;
  const maxX = position.x + visibleHalfW + padding;
  const minY = position.y - visibleHalfH - padding;
  const maxY = position.y + visibleHalfH + padding;

  const isVisible = (x: number, y: number, floor: number) => {
    return floor === position.z && x >= minX && x <= maxX && y >= minY && y <= maxY;
  };

  // CULLING LISTS
  const visibleNodes = useMemo(() => nodes.filter(n => isVisible(n.x, n.y, n.floor)), [nodes, position, minX, maxX, minY, maxY]);
  const visibleMonsters = useMemo(() => currentMonsters.filter(m => isVisible(m.x, m.y, m.floor)), [currentMonsters, position, minX, maxX, minY, maxY]);
  const visiblePlots = useMemo(() => plots.filter((p: any) => isVisible(p.x, p.y, 0)), [plots, position, minX, maxX, minY, maxY]);
  const visibleOtherPlots = useMemo(() => otherPlots.filter((p: any) => isVisible(p.x, p.y, 0)), [otherPlots, position, minX, maxX, minY, maxY]);
  const visibleOtherPlayers = useMemo(() => otherPlayers.filter((p: any) => isVisible(p.x, p.y, 0)), [otherPlayers, position, minX, maxX, minY, maxY]);
  const visibleHoles = useMemo(() => holes.filter(h => isVisible(h.x, h.y, h.z)), [holes, position, minX, maxX, minY, maxY]);
  const visibleNPCs = useMemo(() => npcs.filter((n: any) => isVisible(n.x, n.y, n.floor)), [npcs, position, minX, maxX, minY, maxY]);
  const visibleLandPlots = useMemo(() => landPlots.filter(lp => isVisible(lp.x, lp.y, 0)), [landPlots, position, minX, maxX, minY, maxY]);

  // FISHING SPOTS
  const fishingSpots = useMemo(() => [
    { id: 'fish_1', x: 3000, y: 2200, z: 0 },
    { id: 'fish_2', x: 1700, y: 3000, z: 0 },
    { id: 'fish_3', x: 1200, y: 3600, z: 0 }
  ], []);
  const visibleFishingSpots = useMemo(() => fishingSpots.filter(f => isVisible(f.x, f.y, f.z)), [fishingSpots, position, minX, maxX, minY, maxY]);

  // ROPE SPOTS
  const ropeSpots = useMemo(() => [
    { id: 'rope_1', x: 2500, y: 1000, z: -1 },
    { id: 'rope_2', x: 3800, y: 3600, z: -1 },
    { id: 'rope_tavern', x: 2210, y: 2510, z: -1 }
  ], []);

  const visibleRopeSpots = useMemo(() => ropeSpots.filter(r => isVisible(r.x, r.y, r.z)), [ropeSpots, position, minX, maxX, minY, maxY]);
  const isNearRope = position.z === -1 && ropeSpots.some(r => r.z === -1 && Math.hypot(r.x - position.x, r.y - position.y) < 50);

  // TRAVEL TRIGGERS
  const travelPoints = useMemo(() => {
    if (currentMapId === 'HUB_VILA_CENTRAL') {
      return [
        { targetMapId: 'DESERT_INSTANCE', name: 'Deserto das Sombras', reqLevel: 10, x: 4500, y: 2500, z: 0 },
        { targetMapId: 'FROST_ISLAND', name: 'Ilha Gélida', reqLevel: 20, x: 2500, y: 500, z: 0 },
      ];
    } else if (currentMapId === 'DESERT_INSTANCE' || currentMapId === 'FROST_ISLAND') {
      return [
        { targetMapId: 'HUB_VILA_CENTRAL', name: 'Retornar à Vila Central', reqLevel: 1, x: 2500, y: 2500, z: 0 },
      ];
    }
    return [];
  }, [currentMapId]);

  const visibleTravelPoints = useMemo(() => travelPoints.filter(t => isVisible(t.x, t.y, t.z)), [travelPoints, position, minX, maxX, minY, maxY]);
  const nearestTravelPoint = useMemo(() => {
    return travelPoints.find(t => t.z === position.z && Math.hypot(t.x - position.x, t.y - position.y) < 80);
  }, [travelPoints, position]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'f' || e.key === 'F') && isNearRope) {
        interactWithRopeSpot();
      }
      if ((e.key === 'e' || e.key === 'E') && nearestTravelPoint) {
        const playerLevel = useLegacyGameStore.getState().level;
        if (playerLevel >= nearestTravelPoint.reqLevel) {
          useLegacyGameStore.getState().travelToMap(nearestTravelPoint.targetMapId, { x: 2500, y: 2500 });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNearRope, interactWithRopeSpot, nearestTravelPoint]);

  // ESTÉTICA
  const getOverlayClass = () => {
    switch (timeOfDay) {
      case 'sunset': return 'bg-orange-700/15 mix-blend-color-burn';
      case 'night': return 'bg-[#030514]/70 mix-blend-multiply';
      case 'sunrise': return 'bg-pink-500/10 mix-blend-color-dodge';
      default: return 'bg-transparent';
    }
  };

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden bg-[#030508] pointer-events-none select-none ${shakeActive ? 'animate-shake' : ''}`}>
      
      {/* OVERLAY DE VIGNETTE & LUZES (Com borda fade-out suave para o terreno) */}
      <div 
        className={`absolute inset-0 pointer-events-none z-50 transition-colors duration-1000 ${getOverlayClass()}`} 
        style={{ boxShadow: 'inset 0 0 150px 80px rgba(2, 6, 23, 1), inset 0 0 40px 20px rgba(0,0,0,0.9)' }} 
      />

      {/* MAPA PRINCIPAL */}
      <div 
        ref={mapRef}
        className="absolute pointer-events-auto cursor-crosshair transition-transform duration-100 ease-linear"
        style={{
          width: mapConfig.mapSize.width,
          height: mapConfig.mapSize.height,
          backgroundColor: position.z === 0 ? '#0a0d10' : position.z === -1 ? '#020202' : '#0a0d10',
          backgroundImage: position.z === 0 ? `
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            url('/assets/grass.png?v=3'),
            radial-gradient(circle at 50% 0%, #f1f5f9 22%, #94a3b8 45%, transparent 70%),
            radial-gradient(circle at 15% 70%, #16a34a 25%, #14532d 50%, transparent 80%),
            radial-gradient(circle at 80% 65%, #0284c7 20%, #075985 45%, transparent 75%),
            radial-gradient(circle at 50% 50%, #22c55e 30%, #15803d 60%, transparent 90%),
            linear-gradient(to bottom, #15803d, #14532d)
          ` : `url('/assets/rock.png?v=3')`,
          backgroundSize: position.z === 0 ? '40px 40px, 40px 40px, 128px 128px, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%' : '256px 256px',
          backgroundBlendMode: position.z === 0 ? 'normal, normal, overlay, normal, normal, normal, normal, normal' : 'normal',
          boxShadow: position.z === 0 ? 'inset 0 0 200px rgba(0,0,0,0.8), inset 0 0 350px #0c4a6e' : 'inset 0 0 300px rgba(0,0,0,0.95)',
          transformOrigin: '0 0',
          transform: `scale(${zoom}) translate3d(${-cameraX}px, ${-cameraY}px, 0)`
        }}
        onClick={handleMapClick}
      >
        {/* Camada de Escurecimento Dark Fantasy (Por cima da grama) */}
        {position.z === 0 && (
          <div className="absolute inset-0 bg-black/60 mix-blend-multiply pointer-events-none z-0" />
        )}

        {/* TERRENO DO MAPA (Apenas na superfície) */}
        {position.z === 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50 mix-blend-overlay z-0">
            {/* Rio */}
            <path 
              d={mapConfig.riverPath} 
              fill="none" 
              stroke="#0ea5e9" 
              strokeWidth="120" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]"
            />
            {/* Lagos */}
            <circle cx="3800" cy="3100" r="340" fill="#0ea5e9" className="drop-shadow-[0_0_20px_rgba(14,165,233,0.4)]" />
            <circle cx="1300" cy="1400" r="245" fill="#0ea5e9" className="drop-shadow-[0_0_20px_rgba(14,165,233,0.4)]" />
          </svg>
        )}

        {/* === RENDERIZAÇÃO DOS BURACOS === */}
        {visibleHoles.map(hole => (
          <div 
            key={`hole-${hole.x}-${hole.y}`}
            className="absolute flex items-center justify-center opacity-70 drop-shadow-[0_0_10px_black]"
            style={{ left: hole.x - 30, top: hole.y - 30, width: 60, height: 60, zIndex: 0 }}
          >
            <span className="text-3xl filter brightness-50 contrast-125">🕳️</span>
          </div>
        ))}

        {/* === RENDERIZAÇÃO DE FISHING SPOTS === */}
        {visibleFishingSpots.map(fish => {
          const isNear = position.z === 0 && Math.hypot(fish.x - position.x, fish.y - position.y) < 60;
          return (
            <div 
              key={fish.id}
              className={`absolute rounded-full border border-dashed flex items-center justify-center transition-all duration-300 ${isNear ? 'border-cyan-400/50 bg-cyan-400/10 cursor-pointer animate-pulse' : 'border-[#0ea5e9]/20 bg-[#0ea5e9]/5'}`}
              style={{ left: fish.x - 20, top: fish.y - 20, width: 40, height: 40, zIndex: 0 }}
              onClick={(e) => {
                if (isNear) {
                  e.stopPropagation();
                  const inCombat = useCombatStore.getState().activeMonsterId !== null;
                  if (inCombat) {
                    useLegacyGameStore.getState().addFloatingText("⚔️ Você está em combate!", fish.x, fish.y - 30, 'player_damage');
                    return;
                  }
                  useLegacyGameStore.getState().setIsFishing(true);
                  useLegacyGameStore.getState().addFloatingText("🎣 Pescando...", fish.x, fish.y - 30, 'level_up');
                }
              }}
            >
              <span className="text-xl opacity-80 drop-shadow-[0_0_5px_#0ea5e9]">🎣</span>
            </div>
          );
        })}

        {/* === RENDERIZAÇÃO DE ROPE SPOTS === */}
        {visibleRopeSpots.map(rope => (
          <div 
            key={rope.id}
            className="absolute rounded-full border border-dashed border-[#d4af37]/40 bg-[#d4af37]/5 flex items-center justify-center animate-[spin_8s_linear_infinite]"
            style={{ left: rope.x - 25, top: rope.y - 25, width: 50, height: 50, zIndex: 0 }}
          >
            <span className="text-xl opacity-30 drop-shadow-[0_0_5px_#d4af37]">⭕</span>
          </div>
        ))}
        
        {/* === GATILHOS DE VIAGEM === */}
        {visibleTravelPoints.map(tp => (
          <div 
            key={`travel-${tp.targetMapId}`}
            className="absolute flex items-center justify-center cursor-pointer group"
            style={{ left: tp.x - 40, top: tp.y - 40, width: 80, height: 80, zIndex: 10 }}
            onClick={() => {
              const playerLevel = useLegacyGameStore.getState().level;
              if (playerLevel >= tp.reqLevel) {
                useLegacyGameStore.getState().travelToMap(tp.targetMapId, { x: 2500, y: 2500 });
              }
            }}
          >
            <div className="absolute inset-0 border-[2px] border-[#a855f7] rounded-full animate-ping opacity-20" />
            <div className="absolute inset-2 border border-dashed border-[#a855f7]/70 rounded-full animate-spin-slow bg-[#a855f7]/10 flex items-center justify-center">
              <span className="text-2xl drop-shadow-[0_0_10px_#a855f7]">🌀</span>
            </div>
            
            {/* Visual Barrier Extension */}
            <PortalBarrier x={tp.x} y={tp.y} reqLevel={tp.reqLevel} />

            {/* Tooltip Hover/Near */}
            <div className="absolute -top-12 whitespace-nowrap bg-[#0a0d14]/90 border border-purple-900/50 px-3 py-1.5 rounded-sm shadow-xl flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-widest">{tp.name}</span>
              <span className={`text-[9px] font-mono mt-0.5 ${useLegacyGameStore.getState().level >= tp.reqLevel ? 'text-emerald-500' : 'text-rose-500'}`}>
                {useLegacyGameStore.getState().level >= tp.reqLevel ? `[E] Viajar` : `[Bloqueado - Requer Nível ${tp.reqLevel}]`}
              </span>
            </div>
          </div>
        ))}
        
        {/* === Y-SORTING ENTIDADES (Camada 2.5D) === */}
        {/* Nodes passivos/outros */}
        {visibleOtherPlots.map((plot: any) => (
          <div key={plot.id} style={{ position: 'absolute', left: 0, top: 0, zIndex: Math.floor(plot.y) }}><OtherPlotNode plot={plot} /></div>
        ))}
        {/* Land Plots (New System) */}
        {visibleLandPlots.map((lp) => (
          <div key={lp.id} style={{ position: 'absolute', left: 0, top: 0, zIndex: Math.floor(lp.y) }}><LandPlotNode plot={lp} /></div>
        ))}
        {visiblePlots.map((plot: any) => (
          <div key={plot.id} style={{ position: 'absolute', left: 0, top: 0, zIndex: Math.floor(plot.y) }}><PlotNode plot={plot} /></div>
        ))}
        
        {position.z === 0 && <CityNode />}
        {position.z === 0 && <WaystoneNode mapId={useLegacyGameStore.getState().currentMapId} x={2400} y={2400} />}
        
        {/* BOUNTY BOARD NODE */}
        {position.z === 0 && (
          <div 
            className="absolute flex flex-col items-center justify-center cursor-pointer group"
            style={{ left: 2320 - 30, top: 2450 - 30, width: 60, height: 60, zIndex: Math.floor(2450) }}
            onClick={(e) => {
              e.stopPropagation();
              const { useBountyStore } = require('@/stores/bountyStore');
              useBountyStore.getState().setIsOpen(true);
            }}
          >
            <div className="relative text-3xl drop-shadow-[0_0_8px_rgba(255,0,0,0.5)] group-hover:scale-110 transition-transform">
              📜
              <div className="absolute -top-1 -right-1 text-red-500 text-sm animate-pulse">🔪</div>
            </div>
            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950/90 border border-red-900/50 text-red-400 font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded whitespace-nowrap shadow-xl">
              Quadro de Caçadas
            </div>
          </div>
        )}
        
        {/* Entidades dinâmicas */}
        {visibleNPCs.map((npc: any) => (
          <div key={npc.id} style={{ position: 'absolute', left: 0, top: 0, zIndex: Math.floor(npc.y) }}><NPCNode npc={npc} /></div>
        ))}
        {visibleNodes.map((node: any) => (
          <div key={node.id} style={{ position: 'absolute', left: 0, top: 0, zIndex: Math.floor(node.y) }}><ResourceNode node={node} /></div>
        ))}
        {visibleMonsters.map((monster: any) => (
          <div key={monster.id} style={{ position: 'absolute', left: 0, top: 0, zIndex: Math.floor(monster.y) }}><MonsterNode monster={monster} /></div>
        ))}
        {visibleOtherPlayers.map((player: any) => (
          <div key={player.id} style={{ position: 'absolute', left: 0, top: 0, zIndex: Math.floor(player.y) }}><OtherPlayerNode player={player} /></div>
        ))}
        
        {position.z === 0 && <WorldBossNode />}
        {position.z === 0 && <CaravanNode />}

        {/* JOGADOR PRINCIPAL */}
        <div style={{ position: 'absolute', left: 0, top: 0, zIndex: Math.floor(position.y) }}>
          <Character />
        </div>

        {/* EFEITOS E TEXTOS FLUTUANTES (Z-index altíssimo) */}
        <FloatingTextEngine />

        {/* FISHING FLOAT (Boia) */}
        {isFishing && (
          <div 
            className="absolute pointer-events-none animate-bounce"
            style={{
              left: position.x + 20,
              top: position.y - 10,
              zIndex: Math.floor(position.y) + 1
            }}
          >
            <span className="text-sm drop-shadow-[0_0_5px_rgba(255,0,0,0.8)] filter brightness-150">🔴</span>
          </div>
        )}
      </div>

      {/* OVERLAY INTERATIVO (Rope Spot Hover) */}
      <AnimatePresence>
        {isNearRope && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto z-50"
          >
            <button 
              onClick={interactWithRopeSpot}
              className="bg-[#050507]/95 backdrop-blur-md border border-[#d4af37]/40 text-[#d4af37] px-8 py-2.5 rounded-full font-serif text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:bg-[#1a1811] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all duration-300 flex items-center gap-3 group"
            >
              <span>Usar Corda</span>
              <span className="bg-black border border-[#d4af37]/30 text-white rounded px-2 py-0.5 text-[10px] font-mono group-hover:bg-[#d4af37] group-hover:text-black transition-colors">F</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
