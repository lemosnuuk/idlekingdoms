import { create } from 'zustand';
import { isPointInLake, isNearRiver } from '@/utils/mapCollision';
import { supabase, getLocalCharacterId, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useInventoryStore } from '@/stores/inventoryStore';

interface Position {
  x: number;
  y: number;
}

export interface NodeData {
  id: string;
  type: 'oak_tree' | 'pine_tree' | 'iron_ore' | 'training_dummy';
  x: number;
  y: number;
  currentHealth: number;
  maxHealth: number;
  floor: number; // Z-axis floor (0: surface, 1: mountain, -1: caves)
}

export interface NPCData {
  id: string;
  name: string;
  x: number;
  y: number;
  floor: number;
  message: string;
}

export interface FloatingTextData {
  id: string;
  x: number;
  y: number;
  text: string;
  type: 'player_damage' | 'enemy_damage' | 'harvest' | 'level_up' | 'exp' | 'poison' | 'heal' | 'legendary_loot';
}

export interface StatusEffect {
  id: string;
  name: string;
  type: 'POISON' | 'REGENERATION' | 'HASTE' | 'DARKNESS';
  magnitude: number;
  durationTicks: number;
  remainingTicks: number;
}

export interface TransitionNode {
  id: string;
  type: 'stair_up' | 'stair_down' | 'hole' | 'rope_spot';
  x: number;
  y: number;
  floor: number;       // floor this node exists on
  targetFloor: number; // floor this node leads to
}

export interface CorpseData {
  id: string;
  x: number;
  y: number;
  floor: number;
  items: { itemId: string; quantity: number }[];
  gold: number;
}

export interface Achievements {
  ratKilled: boolean;
  crownTaxActivated: boolean;
  manualCollects: number;
  veteranDummy: boolean; // Tracking if the reward was given
}

export interface Skill {
  level: number;
  xp: number;
  xpNeeded: number;
}

export type Vocation = 'None' | 'Knight' | 'Paladin' | 'Mage';

export interface PlayerSkills {
  axeFighting: Skill;
  pickaxeFighting: Skill;
  swordFighting: Skill;
  shielding: Skill;
  distanceFighting: Skill;
  magicLevel: Skill;
}

export interface EquipmentItem {
  id: string;
  name: string;
  type: 'weapon' | 'shield';
  quantity: number;
  damage?: number;
  defense?: number;
  attackTickModifier?: number;
  equipped?: boolean;
}

interface GameState {
  playerName: string;
  setPlayerName: (name: string) => void;
  characterPosition: Position;
  targetPosition: Position | null;
  isMoving: boolean;
  isSwimming: boolean;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  currentMapId: string;
  nodesByMap: Record<string, NodeData[]>;
  npcsByMap: Record<string, NPCData[]>;
  timeOfDay: 'day' | 'sunset' | 'night' | 'sunrise';
  floatingTexts: FloatingTextData[];
  zoom: number;
  shakeActive: boolean;

  // Floor and Tibia core additions
  currentFloor: number;
  skills: PlayerSkills;
  isTraining: boolean;
  corpsesByMap: Record<string, CorpseData[]>;
  transitionsByMap: Record<string, TransitionNode[]>;
  level: number;
  experience: number;

  achievements: Achievements;
  updateAchievement: (key: keyof Achievements, value: boolean | number) => void;

  statusEffects: StatusEffect[];
  addStatusEffect: (effect: Omit<StatusEffect, 'id'>) => void;
  removeStatusEffect: (type: StatusEffect['type']) => void;

  // NPC Interaction
  activeNpcId: string | null;
  setActiveNpcId: (id: string | null) => void;
  tutorialProgress: Record<string, boolean>;
  completeTutorial: (npcId: string) => void;
  setStatusEffects: (effects: StatusEffect[]) => void;

  mana: number;
  maxMana: number;
  setMana: (mana: number) => void;

  // Fishing System
  isFishing: boolean;
  setIsFishing: (isFishing: boolean) => void;

  equippedWeapon: string | null;
  equippedShield: string | null;
  gambitPotionThreshold: number;
  gambitExoriEnabled: boolean;
  setGambitPotionThreshold: (val: number) => void;
  setGambitExoriEnabled: (val: boolean) => void;
  
  // Vocation & Mage Gambits
  vocation: Vocation;
  setVocation: (voc: Vocation) => void;
  gambitRuneCraftingEnabled: boolean;
  setGambitRuneCraftingEnabled: (val: boolean) => void;
  gambitRuneType: 'fire' | 'healing' | 'energy_wall';
  setGambitRuneType: (val: 'fire' | 'healing' | 'energy_wall') => void;
  gambitMageHealingEnabled: boolean;
  setGambitMageHealingEnabled: (val: boolean) => void;
  gambitMageFireEnabled: boolean;
  setGambitMageFireEnabled: (val: boolean) => void;

  inventory: EquipmentItem[];
  craftItem: (recipeId: string) => void;
  equipItem: (itemId: string) => void;

