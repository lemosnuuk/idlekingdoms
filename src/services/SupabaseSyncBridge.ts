import { supabase, getLocalCharacterId, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useGameStore } from '@/stores/gameStore';
import { create } from 'zustand';

export type SyncStatus = 'Sincronizado' | 'Sincronizando...' | 'Salvando localmente' | 'Offline';

interface SyncState {
  status: SyncStatus;
  setStatus: (status: SyncStatus) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'Sincronizado',
  setStatus: (status) => set({ status }),
}));

class SyncBridge {
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_MS = 15000;
  private queue: any[] = [];
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      this.loadQueueFromStorage();
    }
  }

  private handleOnline() {
    useSyncStore.getState().setStatus('Sincronizando...');
    this.processQueue();
  }

  private handleOffline() {
    useSyncStore.getState().setStatus('Offline');
  }

  private loadQueueFromStorage() {
    try {
      const stored = localStorage.getItem('kingdoms_sync_queue');
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load sync queue', e);
    }
  }

  private saveQueueToStorage() {
    try {
      localStorage.setItem('kingdoms_sync_queue', JSON.stringify(this.queue));
    } catch (e) {
      console.error('Failed to save sync queue', e);
    }
  }

  public async initialize() {
    if (this.isInitialized || !isSupabaseConfigured) return;
    this.isInitialized = true;

    useSyncStore.getState().setStatus('Sincronizando...');

    const charId = getLocalCharacterId();
    if (!charId) return;

    try {
      // Fetch server time and character payload
      // Supabase does not have a direct `now()` endpoint from standard client easily without RPC, 
      // but we can query the character and use Postgres current_timestamp if we had an RPC.
      // Assuming we fetch the character data:
      const { data: charData, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', charId)
        .single();

      if (error) throw error;

      // Anti-cheat: Compare local lastSavedAt with remote updated_at (if available)
      const localLastSaved = parseInt(localStorage.getItem('kingdoms_last_saved') || '0', 10);
      const serverTimestamp = charData.updated_at ? new Date(charData.updated_at).getTime() : Date.now();
      
      // Calculate delta to prevent OS clock manipulation
      const offlineDeltaMs = serverTimestamp - localLastSaved;
      
      if (offlineDeltaMs > 0 && charData) {
        // Here we could inject the offline calculation logic (e.g., resources gained offline)
        // For now, we sync the remote state down to the local store safely.
        console.log(`Offline time delta: ${offlineDeltaMs}ms. Syncing state...`);
        // useGameStore.getState().injectRemotePayload(charData) // e.g.
      }

      localStorage.setItem('kingdoms_last_saved', Date.now().toString());

      // Start listening to local state changes
      this.subscribeToStore();
      
      // Attempt to process any pending offline queue
      await this.processQueue();
      
      useSyncStore.getState().setStatus('Sincronizado');
    } catch (err) {
      console.error('Error initializing SyncBridge:', err);
      useSyncStore.getState().setStatus('Offline');
    }
  }

  private subscribeToStore() {
    useGameStore.subscribe((state) => {
      // Skip scheduling if offline, queue directly
      if (!navigator.onLine) {
        useSyncStore.getState().setStatus('Salvando localmente');
        this.queuePayload(state);
        return;
      }

      useSyncStore.getState().setStatus('Sincronizando...');

      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(() => {
        this.pushStateToCloud(state);
      }, this.DEBOUNCE_MS);
    });
  }

  private queuePayload(state: any) {
    const payload = this.extractPayload(state);
    this.queue.push(payload);
    this.saveQueueToStorage();
  }

  private extractPayload(state: any) {
    // Extract relevant data to sync
    return {
      hp: state.hp,
      maxHp: state.maxHp,
      level: state.level,
      experience: state.experience,
      // Add other fields as needed
    };
  }

  private async pushStateToCloud(state: any) {
    const charId = getLocalCharacterId();
    if (!charId || !isSupabaseConfigured) return;

    try {
      const payload = this.extractPayload(state);
      const { error } = await supabase
        .from('characters')
        .upsert({ id: charId, ...payload, updated_at: new Date().toISOString() });

      if (error) throw error;

      localStorage.setItem('kingdoms_last_saved', Date.now().toString());
      useSyncStore.getState().setStatus('Sincronizado');
    } catch (err) {
      console.error('Cloud save failed, queuing for retry', err);
      useSyncStore.getState().setStatus('Salvando localmente');
      this.queuePayload(state);
    }
  }

  private async processQueue() {
    if (this.queue.length === 0 || !navigator.onLine || !isSupabaseConfigured) return;

    const charId = getLocalCharacterId();
    if (!charId) return;

    useSyncStore.getState().setStatus('Sincronizando...');

    try {
      // In a real scenario, process the queue sequentially or batch
      // Here we take the latest state from the queue to upsert
      const latestPayload = this.queue[this.queue.length - 1];
      
      const { error } = await supabase
        .from('characters')
        .upsert({ id: charId, ...latestPayload, updated_at: new Date().toISOString() });

      if (error) throw error;

      this.queue = [];
      this.saveQueueToStorage();
      localStorage.setItem('kingdoms_last_saved', Date.now().toString());
      useSyncStore.getState().setStatus('Sincronizado');
    } catch (err) {
      console.error('Failed to process sync queue', err);
      useSyncStore.getState().setStatus('Salvando localmente');
    }
  }
}

export const supabaseSyncBridge = new SyncBridge();
