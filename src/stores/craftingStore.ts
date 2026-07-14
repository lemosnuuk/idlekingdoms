import { create } from 'zustand';

export interface CraftingRecipe {
  id: string;
  resultItemId: string;
  name: string;
  timeSeconds: number;
  ingredients: { itemId: string; quantity: number }[];
  yield?: number;
}

interface CraftingState {
  isOpen: boolean;
  recipes: CraftingRecipe[];
  activeCraft: { recipeId: string; progress: number; maxProgress: number } | null;
  setIsOpen: (isOpen: boolean) => void;
  toggleCrafting: () => void;
  startCrafting: (recipe: CraftingRecipe) => void;
  updateCraftingProgress: (delta: number) => void;
  completeCrafting: () => void;
}

export const useCraftingStore = create<CraftingState>((set, get) => ({
  isOpen: false,
  
  recipes: [
    {
      id: 'r_stone_axe',
      resultItemId: 'stone_axe',
      name: 'Machado de Pedra',
      timeSeconds: 10,
      ingredients: [{ itemId: 'wood', quantity: 5 }, { itemId: 'stone', quantity: 3 }]
    },
    {
      id: 'r_stone_pickaxe',
      resultItemId: 'stone_pickaxe',
      name: 'Picareta de Pedra',
      timeSeconds: 15,
      ingredients: [{ itemId: 'wood', quantity: 3 }, { itemId: 'stone', quantity: 5 }]
    },
    {
      id: 'r_iron_axe',
      resultItemId: 'iron_axe',
      name: 'Machado de Ferro',
      timeSeconds: 30,
      ingredients: [{ itemId: 'wood', quantity: 20 }, { itemId: 'iron_ore', quantity: 5 }]
    },
    {
      id: 'r_iron_sword',
      resultItemId: 'iron_sword',
      name: 'Espada Curta de Ferro',
      timeSeconds: 20,
      ingredients: [{ itemId: 'iron_ore', quantity: 20 }, { itemId: 'wood', quantity: 10 }]
    },
    {
      id: 'r_heavy_axe',
      resultItemId: 'heavy_axe',
      name: 'Machado de Guerra Pesado',
      timeSeconds: 30,
      ingredients: [{ itemId: 'iron_ore', quantity: 40 }, { itemId: 'wood', quantity: 30 }]
    },
    {
      id: 'r_wooden_shield',
      resultItemId: 'wooden_shield',
      name: 'Escudo de Madeira Reforçado',
      timeSeconds: 15,
      ingredients: [{ itemId: 'wood', quantity: 25 }, { itemId: 'stone', quantity: 5 }]
    },
    {
      id: 'r_iron_shield',
      resultItemId: 'iron_shield',
      name: 'Tower Shield de Ferro',
      timeSeconds: 25,
      ingredients: [{ itemId: 'iron_ore', quantity: 35 }, { itemId: 'stone', quantity: 15 }]
    },
    {
      id: 'r_spear',
      resultItemId: 'spear',
      name: 'Lança de Ferro',
      timeSeconds: 20,
      ingredients: [{ itemId: 'iron_ore', quantity: 5 }, { itemId: 'wood', quantity: 5 }],
      yield: 500
    }
  ],
  
  activeCraft: null,
  
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleCrafting: () => set((state) => ({ isOpen: !state.isOpen })),
  
  startCrafting: (recipe) => set({
    activeCraft: { recipeId: recipe.id, progress: 0, maxProgress: recipe.timeSeconds }
  }),
  
  updateCraftingProgress: (delta) => set((state) => {
    if (!state.activeCraft) return state;
    return {
      activeCraft: {
        ...state.activeCraft,
        progress: Math.min(state.activeCraft.progress + delta, state.activeCraft.maxProgress)
      }
    };
  }),

  completeCrafting: () => set({ activeCraft: null })
}));
