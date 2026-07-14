import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, PlayerSkills } from '@/stores/gameStore';
import { useInventoryStore } from '@/stores/inventoryStore';

export default function TutorialQuestPanel() {
  const activeNpcId = useGameStore(state => state.activeNpcId);
  const setActiveNpcId = useGameStore(state => state.setActiveNpcId);
  const tutorialProgress = useGameStore(state => state.tutorialProgress);
  const completeTutorial = useGameStore(state => state.completeTutorial);
  const skills = useGameStore(state => state.skills);
  const addGold = useInventoryStore(state => state.addGold);

  if (!activeNpcId) return null;

  // Render logic depending on active NPC
  let npcName = "";
  let dialogLines: React.ReactNode[] = [];
  let isCompleted = tutorialProgress[activeNpcId] || false;
  let canComplete = false;
  let handleComplete = () => {};

  // Check radmar goal: train any skill to level 12
  const maxSkillLevel = Math.max(
    skills.axeFighting.level,
    skills.pickaxeFighting.level,
    skills.swordFighting.level,
    skills.distanceFighting.level,
    skills.shielding.level,
    skills.magicLevel.level
  );

  switch (activeNpcId) {
    case 'npc_radmar':
      npcName = "Radmar (Mestre de Armas)";
      if (isCompleted) {
        dialogLines = [
          <p key="1">Seus golpes estão afiados, garoto. Já pode caçar os Lobos Selvagens nas fronteiras de nossa vila.</p>,
          <p key="2">Mantenha-se fora dos pântanos do oeste.</p>
        ];
      } else {
        canComplete = maxSkillLevel >= 12;
        dialogLines = [
          <p key="1">Acha que consegue sobreviver além dessas fronteiras seguras? Prove.</p>,
          <div key="2" className="mt-4 p-3 bg-slate-950/50 border border-slate-700/50 rounded flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-amber-500 uppercase tracking-widest block mb-1">Missão de Treino</span>
              <span className="text-sm text-slate-300">Treine qualquer habilidade até o nível 12 no Boneco de Treino.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Lvl {maxSkillLevel}/12</span>
              {canComplete && (
                <button 
                  onClick={() => {
                    completeTutorial(activeNpcId);
                    addGold(50);
                    useGameStore.getState().addFloatingText('+50 Gold', 2500, 2500, 'exp');
                  }}
                  className="bg-emerald-900/60 hover:bg-emerald-800 text-emerald-400 border border-emerald-700 px-3 py-1 text-xs rounded transition-colors uppercase tracking-wider"
                >
                  Concluir
                </button>
              )}
            </div>
          </div>
        ];
      }
      break;

    case 'npc_artis':
      npcName = "Artis (Gerente da Vila)";
      if (isCompleted) {
        dialogLines = [
          <p key="1">Bom trabalho. O fluxo de recursos começará a subir enquanto você explora o mundo.</p>
        ];
      } else {
        dialogLines = [
          <p key="1">Saudações, forasteiro. Um império não se constrói apenas com espadas.</p>,
          <p key="2" className="text-emerald-400 mt-2">Abra a Sidebar Esquerda (Painel de Trabalhadores) para recrutar moradores para coletar recursos enquanto você descansa. O Analytics mostrará seu fluxo contábil.</p>,
          <button 
            key="3"
            onClick={() => completeTutorial(activeNpcId)}
            className="mt-4 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 px-4 py-1.5 text-xs rounded transition-colors uppercase tracking-wider w-fit"
          >
            Entendido
          </button>
        ];
      }
      break;

    case 'npc_merlin':
      npcName = "Merlin (Mago Ancião)";
      if (isCompleted) {
        dialogLines = [
          <p key="1">O Gambit cuidará de você. Concentre-se nas batalhas.</p>
        ];
      } else {
        dialogLines = [
          <p key="1">A magia que nos circunda permite automatizar ações vitais...</p>,
          <p key="2" className="text-purple-400 mt-2">Abra o menu de Táticas [T] (Botão Táticas no canto inferior) e ajuste o slider do Gambit System para usar poções automaticamente antes que sua vida zere!</p>,
          <button 
            key="3"
            onClick={() => completeTutorial(activeNpcId)}
            className="mt-4 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 px-4 py-1.5 text-xs rounded transition-colors uppercase tracking-wider w-fit"
          >
            Entendido
          </button>
        ];
      }
      break;
      
    default:
      return null;
  }

  return (
    <AnimatePresence>
      {activeNpcId && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl z-[150] pointer-events-auto"
        >
          {/* Overlay invisível para clicar fora e fechar */}
          <div className="fixed inset-0 z-[-1]" onClick={() => setActiveNpcId(null)} />
          
          <div className="bg-[#050507]/95 backdrop-blur-md border-t-2 border-slate-800/80 p-6 rounded-t-xl shadow-[0_-20px_50px_rgba(0,0,0,0.8)] border-x border-slate-800/50 flex flex-col gap-3">
            {/* Cabecalho / Nome do NPC */}
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <span className="font-serif text-amber-500/90 text-lg tracking-widest">{npcName}</span>
              <button 
                onClick={() => setActiveNpcId(null)}
                className="text-slate-500 hover:text-white transition-colors uppercase font-mono text-xs tracking-widest"
              >
                [ Fechar ]
              </button>
            </div>
            
            {/* Dialog Content */}
            <div className="flex flex-col gap-2 font-serif text-slate-300 text-[15px] leading-relaxed">
              {dialogLines}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
