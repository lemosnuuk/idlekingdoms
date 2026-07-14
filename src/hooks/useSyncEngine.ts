import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { useAutomationStore } from '@/stores/automationStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

// ─── Types ──────────────────────────────────────────────────

export interface GameStatePayload {
  playerName: string;
  characterPosition: { x: number; y: number };
  currentFloor: number;
  currentMapId: string;
  level: number;
  experience: number;
  hp: number;
  maxHp: number;
  skills: any; // PlayerSkills — uses `any` to avoid structural TS mismatch with Record
  vocation: string;
  inventory: { items: { itemId: string; quantity: number }[]; gold: number };
  automation: { rules: { id: string; condition: string; action: string }[]; isActive: boolean };
  gambitPotionThreshold: number;
  gambitExoriEnabled: boolean;
  equipmentInventory: any[];
  timeOfDay: string;
}

// ─── Snapshot Builder ───────────────────────────────────────

/** Collects the essential state from all stores into a single JSONB-ready object. */
export function buildGameStateSnapshot(): GameStatePayload {
  const game = useGameStore.getState();
  const inv = useInventoryStore.getState();
  const auto = useAutomationStore.getState();

  return {
    playerName: game.playerName,
    characterPosition: game.characterPosition,
    currentFloor: game.currentFloor,
    currentMapId: game.currentMapId,
    level: game.level,
    experience: game.experience,
    hp: game.hp,
    maxHp: game.maxHp,
    skills: game.skills,
    vocation: game.vocation,
    inventory: { items: inv.items, gold: inv.gold },
    automation: { rules: auto.rules, isActive: auto.isActive },
    gambitPotionThreshold: game.gambitPotionThreshold,
    gambitExoriEnabled: game.gambitExoriEnabled,
    equipmentInventory: game.inventory,
    timeOfDay: game.timeOfDay,
  };
}

// ─── Re-Hydrate ─────────────────────────────────────────────

/** Loads a GameStatePayload into the Zustand stores (cloud → memory). */
export function hydrateFromPayload(payload: GameStatePayload) {
  if (!payload) return;

  // Game Store
  const gameUpdates: any = {};
  if (payload.playerName) gameUpdates.playerName = payload.playerName;
  if (payload.characterPosition) gameUpdates.characterPosition = payload.characterPosition;
  if (payload.currentFloor !== undefined) gameUpdates.currentFloor = payload.currentFloor;
  if (payload.currentMapId) gameUpdates.currentMapId = payload.currentMapId;
  if (payload.level !== undefined) gameUpdates.level = payload.level;
  if (payload.experience !== undefined) gameUpdates.experience = payload.experience;
  if (payload.hp !== undefined) gameUpdates.hp = payload.hp;
  if (payload.maxHp !== undefined) gameUpdates.maxHp = payload.maxHp;
  if (payload.skills) gameUpdates.skills = payload.skills;
  if (payload.vocation) gameUpdates.vocation = payload.vocation;
  if (payload.gambitPotionThreshold !== undefined) gameUpdates.gambitPotionThreshold = payload.gambitPotionThreshold;
  if (payload.gambitExoriEnabled !== undefined) gameUpdates.gambitExoriEnabled = payload.gambitExoriEnabled;
  if (payload.equipmentInventory) gameUpdates.inventory = payload.equipmentInventory;
  if (payload.timeOfDay) gameUpdates.timeOfDay = payload.timeOfDay;
  
  useGameStore.setState(gameUpdates);

  // Inventory Store
  if (payload.inventory) {
    useInventoryStore.setState({
      items: payload.inventory.items || [],
      gold: payload.inventory.gold ?? 100,
    });
  }

  // Automation Store
  if (payload.automation) {
    useAutomationStore.setState({
      rules: payload.automation.rules || [],
      isActive: payload.automation.isActive ?? false,
    });
  }
}

// ─── Sync Engine Hook ───────────────────────────────────────

const DEBOUNCE_MS = 12000; // 12 seconds

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * useSyncEngine — Auto-saves game state to Supabase with debounce.
 * 
 * Only active when user is authenticated via Supabase Auth.
 * Returns the current sync status for UI indicators.
 */
export function useSyncEngine(): SyncStatus {
  const statusRef = useRef<SyncStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userIdRef = useRef<string | null>(null);
  // Force re-render for status changes
  const [, forceUpdate] = require('react').useState(0);

  const updateStatus = useCallback((s: SyncStatus) => {
    statusRef.current = s;
    forceUpdate((n: number) => n + 1);
  }, []);

  // Save function
  const saveToCloud = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId || !isSupabaseConfigured) return;

    updateStatus('saving');

    try {
      const payload = buildGameStateSnapshot();
      const { error } = await supabase
        .from('player_profiles')
        .upsert({
          id: userId,
          updated_at: new Date().toISOString(),
          game_state: payload,
        }, { onConflict: 'id' });

      if (error) {
        console.error('[SyncEngine] Save failed:', error.message);
        updateStatus('error');
      } else {
        updateStatus('saved');
        // Reset to idle after 3s
        setTimeout(() => updateStatus('idle'), 3000);
      }
    } catch (err) {
      console.error('[SyncEngine] Network error:', err);
      updateStatus('error');
      setTimeout(() => updateStatus('idle'), 5000);
    }
  }, [updateStatus]);

  // Debounced trigger
  const scheduleSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveToCloud();
    }, DEBOUNCE_MS);
  }, [saveToCloud]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Get authenticated user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        userIdRef.current = user.id;
      }
    });

    // Listen for auth changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      userIdRef.current = session?.user?.id || null;
    });

    // Subscribe to store changes (fire-and-forget triggers for debounce)
    const unsubGame = useGameStore.subscribe(() => {
      if (userIdRef.current) scheduleSave();
    });
    const unsubInv = useInventoryStore.subscribe(() => {
      if (userIdRef.current) scheduleSave();
    });
    const unsubAuto = useAutomationStore.subscribe(() => {
      if (userIdRef.current) scheduleSave();
    });

    return () => {
      authSub.unsubscribe();
      unsubGame();
      unsubInv();
      unsubAuto();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleSave]);

  return statusRef.current;
}
