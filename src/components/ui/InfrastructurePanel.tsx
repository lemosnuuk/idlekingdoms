"use client";

import { useAnalyticsStore } from "@/stores/analyticsStore";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { ExpeditionsPanel } from "./ExpeditionsPanel";
import { X, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InfrastructurePanel() {
  const { isOpen, toggleAnalytics } = useAnalyticsStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 384, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="h-full pointer-events-auto overflow-hidden flex-shrink-0"
        >
          <div className="w-96 h-full bg-gradient-to-b from-[#090a0f]/95 to-[#050508]/98 border-r border-indigo-900/30 backdrop-blur-md shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-indigo-900/50 bg-black/40">
              <div className="flex items-center gap-3">
                <Crown className="text-indigo-400" size={20} />
                <h2 className="font-serif font-bold text-lg text-indigo-400 uppercase tracking-widest">A Coroa</h2>
              </div>
              <button onClick={toggleAnalytics} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content Container */}
            <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-6 scrollbar-thin scrollbar-thumb-indigo-900/50 scrollbar-track-transparent">
              <AnalyticsDashboard />
              <ExpeditionsPanel />
            </div>
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
