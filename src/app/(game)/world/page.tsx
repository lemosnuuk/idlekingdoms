"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
const MapRenderer = dynamic(() => import("@/components/world/MapRenderer"), { ssr: false });
import Minimap from "@/components/world/Minimap";
import { User, Swords, Pickaxe, Settings, Package, Bot, Castle, Map as MapIcon, Shield, Sliders, ScrollText, Crown, Anchor, LogIn, LogOut, Cloud, CloudOff } from "lucide-react";
import AuthModal from "@/components/ui/AuthModal";
import { useSyncEngine, hydrateFromPayload, GameStatePayload } from "@/hooks/useSyncEngine";
import InventoryPanel from "@/components/ui/InventoryPanel";
import TacticsPanel from "@/components/ui/TacticsPanel";
import QuestLogPanel from "@/components/ui/QuestLogPanel";
import AutomationPanel from "@/components/ui/AutomationPanel";
import MarketPanel from "@/components/ui/MarketPanel";
import ForgePanel from "@/components/ui/ForgePanel";
import ConstructionPanel from "@/components/ui/ConstructionPanel";
import WorkersPanel from "@/components/ui/WorkersPanel";
import CombatPanel from "@/components/ui/CombatPanel";
import LogisticsPanel from "@/components/ui/LogisticsPanel";
import AlliancePanel from "@/components/ui/AlliancePanel";
import QuestTracker from "@/components/ui/QuestTracker";
import DeathOverlay from "@/components/ui/DeathOverlay";
import CombatTickHUD from "@/components/ui/CombatTickHUD";
import InfrastructurePanel from "@/components/ui/InfrastructurePanel";
import WaystonePanel from "@/components/ui/WaystonePanel";
import TutorialQuestPanel from "@/components/ui/TutorialQuestPanel";
import { VillageTrophiesPanel } from "@/components/ui/VillageTrophiesPanel";
import { BountyBoardPanel } from "@/components/ui/BountyBoardPanel";
import { GuildContractsPanel } from "@/components/ui/GuildContractsPanel";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useAutomationStore } from "@/stores/automationStore";
import { useMarketStore } from "@/stores/marketStore";
import { useCraftingStore } from "@/stores/craftingStore";
import { useHousingStore } from "@/stores/housingStore";
import { useWorkerStore } from "@/stores/workerStore";
import { useQuestStore } from "@/stores/questStore";
import { useGuildStore } from "@/stores/guildStore";
import { useCombatEngine } from "@/hooks/useCombatEngine";
import { useZoneDirector } from "@/hooks/useZoneDirector";
import { useStatusEffectsEngine } from "@/hooks/useStatusEffectsEngine";
import { useAutomationEngine } from "@/hooks/useAutomationEngine";
import { useEconomyEngine } from "@/hooks/useEconomyEngine";
import { useWorldBossDirector } from "@/hooks/useWorldBossDirector";
import { useCombatStore } from "@/stores/combatStore";
import { useLogisticsStore } from "@/stores/logisticsStore";
import { useMultiplayerStore } from "@/stores/multiplayerStore";
import { useGameStore } from "@/stores/gameStore";
import { useAnalyticsStore } from "@/stores/analyticsStore";
import { isSupabaseConfigured, supabase, getLocalCharacterId } from "@/lib/supabaseClient";

