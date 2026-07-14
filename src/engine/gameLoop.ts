import { useGameStore } from '../store/useGameStore';

export class GameLoopManager {
  private combatInterval: NodeJS.Timeout | null = null;
  private economyInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Hidratação offline antes de iniciar os loops (se rodando no browser)
    if (typeof window !== 'undefined') {
      this.hydrateAndCalculateOffline();
    }

    // Loop de combate rápido a cada 200ms
    this.combatInterval = setInterval(() => {
      useGameStore.getState().tickCombat();
    }, 200);

    // Loop de economia fixo a cada 10000ms (10 segundos)
    this.economyInterval = setInterval(() => {
      useGameStore.getState().tickEconomy();
    }, 10000);

    console.log("GameLoopManager started.");
  }

  public stop() {
    this.isRunning = false;
    if (this.combatInterval) clearInterval(this.combatInterval);
    if (this.economyInterval) clearInterval(this.economyInterval);
    console.log("GameLoopManager stopped.");
  }

  private hydrateAndCalculateOffline() {
    const lastSavedString = localStorage.getItem('idle_kingdoms_last_saved');
    if (lastSavedString) {
      const lastSavedAt = parseInt(lastSavedString, 10);
      if (!isNaN(lastSavedAt)) {
        const elapsedMs = Date.now() - lastSavedAt;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        
        // Aplica o tempo ausente processando a simulação
        if (elapsedSeconds > 0) {
          useGameStore.getState().processOfflineProgress(elapsedSeconds);
          console.log(`Hidratação Offline: Calculado ${elapsedSeconds}s de progresso ausente.`);
        }
      }
    }
  }
}
