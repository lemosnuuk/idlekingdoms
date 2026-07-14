import { create } from 'zustand';

export interface RoutineRule {
  id: string;
  condition: string;
  action: string;
}

interface AutomationState {
  isActive: boolean;
  isOpen: boolean;
  rules: RoutineRule[];
  setIsActive: (active: boolean) => void;
  setIsOpen: (isOpen: boolean) => void;
  toggleAutomationPanel: () => void;
  addRule: (rule: RoutineRule) => void;
  removeRule: (id: string) => void;
}

export const useAutomationStore = create<AutomationState>((set) => ({
  isActive: false,
  isOpen: false,
  rules: [],
  
  setIsActive: (isActive) => set({ isActive }),
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleAutomationPanel: () => set((state) => ({ isOpen: !state.isOpen })),
  
  addRule: (rule) => set((state) => ({ rules: [...state.rules, rule] })),
  removeRule: (id) => set((state) => ({ rules: state.rules.filter(r => r.id !== id) })),
}));
