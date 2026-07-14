import { MonsterData } from "@/stores/combatStore";
import { InventoryItem } from "@/stores/inventoryStore";

export type Rarity = "common" | "uncommon" | "rare" | "epic";

export interface LootRoll {
  itemId: string;
  quantity: number;
  rarity: Rarity;
}

// 50% Common, 15% Uncommon, 2% Rare
export const BASE_CHANCES = {
  common: 0.50,
  uncommon: 0.15,
  rare: 0.02,
  epic: 0.005 // 0.5% base
};

interface LootEntry {
  itemId: string;
  minQty: number;
  maxQty: number;
  rarity: Rarity;
}

// Dict of monster types to their possible drops
export const MONSTER_LOOT_TABLES: Record<string, LootEntry[]> = {
  wolf: [
    { itemId: 'meat', minQty: 1, maxQty: 2, rarity: 'common' },
    { itemId: 'wolf_pelt', minQty: 1, maxQty: 1, rarity: 'uncommon' },
    { itemId: 'health_potion', minQty: 1, maxQty: 1, rarity: 'rare' },
  ],
  orc: [
    { itemId: 'meat', minQty: 1, maxQty: 3, rarity: 'common' },
    { itemId: 'iron_ore', minQty: 1, maxQty: 2, rarity: 'uncommon' },
    { itemId: 'health_potion', minQty: 1, maxQty: 2, rarity: 'rare' },
    { itemId: 'orc_tooth', minQty: 1, maxQty: 1, rarity: 'rare' }
  ],
  default: [
    { itemId: 'wood', minQty: 1, maxQty: 2, rarity: 'common' },
    { itemId: 'stone', minQty: 1, maxQty: 2, rarity: 'common' }
  ]
};

export const DEEP_DUNGEON_DROPS: LootEntry[] = [
  { itemId: 'dark_iron', minQty: 1, maxQty: 1, rarity: 'rare' },
  { itemId: 'obsidian_scroll', minQty: 1, maxQty: 1, rarity: 'epic' },
];

export class LootTableDirector {
  static generateLoot(monster: MonsterData, mapId: string, z: number): LootRoll[] {
    const drops: LootRoll[] = [];
    const pool = MONSTER_LOOT_TABLES[monster.type] || MONSTER_LOOT_TABLES['default'];
    
    // Z-axis lucky modifier
    // ChanceFinal = ChanceBase * (1 + (Math.abs(z) * 0.05))
    const zModifier = 1 + (Math.abs(z) * 0.05);

    // Evaluate standard pool
    for (const entry of pool) {
      let chance = BASE_CHANCES[entry.rarity] || 0;
      
      // Rare and Epic drops scale heavily with depth
      if (entry.rarity === 'rare' || entry.rarity === 'epic') {
        chance = chance * zModifier;
      }

      if (Math.random() < chance) {
        const qty = Math.floor(Math.random() * (entry.maxQty - entry.minQty + 1)) + entry.minQty;
        drops.push({ itemId: entry.itemId, quantity: qty, rarity: entry.rarity });
      }
    }

    // Evaluate Deep Dungeon Pool (z <= -5)
    if (z <= -5) {
      for (const entry of DEEP_DUNGEON_DROPS) {
        // Here, the base chance is also multiplied by the depth modifier
        const chance = (BASE_CHANCES[entry.rarity] || 0) * zModifier;
        if (Math.random() < chance) {
          const qty = Math.floor(Math.random() * (entry.maxQty - entry.minQty + 1)) + entry.minQty;
          drops.push({ itemId: entry.itemId, quantity: qty, rarity: entry.rarity });
        }
      }
    }

    return drops;
  }
}
