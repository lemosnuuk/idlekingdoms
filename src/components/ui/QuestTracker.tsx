"use client";

import { useQuestStore } from "@/stores/questStore";
import { motion, AnimatePresence } from "framer-motion";
import { Scroll, CheckCircle2 } from "lucide-react";

export default function QuestTracker() {
  const { quests, currentQuestIndex } = useQuestStore();
  const currentQuest = quests[currentQuestIndex];

  if (!currentQuest || currentQuest.id === 'collect_wood') return null; // Finished all quests or hiding the first collect quest

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="absolute top-24 left-6 w-64 bg-fantasy-card/90 backdrop-blur-md border border-fantasy-border rounded-xl shadow-2xl p-4 pointer-events-auto"
    >
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-fantasy-border/50">
        <Scroll size={18} className="text-fantasy-accent" />
        <h2 className="font-serif font-bold text-fantasy-accent uppercase tracking-wider text-sm">
          Jornada
        </h2>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuest.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex flex-col gap-1"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-white font-bold text-sm leading-tight">
              {currentQuest.title}
            </h3>
            {currentQuest.isCompleted && (
              <CheckCircle2 size={16} className="text-green-400" />
            )}
          </div>
          
          <p className="text-fantasy-text-muted text-xs leading-relaxed">
            {currentQuest.description}
          </p>
          
          <div className="mt-2 flex items-center justify-between text-xs font-bold">
            <span className="text-fantasy-accent-hover">Progresso:</span>
            <span className="text-white">
              {currentQuest.currentAmount} / {currentQuest.targetAmount}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-fantasy-darker rounded-full mt-1 overflow-hidden">
            <motion.div 
              className="h-full bg-fantasy-accent"
              initial={{ width: 0 }}
              animate={{ width: `${(currentQuest.currentAmount / currentQuest.targetAmount) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
