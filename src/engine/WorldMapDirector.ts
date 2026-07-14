import { MonsterData } from '@/stores/combatStore';

export interface MapInstance {
  id: string;
  name: string;
  baseLevel: number;
  // Biomes on this map (usually floor 0, but could be specific areas)
  biomes: BiomeBlueprint[];
  // Dungeons generated when Z < 0
  dungeonBlueprints: DungeonBlueprint[];
  // Recursos nativos produzidos por trabalhadores ociosos neste mapa
  nativeResources: {
    lumberjack: string;
    miner: string;
  };
}

export interface BiomeBlueprint {
  name: string;
  z: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  maxMonsters: number;
  maxNodes: number;
  monsterPool: { name: string; type: 'wolf' | 'orc'; baseHp: number; baseAtk: number; baseDef: number; levelOffset: number }[];
  nodePool: ('oak_tree' | 'pine_tree' | 'iron_ore')[];
}

export interface DungeonBlueprint {
  maxMonsters: number;
  maxNodes: number;
  monsterPool: { name: string; type: 'wolf' | 'orc'; baseHp: number; baseAtk: number; baseDef: number; levelOffset: number }[];
  nodePool: ('oak_tree' | 'pine_tree' | 'iron_ore')[];
}

export const MapRegistry: Record<string, MapInstance> = {
  'HUB_VILA_CENTRAL': {
    id: 'HUB_VILA_CENTRAL',
    name: 'Vila Central (Hub)',
    baseLevel: 1,
    nativeResources: { lumberjack: 'wood', miner: 'stone' },
    biomes: [
      {
        name: 'Campos',
        z: 0,
        minX: 1500, maxX: 3500,
        minY: 1500, maxY: 3500,
        maxMonsters: 15,
        maxNodes: 25,
        monsterPool: [{ name: 'Lobo Selvagem', type: 'wolf', baseHp: 30, baseAtk: 2, baseDef: 1, levelOffset: 0 }],
        nodePool: ['pine_tree']
      },
      {
        name: 'Floresta Oeste',
        z: 0,
        minX: 200, maxX: 1500,
        minY: 500, maxY: 4500,
        maxMonsters: 10,
        maxNodes: 30,
        monsterPool: [{ name: 'Urso Pardo', type: 'wolf', baseHp: 80, baseAtk: 12, baseDef: 5, levelOffset: 1 }],
        nodePool: ['oak_tree']
      },
      {
        name: 'Montanhas',
        z: 1,
        minX: 500, maxX: 4500,
        minY: 200, maxY: 1500,
        maxMonsters: 15,
        maxNodes: 20,
        monsterPool: [{ name: 'Orc Guerreiro', type: 'orc', baseHp: 120, baseAtk: 22, baseDef: 10, levelOffset: 3 }],
        nodePool: ['iron_ore']
      }
    ],
    dungeonBlueprints: [
      {
        maxMonsters: 20,
        maxNodes: 20,
        monsterPool: [{ name: 'Aranha da Mina', type: 'wolf', baseHp: 60, baseAtk: 18, baseDef: 4, levelOffset: 2 }],
        nodePool: ['iron_ore']
      }
    ]
  },
  'DESERT_INSTANCE': {
    id: 'DESERT_INSTANCE',
    name: 'Deserto das Sombras',
    baseLevel: 10,
    nativeResources: { lumberjack: 'cactus_wood', miner: 'sand_iron_ore' },
    biomes: [
      {
        name: 'Dunas Escaldantes',
        z: 0,
        minX: 500, maxX: 4500,
        minY: 500, maxY: 4500,
        maxMonsters: 25,
        maxNodes: 10,
        monsterPool: [{ name: 'Escorpião Rei', type: 'wolf', baseHp: 200, baseAtk: 35, baseDef: 15, levelOffset: 0 }],
        nodePool: ['iron_ore'] // Substituir por ouro quando tiver sprite
      }
    ],
    dungeonBlueprints: [
      {
        maxMonsters: 30,
        maxNodes: 15,
        monsterPool: [{ name: 'Múmia', type: 'orc', baseHp: 300, baseAtk: 45, baseDef: 20, levelOffset: 2 }],
        nodePool: ['iron_ore'] // Ouro
      }
    ]
  },
  'FROST_ISLAND': {
    id: 'FROST_ISLAND',
    name: 'Ilha Gélida',
    baseLevel: 20,
    nativeResources: { lumberjack: 'frozen_wood', miner: 'crystal_ice_shard' },
    biomes: [
      {
        name: 'Tundra Congelada',
        z: 0,
        minX: 500, maxX: 4500,
        minY: 500, maxY: 4500,
        maxMonsters: 25,
        maxNodes: 10,
        monsterPool: [{ name: 'Lobo de Gelo', type: 'wolf', baseHp: 400, baseAtk: 60, baseDef: 25, levelOffset: 0 }],
        nodePool: ['pine_tree']
      }
    ],
    dungeonBlueprints: [
      {
        maxMonsters: 35,
        maxNodes: 25,
        monsterPool: [{ name: 'Golem de Gelo', type: 'orc', baseHp: 600, baseAtk: 80, baseDef: 40, levelOffset: 3 }],
        nodePool: ['iron_ore'] // Platina
      }
    ]
  }
};

/**
 * Calculates monster stats based on the map's base level and the depth (z)
 * Status = BaseMapa * Math.pow(1.20, Math.abs(z))
 */
export function calculateMonsterStats(mapId: string, z: number, poolItem: any) {
  const mapConfig = MapRegistry[mapId];
  if (!mapConfig) return poolItem;

  const depthMultiplier = Math.pow(1.20, Math.abs(z));
  // Base map multiplier scales linearly for simplicity before depth compounding
  const mapMultiplier = mapConfig.baseLevel / Math.max(1, mapConfig.baseLevel * 0.1);

  const finalMultiplier = depthMultiplier * mapMultiplier;

  return {
    hp: Math.floor(poolItem.baseHp * finalMultiplier),
    atk: Math.floor(poolItem.baseAtk * finalMultiplier),
    def: Math.floor(poolItem.baseDef * finalMultiplier),
    level: mapConfig.baseLevel + poolItem.levelOffset + Math.abs(z)
  };
}