export default function WorldPage() {
  useCombatEngine();
  useZoneDirector();
  useStatusEffectsEngine();
  useAutomationEngine();
  useEconomyEngine();
  useWorldBossDirector();
  const syncStatus = useSyncEngine();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authUser, setAuthUser] = useState<{ id: string; email?: string } | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setAuthUser({ id: user.id, email: user.email ?? undefined });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setAuthUser({ id: session.user.id, email: session.user.email ?? undefined });
        // On login, try to load cloud data
        const { data: profile } = await supabase
          .from('player_profiles')
          .select('game_state')
          .eq('id', session.user.id)
          .single();
        if (profile?.game_state) {
          hydrateFromPayload(profile.game_state as unknown as GameStatePayload);
        }
      } else {
        setAuthUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
  };

  // Motor da Economia do Mercado
  useEffect(() => {
    const marketInterval = setInterval(() => {
      useMarketStore.getState().tickMarket();
    }, 10000);
    return () => clearInterval(marketInterval);
  }, []);

  const [isTacticsOpen, setIsTacticsOpen] = useState(false);
  const { toggleInventory, gold } = useInventoryStore();
  const { toggleAutomationPanel } = useAutomationStore();
  const { toggleMarket } = useMarketStore();
  const { toggleCrafting } = useCraftingStore();
  const { toggleConstructionMode, isConstructionMode } = useHousingStore();
  const { toggleWorkers } = useWorkerStore();
  const { toggleCombatPanel } = useCombatStore();
  const toggleLogistics = () => useLogisticsStore.getState().toggleLogistics();
  const toggleAlliancePanel = () => useMultiplayerStore.getState().setAlliancePanelOpen(!useMultiplayerStore.getState().isAlliancePanelOpen);
  const toggleGuildContracts = () => useGuildStore.getState().setIsOpen(!useGuildStore.getState().isOpen);
  const { toggleQuestLog } = useQuestStore();
  const { 
    hp, maxHp, characterPosition, currentMapId, timeOfDay, level, experience, 
    inventory, statusEffects, mana, maxMana, isFishing, currentFloor, isTraining, 
    vocation, playerName
  } = useGameStore();
  const { toggleAnalytics } = useAnalyticsStore();

  const equippedDamage = inventory.filter(i => i.equipped).reduce((acc, i) => acc + (i.damage || 0), 0);
  const equippedDefense = inventory.filter(i => i.equipped).reduce((acc, i) => acc + (i.defense || 0), 0);

  const { eventNotification, clearNotification } = useMarketStore();
  const [activeBanner, setActiveBanner] = useState<string | null>(null);

  useEffect(() => {
    if (eventNotification) {
      setActiveBanner(eventNotification);
      const timer = setTimeout(() => {
        setActiveBanner(null);
        clearNotification();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [eventNotification, clearNotification]);

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeBackData, setWelcomeBackData] = useState<{
    elapsedSeconds: number;
    woodGained: number;
    stoneGained: number;
    ironGained: number;
    goldConsumed: number;
    pausedEarly: boolean;
  } | null>(null);

  // Load cloud/offline data and calculate offline progress
  useEffect(() => {
    const initializeLoadAndOffline = async () => {
      const charId = getLocalCharacterId();
      if (!charId) return;

      let loadedGold = 100;
      let loadedOwnedPlotIds: string[] = [];
      let loadedBuildings: any[] = [];
      let loadedWorkers: any[] = [];

      if (isSupabaseConfigured) {
        try {
          // 1. Hydrate the core game state from the single JSONB source of truth
          const { data: profile } = await supabase
            .from('player_profiles')
            .select('game_state')
            .eq('id', charId)
            .single();
            
          if (profile?.game_state) {
            hydrateFromPayload(profile.game_state as unknown as GameStatePayload);
          }

          // 2. Load plots and buildings from legacy tables
          const { data: plotsData } = await supabase.from('plots').select('*').eq('owner_id', charId);
          if (plotsData) {
            loadedOwnedPlotIds = plotsData.map(p => p.id);
            const { data: buildingsData } = await supabase.from('buildings').select('*').in('plot_id', loadedOwnedPlotIds);
            if (buildingsData) {
              loadedBuildings = buildingsData.map(b => ({
                id: b.id,
                plotId: b.plot_id,
                type: b.type
              }));
            }
          }
          
        } catch (err) {
          console.warn("Error loading from Supabase, falling back to LocalStorage:", err);
          loadedOwnedPlotIds = JSON.parse(localStorage.getItem('kingdoms_owned_plots') || '[]');
          loadedBuildings = JSON.parse(localStorage.getItem('kingdoms_buildings') || '[]');
        }
      } else {
        // Fallback load
        loadedOwnedPlotIds = JSON.parse(localStorage.getItem('kingdoms_owned_plots') || '[]');
        loadedBuildings = JSON.parse(localStorage.getItem('kingdoms_buildings') || '[]');
      }

      // Grab values directly from hydrated stores for offline calculations
      loadedGold = useInventoryStore.getState().gold;
      loadedWorkers = useWorkerStore.getState().workers;
      
      const initialPlots = useHousingStore.getState().plots;
      const updatedPlots = initialPlots.map(p => 
        loadedOwnedPlotIds.includes(p.id) ? { ...p, isOwned: true } : p
      );
      useHousingStore.setState({ plots: updatedPlots, buildings: loadedBuildings });

      const loadedWaystones = JSON.parse(localStorage.getItem('kingdoms_waystones') || '{"progressByMap": {}, "unlockedMaps": []}');
      require('@/stores/waystoneStore').useWaystoneStore.setState(loadedWaystones);

      // Calculate offline progress
      const logoutTimeStr = localStorage.getItem('kingdoms_logout_time');
      if (logoutTimeStr) {
        const logoutTime = parseInt(logoutTimeStr);
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - logoutTime) / 1000);
        
        if (elapsedSeconds >= 5) {
          const activeWorkers = loadedWorkers.filter(w => w.assignedPlotId);
          const numWorkers = activeWorkers.length;
          if (numWorkers > 0) {
            const cycles = Math.floor(elapsedSeconds / 5);
            const numLumberjacks = activeWorkers.filter(w => w.type === 'lumberjack').length;
            const numMiners = activeWorkers.filter(w => w.type === 'miner').length;
            const costPerCycle = numWorkers;
            
            const maxAffordableCycles = costPerCycle > 0 ? Math.floor(loadedGold / costPerCycle) : Infinity;
            const activeCycles = Math.min(cycles, maxAffordableCycles);
            
            const goldConsumed = activeCycles * costPerCycle;
            const woodGained = numLumberjacks * activeCycles;
            const stoneGained = numMiners * activeCycles;
            const ironGained = Math.floor(numMiners * activeCycles * 0.3); // 30% chance of iron ore
            
            if (goldConsumed > 0) {
              useInventoryStore.getState().removeGold(goldConsumed);
            }
            if (woodGained > 0) {
              useInventoryStore.getState().addItem('wood', woodGained);
            }
            if (stoneGained > 0) {
              useInventoryStore.getState().addItem('stone', stoneGained);
            }
            if (ironGained > 0) {
              useInventoryStore.getState().addItem('iron_ore', ironGained);
            }

            setWelcomeBackData({
              elapsedSeconds,
              woodGained,
              stoneGained,
              ironGained,
              goldConsumed,
              pausedEarly: activeCycles < cycles
            });
            setShowWelcomeModal(true);
          }
        }
      }

      localStorage.setItem('kingdoms_logout_time', Date.now().toString());
    };

    initializeLoadAndOffline();
  }, []);

  const [goldPopups, setGoldPopups] = useState<{id: number, amount: number}[]>([]);
  const [prevGold, setPrevGold] = useState(gold);

  useEffect(() => {
    if (gold > prevGold) {
      const diff = gold - prevGold;
      const id = Date.now();
      setGoldPopups(prev => [...prev, { id, amount: diff }]);
      setTimeout(() => {
        setGoldPopups(prev => prev.filter(p => p.id !== id));
      }, 2000);
    }
    setPrevGold(gold);
  }, [gold, prevGold]);

  return (
    <main className="flex w-full h-screen overflow-hidden bg-black selection:bg-fantasy-accent/30 relative">
      
      {/* Left Sidebars */}
      <div className="flex-shrink-0 flex h-full z-40 pointer-events-none">
        <InfrastructurePanel />
        <LogisticsPanel />
        <AutomationPanel />
        <ConstructionPanel />
        <GuildContractsPanel />
      </div>

      {/* Center Map Area */}
      <div className="flex-1 relative h-full flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-5xl h-full max-h-[600px] min-h-[400px] overflow-hidden relative rounded-xl border border-slate-800 bg-slate-950 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <MapRenderer />
        </div>

        {/* HUD Overlay (Top & Bottom Bars) */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
          <QuestTracker />
          
          {/* Top Bar: Player Stats */}
          <header className="flex justify-between items-start pointer-events-auto">
              <div className="flex gap-4 items-center bg-fantasy-card/90 backdrop-blur-sm border border-fantasy-border p-3 rounded-lg shadow-xl pointer-events-auto cursor-pointer hover:border-fantasy-accent transition-colors" onClick={toggleWorkers}>
                <div className="w-12 h-12 rounded-full bg-fantasy-darker border-2 border-fantasy-accent flex items-center justify-center">
                  <User className="text-fantasy-accent" size={24} />
                </div>
              <div>
                <h1 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                  {playerName}
                  {equippedDamage > 0 && <span className="text-[10px] bg-red-950/50 border border-red-900/50 text-red-400 px-1.5 py-0.5 rounded shadow font-mono font-bold">Dano +{equippedDamage}</span>}
                  {equippedDefense > 0 && <span className="text-[10px] bg-slate-800/50 border border-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded shadow font-mono font-bold">Def +{equippedDefense}</span>}
                  {authUser ? (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 ${
                      syncStatus === 'saving' ? 'text-yellow-400 bg-yellow-950/60 border border-yellow-800/40' :
                      syncStatus === 'saved' ? 'text-green-400 bg-green-950/60 border border-green-800/40' :
                      syncStatus === 'error' ? 'text-red-400 bg-red-950/60 border border-red-800/40' :
                      'text-green-400 bg-green-950/60 border border-green-800/40'
                    }`}>
                      <Cloud size={10} />
                      {syncStatus === 'saving' ? 'Salvando...' :
                       syncStatus === 'saved' ? 'Salvo ☁️' :
                       syncStatus === 'error' ? 'Erro sync' :
                       authUser.email?.split('@')[0] ?? 'Nuvem'}
                    </span>
                  ) : (
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="text-[9px] text-[#d4af37] font-bold bg-[#d4af37]/10 border border-[#d4af37]/30 px-1.5 py-0.5 rounded shadow hover:bg-[#d4af37]/20 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <LogIn size={10} /> Entrar
                    </button>
                  )}
                </h1>
                <div className="flex items-center gap-2 text-sm text-fantasy-text-muted relative">
                  <span>Lvl {level}</span>
                  <span className="w-1 h-1 rounded-full bg-fantasy-text-muted" />
                  <span className="text-cyan-400 font-bold">Andar {currentFloor}</span>
                  <span className="w-1 h-1 rounded-full bg-fantasy-text-muted" />
                  <span className="text-fantasy-accent font-bold">{gold} Gold</span>
                  
                  <AnimatePresence>
                    {goldPopups.map(popup => (
                      <motion.span
                        key={popup.id}
                        initial={{ opacity: 1, y: 0, scale: 0.5 }}
                        animate={{ opacity: 0, y: -20, scale: 1.2 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute left-16 text-yellow-400 font-bold drop-shadow-md text-xs pointer-events-none"
                      >
                        +{popup.amount}
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
                {/* HP Bar */}
                <div className="w-32 h-2 bg-fantasy-darker rounded-full mt-1 overflow-hidden border border-fantasy-border">
                  <div className="h-full bg-fantasy-danger transition-all" style={{ width: `${(hp / maxHp) * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Auth / Logout button */}
            <div className="flex items-start gap-3">
              {authUser && (
                <button
                  onClick={handleLogout}
                  title="Sair da conta"
                  className="w-10 h-10 rounded-lg bg-red-950/30 hover:bg-red-900/50 border border-red-800/30 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors pointer-events-auto"
                >
                  <LogOut size={16} />
                </button>
              )}
              <Minimap />
            </div>
          </header>

          {/* Bottom Bar: Quick Actions / Professions */}
          <footer className="flex justify-center pointer-events-auto mb-4">
            <div className="flex gap-2 bg-fantasy-card/90 backdrop-blur-md border border-fantasy-border p-2 rounded-xl shadow-2xl">
              <button 
                onClick={toggleQuestLog}
                title="Missões e Conquistas"
                className="w-12 h-12 rounded-lg bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <ScrollText size={20} />
              </button>
              <button 
                onClick={toggleAlliancePanel}
                title="Alianças e Ranking"
                className="w-12 h-12 rounded-lg bg-indigo-900/50 hover:bg-indigo-800/80 border border-indigo-500/50 flex items-center justify-center text-indigo-300 hover:text-indigo-100 transition-colors"
              >
                <Shield size={20} />
              </button>
              <button 
                onClick={toggleGuildContracts}
                title="Guild HQ (Corporação B2B)"
                className="w-12 h-12 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Anchor size={20} />
              </button>
              <div className="w-px h-8 bg-fantasy-border self-center mx-1" />
              <button 
                onClick={toggleAnalytics}
                title="Analytics & Expedições da Coroa"
                className="w-12 h-12 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Crown size={20} />
              </button>
              <button 
                onClick={toggleLogistics}
                title="Logística e Caravanas"
                className="w-12 h-12 rounded-lg bg-fantasy-darker hover:bg-fantasy-card-hover border border-fantasy-border flex items-center justify-center text-fantasy-text hover:text-fantasy-accent transition-colors"
              >
                <MapIcon size={20} />
              </button>
              <button 
                onClick={toggleCombatPanel}
                title="Combate e Monstros"
                className="w-12 h-12 rounded-lg bg-fantasy-darker hover:bg-fantasy-card-hover border border-fantasy-border flex items-center justify-center text-fantasy-text hover:text-fantasy-danger transition-colors"
              >
                <Swords size={20} />
              </button>
              <button 
                onClick={toggleCrafting}
                title="Crafting (Picareta)"
                className="w-12 h-12 rounded-lg bg-fantasy-darker hover:bg-fantasy-card-hover border border-fantasy-border flex items-center justify-center text-fantasy-text hover:text-fantasy-accent transition-colors"
              >
                <Pickaxe size={20} />
              </button>
              <button 
                onClick={toggleInventory}
                title="Inventário"
                className="w-12 h-12 rounded-lg bg-fantasy-darker hover:bg-fantasy-card-hover border border-fantasy-border flex items-center justify-center text-fantasy-text hover:text-fantasy-accent transition-colors"
              >
                <Package size={20} />
              </button>
              <button 
                onClick={toggleAutomationPanel}
                title="Automação (Bot)"
                className="w-12 h-12 rounded-lg bg-fantasy-darker hover:bg-fantasy-card-hover border border-fantasy-border flex items-center justify-center text-fantasy-text hover:text-fantasy-accent transition-colors"
              >
                <Bot size={20} />
              </button>
              <div className="w-px h-8 bg-fantasy-border self-center mx-2" />
              <button 
                onClick={toggleConstructionMode}
                title="Construção"
                className={`w-12 h-12 rounded-lg border flex items-center justify-center transition-colors ${
                  isConstructionMode 
                    ? 'bg-fantasy-accent/20 border-fantasy-accent text-fantasy-accent drop-shadow-[0_0_10px_rgba(196,154,69,0.5)]' 
                    : 'bg-fantasy-darker hover:bg-fantasy-card-hover border-fantasy-border text-fantasy-text hover:text-fantasy-accent'
                }`}
              >
                <Castle size={20} />
              </button>
              <button 
                onClick={toggleMarket}
                title="Mercado Local"
                className="w-12 h-12 rounded-lg bg-fantasy-darker hover:bg-fantasy-card-hover border border-fantasy-border flex items-center justify-center text-fantasy-text hover:text-fantasy-accent transition-colors"
              >
                <Settings size={20} />
              </button>
              <div className="w-px h-8 bg-fantasy-border self-center mx-2" />
              <button 
                onClick={() => setIsTacticsOpen(!isTacticsOpen)}
                title="Táticas (IA Gambit)"
                className={`w-12 h-12 rounded-lg border flex items-center justify-center transition-colors ${
                  isTacticsOpen 
                    ? 'bg-fantasy-accent/20 border-fantasy-accent text-fantasy-accent drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]' 
                    : 'bg-fantasy-darker hover:bg-fantasy-card-hover border-fantasy-border text-fantasy-text hover:text-fantasy-accent'
                }`}
              >
                <Sliders size={20} />
              </button>
            </div>
          </footer>
        </div>
      </div>

      {/* Right Sidebars */}
      <div className="flex-shrink-0 flex flex-row-reverse h-full z-40 pointer-events-none">
        <VillageTrophiesPanel />
        <InventoryPanel />
        <ForgePanel />
        <TacticsPanel isOpen={isTacticsOpen} onClose={() => setIsTacticsOpen(false)} />
        <MarketPanel />
        <WorkersPanel />
        <CombatPanel />
        <AlliancePanel />
        <QuestLogPanel />
        <BountyBoardPanel />
      </div>

      {/* Welcome Back / Offline Progress Modal */}
      <AnimatePresence>
        {showWelcomeModal && welcomeBackData && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[100] pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-[450px] bg-fantasy-card border-2 border-fantasy-accent p-6 rounded-xl shadow-2xl relative text-center"
            >
              <h2 className="text-xl font-serif font-extrabold text-fantasy-accent mb-4 tracking-wider uppercase">
                ⚔️ Bem-vindo de volta! ⚔️
              </h2>
              
              <p className="text-sm text-fantasy-text mb-6">
                Você ficou fora por <span className="font-bold text-white">{Math.floor(welcomeBackData.elapsedSeconds / 60)}m {welcomeBackData.elapsedSeconds % 60}s</span>.
                Aqui está o resumo do trabalho de seus súditos durante o período offline:
              </p>

              <div className="bg-black/60 rounded-lg p-4 border border-fantasy-border space-y-3 text-left mb-6 font-serif">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-fantasy-success flex items-center gap-1.5">🪵 Madeiras Coletadas</span>
                  <span className="font-bold text-white">+{welcomeBackData.woodGained}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 flex items-center gap-1.5">🪨 Pedras Coletadas</span>
                  <span className="font-bold text-white">+{welcomeBackData.stoneGained}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-cyan-400 flex items-center gap-1.5">🔩 Ferros Coletados</span>
                  <span className="font-bold text-white">+{welcomeBackData.ironGained}</span>
                </div>
                <div className="h-px bg-fantasy-border my-2" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-yellow-400 flex items-center gap-1.5">🪙 Ouro Pago (Salários)</span>
                  <span className="font-bold text-red-400">-{welcomeBackData.goldConsumed} Gold</span>
                </div>
              </div>

              {welcomeBackData.pausedEarly && (
                <div className="bg-red-950/40 border border-red-800/50 text-red-300 p-3 rounded-lg text-xs text-left mb-6 leading-relaxed">
                  ⚠️ <strong>Alerta de Saldo:</strong> Seu ouro acabou antes do final do período offline. Os trabalhadores pausaram a coleta de recursos imediatamente para evitar dívidas.
                </div>
              )}

              <button
                onClick={() => setShowWelcomeModal(false)}
                className="w-full bg-fantasy-accent hover:bg-yellow-600 active:scale-95 text-black font-bold py-2 rounded-lg transition-all text-sm font-serif shadow-lg border-b-4 border-yellow-700"
              >
                Continuar Jornada
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Global Event Banner Notification */}
      <AnimatePresence>
        {activeBanner && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 bg-fantasy-card/95 border border-fantasy-accent/80 px-6 py-3 rounded-lg shadow-2xl z-50 pointer-events-auto flex items-center gap-3 backdrop-blur-md"
          >
            <span className="text-sm font-serif font-bold text-white whitespace-nowrap">
              {activeBanner}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <CombatTickHUD />
      <DeathOverlay />
      <WaystonePanel />
      <TutorialQuestPanel />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </main>
  );
}
