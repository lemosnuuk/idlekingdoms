"use client";

import React, { useState, useEffect } from "react";
import { useMarketStore } from "@/stores/marketStore";
import { useInventoryStore } from "@/stores/inventoryStore";
import { X, TrendingUp, TrendingDown, Coins, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Sparkline Nativo em SVG (Sem libs externas)
const Sparkline = ({ data }: { data: number[] }) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 4;
  const width = 100;
  const height = 24;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((val - min) / range) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(' ');

  const isUp = data[data.length - 1] >= data[0];
  const color = isUp ? '#10b981' : '#f43f5e';

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 2px 4px ${color}40)` }}
      />
    </svg>
  );
};

export default function MarketPanel() {
  const { isOpen, toggleMarket, prices, basePrices, history, activeEvent, eventDuration, eventNotification, buyResource, sellResource } = useMarketStore();
  const inventoryItems = useInventoryStore(state => state.items);
  const gold = useInventoryStore(state => state.gold);

  // Atualiza histórico quando os preços oscilam (já tratado pela store)
  // marketStore já mantém o histórico!
  // Mas para não quebrar a lógica de UI, vamos mapear o history da marketStore
  const histWood = history.wood;
  const histStone = history.stone;
  const histIron = history.iron_ore;

  // Timer do Evento Global
  const [timeLeft, setTimeLeft] = useState<number>(0);
  useEffect(() => {
    // Na marketStore, eventDuration é em ticks (cada tick é 10s base ou algo similar)
    // Vamos assumir eventDuration * 10s por tick aproximado se quisermos contar em segundos
    // Mas a store diz "lasts 12 ticks"
    setTimeLeft(eventDuration * 10);
  }, [eventDuration]);

  // Auxiliares de formatação de tempo
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const commoditiesList = [
    { id: 'wood' as const, name: 'Madeira', currentPrice: prices.wood, basePrice: basePrices.wood, hist: histWood },
    { id: 'stone' as const, name: 'Pedra', currentPrice: prices.stone, basePrice: basePrices.stone, hist: histStone },
    { id: 'iron_ore' as const, name: 'Ferro', currentPrice: prices.iron_ore, basePrice: basePrices.iron_ore, hist: histIron },
  ];

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
          <div className="w-96 h-full bg-[#030304]/98 border-l border-[#ffffff]/5 backdrop-blur-xl shadow-2xl flex flex-col font-sans text-slate-300">
            
            {/* CABEÇALHO */}
            <div className="flex justify-between items-center p-5 border-b border-[#ffffff]/5 bg-black/40">
              <div className="flex items-center gap-3">
                <Coins className="text-[#d4af37]" size={18} />
                <h2 className="font-serif font-bold text-sm text-[#d4af37] uppercase tracking-[0.2em]">Mercado Real</h2>
              </div>
              <button onClick={toggleMarket} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-6 scrollbar-hide">
              
              {/* SALDO DO JOGADOR */}
              <div className="bg-[#08080a] border border-[#ffffff]/5 rounded p-4 flex justify-between items-center shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Seu Ouro</span>
                <span className="text-sm font-mono text-[#d4af37] font-bold">{gold.toLocaleString()}g</span>
              </div>

              {/* EVENTO MACROECONÔMICO */}
              {activeEvent !== 'none' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded border border-indigo-500/30 bg-indigo-950/20 p-4 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.2)_0%,_transparent_70%)] pointer-events-none" />
                  <div className="relative z-10 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} className="text-indigo-400 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Evento Ativo</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-serif text-white uppercase">{
                        activeEvent === 'winter' ? 'Inverno Rigoroso' : 
                        activeEvent === 'volcano' ? 'Atividade Vulcânica' : 
                        activeEvent === 'pirates' ? 'Ataque de Piratas' : activeEvent
                      }</span>
                      <span className="text-[10px] font-mono text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded bg-black/50">
                        Restam {eventDuration} ciclos
                      </span>
                    </div>
                    {eventNotification && (
                      <p className="text-[9px] font-mono text-slate-400 mt-1">
                        {eventNotification}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* LISTA DE COMMODITIES */}
              <div className="space-y-3">
                {commoditiesList.map(item => {
                  const hasStock = inventoryItems.find(i => i.itemId === item.id)?.quantity || 0;
                  const isUp = item.currentPrice >= item.basePrice;

                  return (
                    <div key={item.id} className="bg-[#08080a] border border-[#ffffff]/5 rounded p-4 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)] flex flex-col gap-4">
                      
                      {/* TOPO: Nome e Preço */}
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">{item.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono mt-0.5">Em estoque: {hasStock}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-mono text-white">{item.currentPrice}g</span>
                            {isUp ? <TrendingUp size={12} className="text-emerald-500" /> : <TrendingDown size={12} className="text-rose-500" />}
                          </div>
                          <span className="text-[9px] text-slate-500 font-mono mt-0.5">Base: {item.basePrice.toFixed(1)}g</span>
                        </div>
                      </div>

                      {/* MEIO: Gráfico Sparkline */}
                      <div className="flex items-center justify-between bg-[#030304] border border-[#ffffff]/5 rounded p-2 h-10 overflow-hidden">
                        <span className="text-[8px] font-mono text-slate-600 tracking-widest rotate-180" style={{ writingMode: 'vertical-rl' }}>HISTÓRICO</span>
                        <Sparkline data={item.hist} />
                      </div>

                      {/* BASE: Botões de Ação */}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => buyResource(item.id, 10)}
                          disabled={gold < item.currentPrice * 10}
                          className="flex-1 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider py-2 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Comprar 10
                        </button>
                        <button 
                          onClick={() => sellResource(item.id, hasStock)}
                          disabled={hasStock === 0}
                          className="flex-1 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider py-2 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Vender Tudo
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