  equipWeapon: (weaponId: string | null) => void;
  equipShield: (shieldId: string | null) => void;

  setCharacterPosition: (pos: Position) => void;
  setTargetPosition: (pos: Position | null) => void;
  setIsMoving: (isMoving: boolean) => void;
  setIsSwimming: (isSwimming: boolean) => void;
  setHp: (hp: number) => void;
  setNodes: (mapId: string, nodes: NodeData[]) => void;
  addNode: (mapId: string, node: NodeData) => void;
  damageNode: (id: string, amount: number) => void;
  setTimeOfDay: (time: 'day' | 'sunset' | 'night' | 'sunrise') => void;
  addFloatingText: (text: string, x: number, y: number, type: FloatingTextData['type']) => void;
  removeFloatingText: (id: string) => void;
  setZoom: (zoom: number) => void;
  triggerShake: () => void;

  isDead: boolean;
  revivePlayer: () => void;

  // Actions for Z-Axis and RPG Skills
  travelToMap: (targetMapId: string, spawnPosition: Position) => void;
  setCurrentFloor: (floor: number) => void;
  gainSkillXp: (skillName: keyof PlayerSkills, amount: number) => void;
  setIsTraining: (isTraining: boolean) => void;
  addCorpse: (mapId: string, corpse: CorpseData) => void;
  removeCorpse: (mapId: string, corpseId: string) => void;
  characterDie: () => void;
  gainExperience: (amount: number) => void;

  // Economy & Crown Tax
  crownTaxRate: number;
  setCrownTaxRate: (rate: number) => void;
  expeditionAlerts: Record<string, boolean>;
  tickEconomy: () => void;
  quellRebellion: (workerId: string) => void;
}

// Procedural resource generator to spawn resources in dense, overlapping groves & veins
const generateInitialNodes = (): NodeData[] => {
  const initialNodes: NodeData[] = [];

  const addNode = (id: string, type: 'oak_tree' | 'pine_tree' | 'iron_ore' | 'training_dummy', x: number, y: number, floor = 0) => {
    if (x < 400 || x > 4600 || y < 400 || y > 4600) return; // Keep out of deep water border
    if (isPointInLake(x, y) && floor === 0) return; // Keep out of lakes on surface
    initialNodes.push({ id, type, x, y, currentHealth: 100, maxHealth: 100, floor });
  };

  // Seed-based PRNG for deterministic placement
  let seed = 456;
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  // Grove generator: creates dense overlapping clumps of trees, skipping river tiles
  const addGrove = (prefix: string, type: 'oak_tree' | 'pine_tree', centerX: number, centerY: number, count: number, customScatter?: number) => {
    const scatter = customScatter !== undefined ? customScatter : 220;
    let added = 0;
    let attempts = 0;
    while (added < count && attempts < count * 3) {
      attempts++;
      const x = centerX + (random() - 0.5) * scatter;
      const y = centerY + (random() - 0.5) * scatter;
      if (!isNearRiver(x, y, 140)) {
        addNode(`${prefix}-${added}`, type, x, y, 0);
        added++;
      }
    }
  };

  // Ore vein generator: organic rock groupings near each other, skipping river tiles
  const addOreVein = (prefix: string, centerX: number, centerY: number, count: number) => {
    let added = 0;
    let attempts = 0;
    while (added < count && attempts < count * 3) {
      attempts++;
      const x = centerX + (random() - 0.5) * 110;
      const y = centerY + (random() - 0.5) * 110;
      if (!isNearRiver(x, y, 90)) {
        addNode(`${prefix}-${added}`, 'iron_ore', x, y, 0);
        added++;
      }
    }
  };

  // 1. Mountain Biome (Norte, y < 1400) - Iron Ore veins
  addOreVein('m-ore-1', 1200, 1000, 6);
  addOreVein('m-ore-2', 1800, 950, 5);
  addOreVein('m-ore-3', 2500, 1100, 8); // near legendary mountain stair
  addOreVein('m-ore-4', 3200, 950, 5);
  addOreVein('m-ore-5', 3800, 1050, 6);
  addOreVein('m-ore-nw', 600, 500, 6);

  // Ore veins near river bank
  addOreVein('riverbank-ore-sw', 1950, 2850, 5);
  addOreVein('start-ore-1', 2300, 2800, 4);

  // Safe Zone Dummies
  addNode('dummy-1', 'training_dummy', 2430, 2570, 0);
  addNode('dummy-2', 'training_dummy', 2470, 2530, 0);

  // Safe Zone Fringe Resources (Around radius 700)
  addGrove('fringe-wood-1', 'oak_tree', 3200, 2500, 5, 50);
  addOreVein('fringe-stone-1', 2500, 3200, 4);

  // 2. Dense Forest (Oeste, x < 2000)
  addGrove('f-grove-1', 'oak_tree', 800, 2400, 80);
  addGrove('f-grove-2', 'pine_tree', 1100, 2800, 75);
  addGrove('f-grove-4', 'pine_tree', 1300, 3300, 80);
  addGrove('f-grove-5', 'oak_tree', 1500, 2000, 75);
  addGrove('f-grove-6', 'pine_tree', 1600, 4000, 75);
  addGrove('f-grove-7', 'oak_tree', 1400, 2600, 80);
  addGrove('f-grove-8', 'pine_tree', 1700, 3400, 75);

  // Bottom Left corner
  addGrove('f-grove-3', 'oak_tree', 700, 3600, 100, 190);
  addGrove('f-grove-9', 'oak_tree', 1000, 3800, 90, 190);
  addGrove('f-grove-bl', 'pine_tree', 450, 4200, 95, 190);
  addGrove('f-grove-left', 'oak_tree', 800, 3200, 85, 190);

  // Top Left northwest
  addGrove('nw-grove-1', 'oak_tree', 600, 800, 80);
  addGrove('nw-grove-2', 'pine_tree', 1100, 700, 80);
  addGrove('nw-grove-3', 'oak_tree', 800, 1200, 80);
  addGrove('nw-grove-4', 'pine_tree', 1400, 1100, 75);
  addGrove('nw-grove-5', 'oak_tree', 500, 1600, 85);

  // Community tree clusters
  addGrove('arthas-camp-decor', 'oak_tree', 1500, 2900, 8, 90);
  addGrove('merlin-camp-decor', 'pine_tree', 3700, 2200, 8, 90);

  // 3. Autumn Grove (Leste)
  addGrove('autumn-grove', 'oak_tree', 3450, 2500, 18, 190);
  addOreVein('autumn-ore', 3400, 2600, 6);

  // --- VERTICAL FLOORS ADDITIONS ---
  // Add resource nodes on Floor 1 (Mountain top)
  addNode('m1-ore-floor1', 'iron_ore', 2450, 950, 1);
  addNode('m2-ore-floor1', 'iron_ore', 2550, 950, 1);
  addNode('m3-ore-floor1', 'iron_ore', 2500, 1050, 1);

  // Add resource nodes on Floor -1 (Caves)
  addNode('c1-ore-floor-1', 'iron_ore', 1700, 2400, -1);
  addNode('c2-ore-floor-1', 'iron_ore', 1900, 2600, -1);
  addNode('c3-tree-floor-1', 'pine_tree', 1800, 2450, -1);
  addNode('c4-tree-floor-1', 'oak_tree', 1850, 2550, -1);
  addNode('c5-ore-floor-1', 'iron_ore', 3800, 3500, -1);
  addNode('c6-tree-floor-1', 'oak_tree', 3750, 3600, -1);

  return initialNodes;
};

