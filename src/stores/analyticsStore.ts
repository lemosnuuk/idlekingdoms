import { create } from 'zustand';

interface AnalyticsState {
  isOpen: boolean;
  toggleAnalytics: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  isOpen: false,
  toggleAnalytics: () => set((state) => ({ isOpen: !state.isOpen })),
}));
