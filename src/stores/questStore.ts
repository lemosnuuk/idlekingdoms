import { create } from 'zustand';
import { useInventoryStore } from './inventoryStore';

export interface QuestReward {
  type: 'gold' | 'item';
  amount: number;
  itemId?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  isCompleted: boolean;
  isClaimed: boolean;
  reward: QuestReward;
  unlockMessage?: string;
}

interface QuestState {
  isOpen: boolean;
  quests: Quest[];
  currentQuestIndex: number;
  toggleQuestLog: () => void;
  progressQuest: (questId: string, amount: number) => void;
  claimQuestReward: (questId: string) => void;
}

const initialQuests: Quest[] = [
  {
    id: 'collect_wood',
    title: 'O Início',
    description: 'Colete 5 Madeiras clicando em Pinheiros ou usando o Bot de Automação.',
    targetAmount: 5,
    currentAmount: 0,
    isCompleted: false,
    isClaimed: false,
    reward: { type: 'gold', amount: 50 },
    unlockMessage: 'Acesso às ferramentas rudimentares'
  },
  {
    id: 'build_tent',
    title: 'A Base',
    description: 'Compre um terreno e construa uma Tenda (Menu de Construção).',
    targetAmount: 1,
    currentAmount: 0,
    isCompleted: false,
    isClaimed: false,
    reward: { type: 'gold', amount: 150 },
  },
  {
    id: 'hire_worker',
    title: 'Expansão Industrial',
    description: 'Contrate 1 Lenhador no Menu de Trabalhadores e o assinale ao seu Terreno.',
    targetAmount: 1,
    currentAmount: 0,
    isCompleted: false,
    isClaimed: false,
    reward: { type: 'gold', amount: 300 },
  },
  {
    id: 'kill_monster',
    title: 'Exterminador',
    description: 'Derrote 5 Monstros (Lobos ou Orcs).',
    targetAmount: 5,
    currentAmount: 0,
    isCompleted: false,
    isClaimed: false,
    reward: { type: 'item', amount: 1, itemId: 'reinforced_wood_shield' },
    unlockMessage: 'Acesso às Montanhas Rochosas (Desbloqueado)'
  }
];

export const useQuestStore = create<QuestState>((set, get) => ({
  isOpen: false,
  quests: initialQuests,
  currentQuestIndex: 0,

  toggleQuestLog: () => set((state) => ({ isOpen: !state.isOpen })),

  progressQuest: (questId, amount) => set((state) => {
    const currentQuest = state.quests[state.currentQuestIndex];
    
    // Only progress if it's the current active quest
    if (!currentQuest || currentQuest.id !== questId || currentQuest.isCompleted) {
      return state;
    }

    const newAmount = Math.min(currentQuest.currentAmount + amount, currentQuest.targetAmount);
    const isCompleted = newAmount >= currentQuest.targetAmount;
    
    const newQuests = state.quests.map((q, idx) => {
      if (idx === state.currentQuestIndex) {
        return { ...q, currentAmount: newAmount, isCompleted };
      }
      return q;
    });

    return { quests: newQuests };
  }),

  claimQuestReward: (questId) => {
    const state = get();
    const quest = state.quests.find(q => q.id === questId);
    
    if (quest && quest.isCompleted && !quest.isClaimed) {
      const inventory = useInventoryStore.getState();
      
      if (quest.reward.type === 'gold') {
        inventory.addGold(quest.reward.amount);
      } else if (quest.reward.type === 'item' && quest.reward.itemId) {
        inventory.addItem(quest.reward.itemId, quest.reward.amount);
      }

      set((s) => ({
        quests: s.quests.map(q => q.id === questId ? { ...q, isClaimed: true } : q),
        currentQuestIndex: s.currentQuestIndex + 1
      }));
    }
  }
}));
