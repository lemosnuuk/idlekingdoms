import { useEffect } from "react";
import { useGameStore, NodeData } from "@/stores/gameStore";
import { useCombatStore, MonsterData } from "@/stores/combatStore";
import { isPointInLake, isNearRiver } from "@/utils/mapCollision";
import { MapRegistry, calculateMonsterStats } from "@/engine/WorldMapDirector";

export function useZoneDirector() {
  useEffect(() => {
    // FUNÇÃO PRINCIPAL DE RESPAWN
    const processSpawns = (catchUpMultiplier = 1) => {
      const game = useGameStore.getState();
      const combat = useCombatStore.getState();
      
      const mapId = game.currentMapId;
      const mapConfig = MapRegistry[mapId];
      if (!mapConfig) return;

      const currentMonsters = combat.monstersByMap[mapId] || [];
      const currentNodes = game.nodesByMap[mapId] || [];

      // Spawna Biomas Regulares (Z >= 0)
      for (const biome of mapConfig.biomes) {
        const biomeMonsters = currentMonsters.filter(m => 
          !m.isDead && m.floor === biome.z &&
          m.x >= biome.minX && m.x <= biome.maxX &&
          m.y >= biome.minY && m.y <= biome.maxY
        );
        
        const biomeNodes = currentNodes.filter(n => 
          n.floor === biome.z && n.currentHealth > 0 &&
          n.x >= biome.minX && n.x <= biome.maxX &&
          n.y >= biome.minY && n.y <= biome.maxY
        );

        let monstersToSpawn = Math.min(biome.maxMonsters - biomeMonsters.length, catchUpMultiplier);
        let nodesToSpawn = Math.min(biome.maxNodes - biomeNodes.length, catchUpMultiplier);

        // Monstros
        for (let i = 0; i < monstersToSpawn; i++) {
          const spawnX = biome.minX + Math.random() * (biome.maxX - biome.minX);
          const spawnY = biome.minY + Math.random() * (biome.maxY - biome.minY);
          if (biome.z === 0 && (isPointInLake(spawnX, spawnY) || isNearRiver(spawnX, spawnY, 100))) continue;
          
          // Safe Zone check for HUB
          if (mapId === 'HUB_VILA_CENTRAL' && biome.z === 0) {
            const distToCenter = Math.hypot(spawnX - 2500, spawnY - 2500);
            if (distToCenter <= 700) continue;
          }

          // Protect Tutorial Dungeon from generic monster spawns
          if (mapId === 'HUB_VILA_CENTRAL' && biome.name !== 'Porão da Taverna (Tutorial)') {
            if (spawnX >= 2180 && spawnX <= 2240 && spawnY >= 2480 && spawnY <= 2540 && biome.z === -1) {
              continue;
            }
          }
          
          const blueprint = biome.monsterPool[Math.floor(Math.random() * biome.monsterPool.length)];
          const stats = calculateMonsterStats(mapId, biome.z, blueprint);
          
          const newMonster: MonsterData = {
            id: `procedural_m_${Date.now()}_${Math.random()}`,
            name: blueprint.name,
            type: blueprint.type,
            level: stats.level,
            hp: stats.hp,
            maxHp: stats.hp,
            attack: stats.atk,
            defense: stats.def,
            x: spawnX,
            y: spawnY,
            spawnX,
            spawnY,
            isDead: false,
            floor: biome.z,
            status: 'idle'
          };
          combat.addMonster(newMonster);
        }

        // Nodes
        for (let i = 0; i < nodesToSpawn; i++) {
          const spawnX = biome.minX + Math.random() * (biome.maxX - biome.minX);
          const spawnY = biome.minY + Math.random() * (biome.maxY - biome.minY);
          if (biome.z === 0 && (isPointInLake(spawnX, spawnY) || isNearRiver(spawnX, spawnY, 100))) continue;

          // Protect Tutorial Dungeon from generic node spawns
          if (mapId === 'HUB_VILA_CENTRAL' && biome.name !== 'Porão da Taverna (Tutorial)') {
            if (spawnX >= 2180 && spawnX <= 2240 && spawnY >= 2480 && spawnY <= 2540 && biome.z === -1) {
              continue;
            }
          }

          const nodeType = biome.nodePool[Math.floor(Math.random() * biome.nodePool.length)];
          const newNode: NodeData = {
            id: `procedural_n_${Date.now()}_${Math.random()}`,
            type: nodeType,
            x: spawnX,
            y: spawnY,
            currentHealth: 100,
            maxHealth: 100,
            floor: biome.z
          };
          game.addNode(mapId, newNode);
        }
      }

      // Spawna Masmorras Modulares (Z < 0)
      // O jogador pode estar no andar -1, -2, -3...
      // Para simular, rodamos o spawn de masmorra no andar em que o jogador está se ele for negativo
      if (game.currentFloor < 0) {
        const floorZ = game.currentFloor;
        // Pega o blueprint base (para simplificar, array 0)
        const dungeonBP = mapConfig.dungeonBlueprints[0];
        if (dungeonBP) {
          const minX = 500; const maxX = 4500;
          const minY = 500; const maxY = 4500;

          const dMonsters = currentMonsters.filter(m => !m.isDead && m.floor === floorZ);
          const dNodes = currentNodes.filter(n => n.floor === floorZ && n.currentHealth > 0);

          let monstersToSpawn = Math.min(dungeonBP.maxMonsters - dMonsters.length, catchUpMultiplier);
          let nodesToSpawn = Math.min(dungeonBP.maxNodes - dNodes.length, catchUpMultiplier);

          for (let i = 0; i < monstersToSpawn; i++) {
            const spawnX = minX + Math.random() * (maxX - minX);
            const spawnY = minY + Math.random() * (maxY - minY);
            
            // Protect Tutorial Dungeon from generic dungeon monsters
            if (mapId === 'HUB_VILA_CENTRAL' && spawnX >= 2180 && spawnX <= 2240 && spawnY >= 2480 && spawnY <= 2540) continue;

            const blueprint = dungeonBP.monsterPool[Math.floor(Math.random() * dungeonBP.monsterPool.length)];
            const stats = calculateMonsterStats(mapId, floorZ, blueprint);
            
            const newMonster: MonsterData = {
              id: `procedural_d_m_${Date.now()}_${Math.random()}`,
              name: blueprint.name,
              type: blueprint.type,
              level: stats.level,
              hp: stats.hp,
              maxHp: stats.hp,
              attack: stats.atk,
              defense: stats.def,
              x: spawnX,
              y: spawnY,
              spawnX,
              spawnY,
              floor: floorZ,
              isDead: false,
              status: 'idle'
            };
            combat.addMonster(newMonster);
          }

          for (let i = 0; i < nodesToSpawn; i++) {
            const spawnX = minX + Math.random() * (maxX - minX);
            const spawnY = minY + Math.random() * (maxY - minY);

            // Protect Tutorial Dungeon from generic dungeon nodes
            if (mapId === 'HUB_VILA_CENTRAL' && spawnX >= 2180 && spawnX <= 2240 && spawnY >= 2480 && spawnY <= 2540) continue;

            const nodeType = dungeonBP.nodePool[Math.floor(Math.random() * dungeonBP.nodePool.length)];
            const newNode: NodeData = {
              id: `dungeon_n_${Date.now()}_${Math.random()}`,
              type: nodeType as any,
              x: spawnX,
              y: spawnY,
              currentHealth: 100,
              maxHealth: 100,
              floor: floorZ
            };
            game.addNode(mapId, newNode);
          }
        }
        
        // Custom Tutorial Dungeon Spawn Logic
        if (mapId === 'HUB_VILA_CENTRAL' && game.currentFloor === -1) {
          const tMonsters = currentMonsters.filter(m => !m.isDead && m.floor === -1 && m.name === 'Rato de Esgoto');
          const tNodes = currentNodes.filter(n => n.floor === -1 && n.x === 2200 && n.y === 2480 && n.currentHealth > 0);

          if (tMonsters.length < 1) {
            const newMonster: MonsterData = {
              id: `tutorial_rat_${Date.now()}`,
              name: 'Rato de Esgoto',
              type: 'wolf',
              level: 1,
              hp: 20,
              maxHp: 20,
              attack: 2,
              defense: 0,
              x: 2210,
              y: 2490,
              spawnX: 2210,
              spawnY: 2490,
              floor: -1,
              isDead: false,
              status: 'idle'
            };
            combat.addMonster(newMonster);
          }

          if (tNodes.length < 1) {
            const newNode: NodeData = {
              id: `tutorial_ore_${Date.now()}`,
              type: 'iron_ore',
              x: 2200,
              y: 2480,
              currentHealth: 100,
              maxHealth: 100,
              floor: -1
            };
            game.addNode(mapId, newNode);
          }
        }
      }
      
      localStorage.setItem('kingdoms_last_spawn_tick', Date.now().toString());
    };

    // OFFLINE CATCH UP LOGIC
    const lastTick = localStorage.getItem('kingdoms_last_spawn_tick');
    if (lastTick) {
      const now = Date.now();
      const diffMs = now - parseInt(lastTick);
      const missedTicks = Math.floor(diffMs / 5000); // 5s per tick
      
      if (missedTicks > 0) {
        processSpawns(Math.min(20, missedTicks));
      }
    } else {
      processSpawns(1);
    }

    // NORMAL LOOP (5s)
    const interval = setInterval(() => {
      processSpawns(1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);
}
