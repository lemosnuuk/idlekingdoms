export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export type VocationType = 'KNIGHT' | 'PALADIN' | 'MAGE';

export interface SkillXp {
  level: number;
  xp: number;
  xpNeeded: number;
}

export interface Skills {
  axe: SkillXp;
  pickaxe: SkillXp;
  sword: SkillXp;
  shielding: SkillXp;
  distance: SkillXp;
  magicLevel: SkillXp;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  type: 'weapon' | 'shield' | 'resource' | 'potion' | 'rune' | 'utility' | 'fish';
  equipped?: boolean;
  damage?: number;
  defense?: number;
  attackTickModifier?: number;
}

export interface MarketCommodity {
  basePrice: number;
  currentPrice: number;
}

export interface MarketState {
  commodities: {
    wood: MarketCommodity;
    stone: MarketCommodity;
    iron: MarketCommodity;
  };
  currentEvent: {
    name: string;
    multiplier: number;
    expiresAt: number;
  } | null;
}

export interface Worker {
  id: string;
  name: string;
  type: 'lumberjack' | 'miner';
  salaryPerSecond: number;
  resourcePerSecond: number;
}

export interface Corpse {
  id: string;
  position: Position3D;
  items: InventoryItem[];
  gold: number;
}

export interface GambitConfig {
  potionThresholdPercent: number;
  skillsEnabled: boolean;
}