// Global default transition spots (Stairs & Holes)
const defaultTransitions: TransitionNode[] = [
  // Surface (Floor 0)
  { id: 't_stair_up_1', type: 'stair_up', x: 2500, y: 1000, floor: 0, targetFloor: 1 },
  { id: 't_stair_down_ruins', type: 'stair_down', x: 3800, y: 3600, floor: 0, targetFloor: -1 },
  { id: 't_hole_1', type: 'hole', x: 1800, y: 2500, floor: 0, targetFloor: -1 },
  { id: 't_hole_tavern', type: 'hole', x: 2210, y: 2510, floor: 0, targetFloor: -1 },

  // Floor 1 (Mountain)
  { id: 't_stair_down_1', type: 'stair_down', x: 2500, y: 1000, floor: 1, targetFloor: 0 },

  // Floor -1 (Caverns / Dungeons)
  { id: 't_stair_up_ruins', type: 'stair_up', x: 3800, y: 3600, floor: -1, targetFloor: 0 },
  { id: 't_rope_spot_1', type: 'rope_spot', x: 1800, y: 2500, floor: -1, targetFloor: 0 }
];

export const useGameStore = create<GameState>((set, get) => ({
  playerName: 'Visitante',
  setPlayerName: (playerName) => set({ playerName }),
  
  characterPosition: { x: 2500, y: 2500 },
  targetPosition: null,
  isMoving: false,
  isSwimming: false,
  hp: 100,
  maxHp: 100,
  attack: 10,
  defense: 5,
  currentMapId: 'HUB_VILA_CENTRAL',
  nodesByMap: {
    'HUB_VILA_CENTRAL': generateInitialNodes()
  },
  npcsByMap: {
    'HUB_VILA_CENTRAL': [
      { id: 'npc_radmar', name: 'Radmar (Mestre de Armas)', x: 2450, y: 2550, floor: 0, message: "Abra a Sidebar Direita, equipe sua arma e clique no Boneco de Treino para evoluir suas Skills." },
      { id: 'npc_artis', name: 'Artis (Gerente da Vila)', x: 2350, y: 2650, floor: 0, message: "Abra a Sidebar Esquerda para contratar trabalhadores e monitorar o fluxo contábil no Analytics." },
      { id: 'npc_merlin', name: 'Merlin (Mago Ancião)', x: 2600, y: 2500, floor: 0, message: "Use o menu de Táticas para habilitar Poções Automáticas via Gambit System." }
    ]
  },
  timeOfDay: 'day',
  floatingTexts: [],
  zoom: 1.0,
  shakeActive: false,
  isDead: false,
  statusEffects: [],
  activeNpcId: null,
  tutorialProgress: {},
  achievements: {
    ratKilled: false,
    crownTaxActivated: false,
    manualCollects: 0,
    veteranDummy: false
  },
  corpsesByMap: {
    'HUB_VILA_CENTRAL': [
      { id: 'tutorial_rope_corpse', x: 2210, y: 2510, floor: -1, gold: 0, items: [{ itemId: 'rope', quantity: 1 }] }
    ]
  },

  mana: 200,
  maxMana: 100,
  isFishing: false,
  equippedWeapon: null,
  equippedShield: null,
  gambitPotionThreshold: 0.40,
  gambitExoriEnabled: true,
  
  vocation: 'None',
  gambitRuneCraftingEnabled: false,
  gambitRuneType: 'fire',
  gambitMageHealingEnabled: true,
  gambitMageFireEnabled: true,

  // Tibia-inspired properties
  currentFloor: 0,
  level: 1,
  experience: 0,
  isTraining: false,
  transitionsByMap: {
    'HUB_VILA_CENTRAL': defaultTransitions
  },
  crownTaxRate: 0,
  expeditionAlerts: {},

  addStatusEffect: (effect) => set((state) => {
    // If the same type exists, replace it or extend duration (we'll replace for simplicity)
    const filtered = state.statusEffects.filter(e => e.type !== effect.type);
    const newEffect = { ...effect, id: `${effect.type}-${Date.now()}` };
    return { statusEffects: [...filtered, newEffect] };
  }),

  removeStatusEffect: (type) => set((state) => ({
    statusEffects: state.statusEffects.filter(e => e.type !== type)
  })),

  setActiveNpcId: (id) => set({ activeNpcId: id }),
  updateAchievement: (key, value) => set(state => {
    // Check if it's unlocking for the first time
    const isNewUnlock = typeof value === 'boolean' && value === true && state.achievements[key] === false;
    const isNewThreshold = key === 'manualCollects' && typeof value === 'number' && value >= 100 && state.achievements.manualCollects < 100;
    
    let updates: Partial<GameState> = {
      achievements: { ...state.achievements, [key]: value }
    };

    if (state.isFishing) {
      updates.isFishing = false;
      setTimeout(() => get().addFloatingText("🛑 Pesca Interrompida", state.characterPosition.x, state.characterPosition.y, 'harvest'), 0);
    }

    if (isNewUnlock) {
      if (key === 'ratKilled') {
        updates.maxHp = state.maxHp + 10;
        updates.hp = state.hp + 10;
        setTimeout(() => get().addFloatingText("🏆 Feito: +10 Max HP!", state.characterPosition.x, state.characterPosition.y, 'level_up'), 100);
      }
      if (key === 'crownTaxActivated') {
        updates.maxMana = state.maxMana + 20;
        updates.mana = state.mana + 20;
        setTimeout(() => get().addFloatingText("🏆 Feito: +20 Max Mana!", state.characterPosition.x, state.characterPosition.y, 'level_up'), 100);
      }
      if (key === 'veteranDummy') {
        updates.maxHp = state.maxHp + 10;
        updates.hp = state.hp + 10;
        setTimeout(() => get().addFloatingText("🏆 Feito: +10 Max HP!", state.characterPosition.x, state.characterPosition.y, 'level_up'), 100);
      }
    }
    
    if (isNewThreshold) {
      updates.attack = state.attack + 2;
      setTimeout(() => get().addFloatingText("🏆 Feito: +2 Attack Power!", state.characterPosition.x, state.characterPosition.y, 'level_up'), 100);
    }

    return updates;
  }),
  completeTutorial: (npcId) => set((state) => ({
    tutorialProgress: { ...state.tutorialProgress, [npcId]: true }
  })),

  setStatusEffects: (effects) => set({ statusEffects: effects }),

  setMana: (mana) => set((state) => {
    const nextMana = Math.max(0, Math.min(state.maxMana, mana));
    return { mana: nextMana };
  }),

  setGambitPotionThreshold: (val) => set({ gambitPotionThreshold: val }),
  setGambitExoriEnabled: (val) => set({ gambitExoriEnabled: val }),
  setVocation: (voc) => set({ vocation: voc }),
  setGambitRuneCraftingEnabled: (val) => set({ gambitRuneCraftingEnabled: val }),
  setGambitRuneType: (val) => set({ gambitRuneType: val }),
  setGambitMageHealingEnabled: (val) => set({ gambitMageHealingEnabled: val }),
  setGambitMageFireEnabled: (val) => set({ gambitMageFireEnabled: val }),

  inventory: [],
  
  craftItem: (recipeId) => set((state) => {
    let newItem: EquipmentItem | null = null;
    if (recipeId === 'iron_short_sword') {
      newItem = { id: 'iron_short_sword_' + Date.now(), name: 'Espada Curta de Ferro', quantity: 1, type: 'weapon', damage: 8, attackTickModifier: 1.1 };
    } else if (recipeId === 'heavy_war_axe') {
      newItem = { id: 'heavy_war_axe_' + Date.now(), name: 'Machado de Guerra Pesado', quantity: 1, type: 'weapon', damage: 15, attackTickModifier: 2.0 };
    } else if (recipeId === 'reinforced_wood_shield') {
      newItem = { id: 'reinforced_wood_shield_' + Date.now(), name: 'Escudo de Madeira Ref.', quantity: 1, type: 'shield', defense: 3 };
    } else if (recipeId === 'iron_tower_shield') {
      newItem = { id: 'iron_tower_shield_' + Date.now(), name: 'Tower Shield de Ferro', quantity: 1, type: 'shield', defense: 12 };
    } else if (recipeId === 'iron_spear_500') {
      const existing = state.inventory.find(i => i.id === 'iron_spear_500');
      if (existing) {
        return { inventory: state.inventory.map(i => i.id === 'iron_spear_500' ? { ...i, quantity: i.quantity + 500 } : i) };
      }
      newItem = { id: 'iron_spear_500', name: 'Iron Spear', quantity: 500, type: 'weapon', damage: 6, attackTickModifier: 1.5 };
    }
    if (newItem) {
      return { inventory: [...state.inventory, newItem] };
    }
    return state;
  }),

  equipItem: (itemId) => set((state) => {
    const item = state.inventory.find(i => i.id === itemId);
    if (!item) return state;

    const newInventory = state.inventory.map(i => {
      if (i.type === item.type) {
        if (i.id === itemId) return { ...i, equipped: !i.equipped };
        return { ...i, equipped: false }; // desequipa os outros do mesmo tipo
      }
      return i;
    });

    return { inventory: newInventory };
  }),

  equipWeapon: (weaponId) => set((state) => ({
    equippedWeapon: state.equippedWeapon === weaponId ? null : weaponId
  })),
  equipShield: (shieldId) => set((state) => ({
    equippedShield: state.equippedShield === shieldId ? null : shieldId
  })),
  
  // Starting skills at Level 10 (Tibia standard) with exponential XP requirements
  skills: {
    axeFighting: { level: 10, xp: 0, xpNeeded: 100 },
    pickaxeFighting: { level: 10, xp: 0, xpNeeded: 100 },
    swordFighting: { level: 10, xp: 0, xpNeeded: 100 },
    shielding: { level: 10, xp: 0, xpNeeded: 100 },
    distanceFighting: { level: 10, xp: 0, xpNeeded: 100 },
    magicLevel: { level: 10, xp: 0, xpNeeded: 100 }
  },

  setCharacterPosition: (pos) => set((state) => {
    localStorage.setItem('kingdoms_char_pos', JSON.stringify(pos));
    return { characterPosition: pos };
  }),
  
  setTargetPosition: (pos) => set((state) => {
    if (state.isDead) return state;
    return { targetPosition: pos };
  }),
  
  setIsMoving: (isMoving) => set((state) => {
    let updates: Partial<GameState> = { isMoving };
    if (isMoving && state.isFishing) {
      updates.isFishing = false;
      get().addFloatingText("🛑 Pesca Interrompida", state.characterPosition.x, state.characterPosition.y, 'harvest');
    }
    if (!isMoving) {
      const charId = getLocalCharacterId();
      if (charId && isSupabaseConfigured) {
        supabase.from('characters').update({ 
          location_x: Math.floor(state.characterPosition.x), 
          location_y: Math.floor(state.characterPosition.y) 
        }).eq('id', charId).then();
      }
    }
    return { ...updates, isMoving };
  }),
  
  setIsSwimming: (isSwimming) => set({ isSwimming }),
  setIsFishing: (isFishing) => set({ isFishing }),
  
  setHp: (hp) => set((state) => {
    if (state.isDead) return state; // Se já está morto, ignora mudanças
    const nextHp = Math.max(0, hp);
    const updates: Partial<GameState> = { hp: nextHp };

    // Se sofreu dano, interrompe pescaria
    if (nextHp < state.hp && state.isFishing) {
      updates.isFishing = false;
      get().addFloatingText("🛑 Pesca Interrompida", state.characterPosition.x, state.characterPosition.y, 'player_damage');
    }

    localStorage.setItem('kingdoms_hp', nextHp.toString());
    const charId = getLocalCharacterId();
    if (charId && isSupabaseConfigured) {
      supabase.from('characters').update({ health: nextHp }).eq('id', charId).then();
    }

    // Trigger death if HP hits 0
    if (nextHp <= 0 && !state.isDead) {
      setTimeout(() => {
        get().characterDie();
      }, 50);
      return { ...updates, isDead: true, isMoving: false, targetPosition: null, isTraining: false };
    }

    return updates;
  }),
  
  setNodes: (mapId, nodes) => set((state) => ({ 
    nodesByMap: { ...state.nodesByMap, [mapId]: nodes } 
  })),
  
  addNode: (mapId, node) => set((state) => ({
    nodesByMap: {
      ...state.nodesByMap,
      [mapId]: [...(state.nodesByMap[mapId] || []), node]
    }
  })),

  damageNode: (id, amount) => set((state) => {
    const { currentMapId, nodesByMap } = state;
    const currentNodes = nodesByMap[currentMapId] || [];
    
    const updatedNodes = currentNodes.map(node => {
      if (node.id === id) {
        if (node.type === 'training_dummy') {
          return { ...node, currentHealth: node.maxHealth }; // Dummies never die
        }

        const nextHealth = Math.max(0, node.currentHealth - amount);
        if (nextHealth === 0) {
          // Automatically respawn node after 12 seconds
          setTimeout(() => {
            set((currentState) => {
              const freshNodes = currentState.nodesByMap[currentMapId] || [];
              return {
                nodesByMap: {
                  ...currentState.nodesByMap,
                  [currentMapId]: freshNodes.map(n => n.id === id ? { ...n, currentHealth: n.maxHealth } : n)
                }
              };
            });
          }, 12000);
        }
        return { ...node, currentHealth: nextHealth };
      }
      return node;
    });
    
    return { nodesByMap: { ...nodesByMap, [currentMapId]: updatedNodes } };
  }),
  
  setTimeOfDay: (time) => set({ timeOfDay: time }),
  
  addFloatingText: (text, x, y, type) => set((state) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newText = { id, x, y, text, type };
    
    // Auto-remove floating text after 1.5s
    setTimeout(() => {
      set((currentState) => ({
        floatingTexts: currentState.floatingTexts.filter(ft => ft.id !== id)
      }));
    }, 1500);

    return { floatingTexts: [...state.floatingTexts, newText] };
  }),
  
  removeFloatingText: (id) => set((state) => ({
    floatingTexts: state.floatingTexts.filter(ft => ft.id !== id)
  })),
  
  setZoom: (zoom) => set({ zoom: Math.max(0.6, Math.min(1.5, zoom)) }),
  
  triggerShake: () => set((state) => {
    if (state.shakeActive) return {};
    
    // Stop shaking after 400ms (EXORI effect)
    setTimeout(() => {
      set({ shakeActive: false });
    }, 400);

    return { shakeActive: true };
  }),

  // Floor mechanics
  setCurrentFloor: (floor) => set((state) => {
    localStorage.setItem('kingdoms_floor', floor.toString());
    return { currentFloor: floor, targetPosition: null, isMoving: false };
  }),

  // Skill progression mechanics
  gainSkillXp: (skillName, amount) => set((state) => {
    const nextSkills = { ...state.skills };
    const skill = { ...nextSkills[skillName] };
    
    let multiplier = 1.0;
    const voc = state.vocation;

    if (voc === 'Knight') {
      if (skillName === 'shielding') multiplier = 2.0;
      if (skillName === 'swordFighting' || skillName === 'axeFighting') multiplier = 1.5;
      if (skillName === 'magicLevel') multiplier = 0.5;
    } else if (voc === 'Paladin') {
      if (skillName === 'distanceFighting') multiplier = 2.0;
      if (skillName === 'shielding') multiplier = 1.2;
      if (skillName === 'magicLevel') multiplier = 0.8;
    } else if (voc === 'Mage') {
      if (skillName === 'magicLevel') multiplier = 2.5;
      if (skillName === 'shielding' || skillName === 'swordFighting' || skillName === 'axeFighting') multiplier = 0.2;
    }

    skill.xp += (amount * multiplier);
    let leveledUp = false;

    while (skill.xp >= skill.xpNeeded) {
      skill.xp -= skill.xpNeeded;
      skill.level += 1;
      skill.xpNeeded = Math.floor(skill.xpNeeded * 1.4); // exponential increase
      leveledUp = true;
    }

    nextSkills[skillName] = skill;
    localStorage.setItem('kingdoms_skills', JSON.stringify(nextSkills));

    if (leveledUp) {
      const displayName = skillName === 'axeFighting' ? 'Axe Fighting' :
                          skillName === 'pickaxeFighting' ? 'Pickaxe Fighting' :
                          skillName === 'swordFighting' ? 'Sword Fighting' : 
                          skillName === 'distanceFighting' ? 'Distance Fighting' :
                          skillName === 'magicLevel' ? 'Magic Level' : 'Shielding';
      
      // Floating alert on screen above character
      state.addFloatingText(`🔥 SKILL UP! ${displayName}: Lvl ${skill.level}`, state.characterPosition.x, state.characterPosition.y - 65, 'level_up');
    }

    return { skills: nextSkills };
  }),

  setIsTraining: (isTraining) => set((state) => {
    if (state.isDead) return state;
    return { isTraining };
  }),

  addCorpse: (mapId, corpse) => set((state) => {
    const currentCorpses = state.corpsesByMap[mapId] || [];
    const updated = [...currentCorpses, corpse];
    const newCorpsesByMap = { ...state.corpsesByMap, [mapId]: updated };
    
    localStorage.setItem('kingdoms_corpses', JSON.stringify(newCorpsesByMap));
    return { corpsesByMap: newCorpsesByMap };
  }),

  removeCorpse: (mapId, corpseId) => set((state) => {
    const currentCorpses = state.corpsesByMap[mapId] || [];
    const updated = currentCorpses.filter(c => c.id !== corpseId);
    const newCorpsesByMap = { ...state.corpsesByMap, [mapId]: updated };
    
    localStorage.setItem('kingdoms_corpses', JSON.stringify(newCorpsesByMap));
    return { corpsesByMap: newCorpsesByMap };
  }),

  travelToMap: (targetMapId, spawnPosition) => set((state) => {
    // Requires clearing any combat
    require('@/stores/combatStore').useCombatStore.getState().disengage();
    
    return {
      currentMapId: targetMapId,
      currentFloor: 0,
      characterPosition: spawnPosition,
      targetPosition: null,
      isMoving: false
    };
  }),

  gainExperience: (amount) => set((state) => {
    let nextExp = state.experience + amount;
    let nextLvl = state.level;
    const expNeeded = nextLvl * 100;
    
    if (nextExp >= expNeeded) {
      nextExp -= expNeeded;
      nextLvl += 1;
      state.addFloatingText(`🏆 LEVEL UP! Lvl ${nextLvl}`, state.characterPosition.x, state.characterPosition.y - 60, 'level_up');
    }

    localStorage.setItem('kingdoms_level', nextLvl.toString());
    localStorage.setItem('kingdoms_experience', nextExp.toString());

    // Sync to database
    const charId = getLocalCharacterId();
    if (charId && isSupabaseConfigured) {
      supabase.from('characters').update({ level: nextLvl, experience: nextExp }).eq('id', charId).then();
    }

    return { level: nextLvl, experience: nextExp };
  }),

  // BRUTAL DEATH PENALTY (Tibia Style)
  characterDie: () => set((state) => {
    // 1. Lose 10% global XP
    const nextExp = Math.max(0, Math.floor(state.experience * 0.9));

    // 2. Lose 1 level on all skills
    const nextSkills = { ...state.skills };
    (Object.keys(nextSkills) as Array<keyof PlayerSkills>).forEach((key) => {
      const skill = nextSkills[key];
      const nextLvl = Math.max(10, skill.level - 1); // Tibia floor starting level 10
      nextSkills[key] = {
        level: nextLvl,
        xp: 0,
        xpNeeded: Math.floor(100 * Math.pow(1.4, nextLvl - 10))
      };
    });

    // 3. Drop inventory: 10% chance per item to drop (unless in tutorial dungeon)
    const inventory = useInventoryStore.getState();
    const droppedItems: { itemId: string; quantity: number }[] = [];
    let goldLost = 0;

    const isTutorialDungeon = state.currentMapId === 'HUB_VILA_CENTRAL' && state.currentFloor === -1 && state.characterPosition.x >= 2180 && state.characterPosition.x <= 2240 && state.characterPosition.y >= 2480 && state.characterPosition.y <= 2540;

    if (!isTutorialDungeon) {
      const itemsToKeep = inventory.items.filter(item => {
        if (item.itemId === 'rope') return true; 
        
        if (Math.random() < 0.1) {
          droppedItems.push({ itemId: item.itemId, quantity: item.quantity });
          return false;
        }
        return true;
      });

      inventory.setItems(itemsToKeep);

      // 4. Perda de 15% do Ouro, fica no corpo
      goldLost = Math.floor(inventory.gold * 0.15);
      if (goldLost > 0) {
        inventory.removeGold(goldLost);
      }
    }

    let nextCorpses = state.corpsesByMap[state.currentMapId] || [];

    // Save drop corpse container at coordinate if there's anything to drop
    if (droppedItems.length > 0 || goldLost > 0) {
      const corpseId = `corpse-${Date.now()}`;
      const corpse: CorpseData = {
        id: corpseId,
        x: state.characterPosition.x,
        y: state.characterPosition.y,
        floor: state.currentFloor,
        items: droppedItems,
        gold: goldLost
      };

      nextCorpses = [...nextCorpses, corpse];
      localStorage.setItem('kingdoms_corpses', JSON.stringify(nextCorpses));
    }

    // Sync death data to database
    const charId = getLocalCharacterId();
    if (charId && isSupabaseConfigured) {
      supabase.from('characters').update({
        level: state.level,
        experience: nextExp
      }).eq('id', charId).then();
    }

    state.addFloatingText("💀 FATALIDADE", state.characterPosition.x, state.characterPosition.y - 45, 'player_damage');

    return {
      experience: nextExp,
      skills: nextSkills,
      corpsesByMap: {
        ...state.corpsesByMap,
        [state.currentMapId]: nextCorpses
      },
      isDead: true,
      hp: 0,
      isMoving: false,
      targetPosition: null,
      isTraining: false
    };
  }),

  revivePlayer: () => set((state) => {
    const spawnPos = { x: 2500, y: 2500 };
    localStorage.setItem('kingdoms_char_pos', JSON.stringify(spawnPos));
    localStorage.setItem('kingdoms_hp', state.maxHp.toString());
    localStorage.setItem('kingdoms_floor', '0');

    const charId = getLocalCharacterId();
    if (charId && isSupabaseConfigured) {
      supabase.from('characters').update({
        location_x: spawnPos.x,
        location_y: spawnPos.y,
        health: state.maxHp
      }).eq('id', charId).then();
    }

    return {
      isDead: false,
      hp: state.maxHp,
      mana: state.maxMana,
      characterPosition: spawnPos,
      currentFloor: 0,
      targetPosition: null,
      isMoving: false
    };
  }),

  setCrownTaxRate: (rate) => set((state) => {
    const newRate = Math.max(0, Math.min(40, rate));
    const newAchievements = { ...state.achievements };
    if (newRate > 0) {
      newAchievements.crownTaxActivated = true;
    }
    return { crownTaxRate: newRate, achievements: newAchievements };
  }),

  tickEconomy: () => set((state) => {
    // Lazy load stores to avoid circular dependency issues
    const workerStore = require('@/stores/workerStore').useWorkerStore.getState();
    const invStore = require('@/stores/inventoryStore').useInventoryStore.getState();
    const mapRegistry = require('@/engine/WorldMapDirector').MapRegistry;
    
    const activeWorkers = workerStore.workers.filter((w: any) => w.status === 'working' && w.assignedPlotId);
    if (activeWorkers.length === 0) return state;

    // Fixed tick assumptions: 10s tick = 1 gold salary per worker
    const SALARY_PER_WORKER = 1; 
    const GLOBAL_TICK_MS = 10000; // The economy loop interval
    
    const eficiencia = 1 - (state.crownTaxRate / 100);
    const totalSalarios = activeWorkers.length * SALARY_PER_WORKER;
    const ouroTributado = Math.floor(totalSalarios * (state.crownTaxRate / 100));

    // Calculate resources from non-rebelling workers using their individual efficiency & speed
    const generatedResources: Record<string, number> = { wood: 0, stone: 0 };
    const nextAlerts: Record<string, boolean> = {};
    const isBankrupt = invStore.gold <= 0;
    const producingWorkerIds: string[] = [];
    
    activeWorkers.forEach((w: any) => {
      if (w.isRebelling) return; // Rebelling workers produce nothing
      
      const mapId = w.assignedMapId || 'HUB_VILA_CENTRAL';
      
      // Expeditions are frozen if bankrupt
      if (mapId !== 'HUB_VILA_CENTRAL' && isBankrupt) {
        nextAlerts[mapId] = true;
        return;
      }
      
      const nativeResources = mapRegistry[mapId]?.nativeResources || { lumberjack: 'wood', miner: 'stone' };

      // Use worker efficiency as multiplier; normalize speed against global tick
      const workerEfficiency = w.efficiency ?? 1.0;
      const workerSpeed = w.speed ?? GLOBAL_TICK_MS;
      const speedFactor = GLOBAL_TICK_MS / workerSpeed; // Faster workers produce more per global tick
      const production = workerEfficiency * speedFactor * eficiencia;

      if (w.type === 'lumberjack') {
        const item = nativeResources.lumberjack;
        generatedResources[item] = (generatedResources[item] || 0) + production;
      }
      if (w.type === 'miner') {
        const item = nativeResources.miner;
        generatedResources[item] = (generatedResources[item] || 0) + production;
      }

      producingWorkerIds.push(w.id);
    });

    // Grant XP to all producing workers
    producingWorkerIds.forEach((id: string) => {
      workerStore.gainWorkerXp(id, 1);
    });

    // Peasant Revolt Logic
    if (state.crownTaxRate > 10) {
      const chance = (state.crownTaxRate - 10) * 0.001; // (rate - 10) * 0.1% = 0.001
      if (Math.random() < chance) {
        // Pick a random working, non-rebelling worker to rebel
        const validTargets = activeWorkers.filter((w: any) => !w.isRebelling);
        if (validTargets.length > 0) {
          const target = validTargets[Math.floor(Math.random() * validTargets.length)];
          workerStore.setWorkerRebelling(target.id, true);
        }
      }
    }

    // Apply Economy Changes
    if (totalSalarios - ouroTributado > 0) {
      invStore.removeGold(totalSalarios - ouroTributado);
    }
    
    // Add resources to inventory
    for (const [itemId, amount] of Object.entries(generatedResources)) {
      if (Math.floor(amount) > 0) {
        invStore.addItem(itemId, Math.floor(amount));
      }
    }
    
    return { expeditionAlerts: nextAlerts };
  }),

  quellRebellion: (workerId) => set((state) => {
    const invStore = require('@/stores/inventoryStore').useInventoryStore.getState();
    const workerStore = require('@/stores/workerStore').useWorkerStore.getState();
    const BRIBE_COST = 50;
    
    if (invStore.gold >= BRIBE_COST) {
      invStore.removeGold(BRIBE_COST);
      workerStore.setWorkerRebelling(workerId, false);
    }
    return state;
  })
}));
