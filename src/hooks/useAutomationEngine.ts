import { useEffect } from 'react';
import { useAutomationStore } from '@/stores/automationStore';
import { useGameStore, NodeData } from '@/stores/gameStore';
import { useInventoryStore } from '@/stores/inventoryStore';

// ID incremental para cada ciclo de movimento. Impede que callbacks antigos do
// Framer Motion (onAnimationComplete) cancelem um novo ciclo de automação.
let currentMovementId = 0;

export function getAutomationMovementId() {
  return currentMovementId;
}

// Timestamp de quando isMoving ficou preso (para stuck detection)
let stuckSince: number | null = null;

export const useAutomationEngine = () => {
  useEffect(() => {
    const tickInterval = setInterval(() => {
      const autoStore = useAutomationStore.getState();
      
      // Stop if automation is disabled or no rules exist
      if (!autoStore.isActive || autoStore.rules.length === 0) return;

      const gameStore = useGameStore.getState();
      const invStore = useInventoryStore.getState();

      // Avoid interrupting the player if they are currently moving or dead
      if (gameStore.isDead) return;

      // STUCK DETECTOR: Se isMoving ficou ligado por mais de 20 segundos, é um deadlock.
      // Nenhuma caminhada no mapa deveria levar mais do que isso.
      if (gameStore.isMoving) {
        if (!stuckSince) {
          stuckSince = Date.now();
        } else if (Date.now() - stuckSince > 20000) {
          console.warn('[AutomationEngine] STUCK DETECTED — forcing isMoving=false');
          useGameStore.getState().setIsMoving(false);
          stuckSince = null;
        }
        return;
      }
      stuckSince = null; // Reset quando não está se movendo

      for (const rule of autoStore.rules) {
        let conditionMet = false;

        // Evaluate condition
        switch (rule.condition) {
          case 'inventory_not_full':
            conditionMet = !invStore.isFull();
            break;
          case 'inventory_full':
            conditionMet = invStore.isFull();
            break;
          case 'health_low':
            conditionMet = (gameStore.hp / gameStore.maxHp) < 0.3;
            break;
        }

        if (conditionMet) {
          // Execute action
          switch (rule.action) {
            case 'chop_nearest_tree':
              executeResourceAction('tree', gameStore, invStore);
              return; // Break out of the loop so we only do one action per tick
            case 'mine_nearest_rock':
              executeResourceAction('rock', gameStore, invStore);
              return;
            case 'go_to_city':
              gameStore.setTargetPosition({ x: 2500, y: 2500 });
              gameStore.setIsMoving(true);
              
              // Failsafe unlock after max walk time
              setTimeout(() => {
                useGameStore.getState().setIsMoving(false);
              }, 15000);
              return;
          }
        }
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(tickInterval);
  }, []);
};

function executeResourceAction(type: 'tree' | 'rock', gameStore: ReturnType<typeof useGameStore.getState>, invStore: ReturnType<typeof useInventoryStore.getState>) {
  const charPos = gameStore.characterPosition;
  
  // Find nearest valid node
  let nearestNode: NodeData | null = null;
  let minDistance = Infinity;

  const mapId = gameStore.currentMapId;
  const currentNodes = gameStore.nodesByMap[mapId] || [];

  for (const node of currentNodes) {
    if (node.currentHealth <= 0 || node.floor !== gameStore.currentFloor) continue;
    
    if (type === 'tree' && node.type !== 'oak_tree' && node.type !== 'pine_tree') continue;
    if (type === 'rock' && node.type !== 'iron_ore') continue;

    const dist = Math.hypot(node.x - charPos.x, node.y - charPos.y);
    if (dist < minDistance) {
      minDistance = dist;
      nearestNode = node;
    }
  }

  if (nearestNode) {
    const targetX = nearestNode.x;
    const targetY = nearestNode.y + 20;
    
    // Calculates exact walking time (speed MUST match Character.tsx: 150px/s)
    const PLAYER_SPEED = 150;
    const dist = Math.hypot(targetX - charPos.x, targetY - charPos.y);
    const isAlreadyThere = dist < 5;
    
    const walkDuration = isAlreadyThere ? 0 : (dist / PLAYER_SPEED) * 1000;
    const totalDelay = walkDuration + 1500; // Walk time + 1.5s swing time

    // Incrementa o ID do ciclo e guarda localmente para comparação futura
    const thisMovementId = ++currentMovementId;

    // Lock engine
    gameStore.setIsMoving(true);
    
    if (!isAlreadyThere) {
      gameStore.setTargetPosition({ x: targetX, y: targetY });
    }

    // Give time to reach the node before harvesting
    setTimeout(() => {
      try {
        // Refresh state references
        const currentFull = useInventoryStore.getState().isFull();
        const latestGameStore = useGameStore.getState();
        const latestMapId = latestGameStore.currentMapId;
        const latestNodes = latestGameStore.nodesByMap[latestMapId] || [];
        const latestNode = latestNodes.find(n => n.id === nearestNode!.id);

        if (!currentFull && latestNode && latestNode.currentHealth > 0) {
          useInventoryStore.getState().addItem(type === 'tree' ? 'wood' : 'stone', 1);
          
          if (type === 'tree') {
            latestGameStore.gainSkillXp('axeFighting', 1);
            const axeLvl = latestGameStore.skills.axeFighting.level;
            const damage = Math.floor(25 * (1 + (axeLvl - 10) * 0.05));
            latestGameStore.damageNode(nearestNode!.id, damage);
          } else {
            latestGameStore.gainSkillXp('pickaxeFighting', 1);
            const pickLvl = latestGameStore.skills.pickaxeFighting.level;
            const damage = Math.floor(25 * (1 + (pickLvl - 10) * 0.05));
            latestGameStore.damageNode(nearestNode!.id, damage);
          }
          
          latestGameStore.addFloatingText(
            type === 'tree' ? "+1 🪵 Madeira" : "+1 🪨 Ferro", 
            nearestNode!.x, 
            nearestNode!.y - 45, 
            'harvest'
          );

          if (latestNode.currentHealth <= 25) {
            latestGameStore.triggerShake();
          }
        }
      } finally {
        // Garantir que a posição lógica do player acompanhou o alvo, mesmo se a aba estiver inativa (framer motion travado)
        if (!isAlreadyThere) {
          useGameStore.getState().setCharacterPosition({ x: targetX, y: targetY });
        }
        // Só desbloqueia se NENHUM ciclo novo foi iniciado enquanto esperávamos.
        // Se currentMovementId mudou, significa que outro setTimeout já assumiu o controle.
        if (currentMovementId === thisMovementId) {
          useGameStore.getState().setIsMoving(false);
        }
      }
    }, totalDelay);
  }
}
