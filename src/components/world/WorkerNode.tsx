"use client";

import { WorkerData } from "@/stores/workerStore";
import { Pickaxe, Axe } from "lucide-react";
import { motion } from "framer-motion";

export default function WorkerNode({ worker }: { worker: WorkerData }) {
  if (worker.status !== 'working') return null;

  return (
    <div className="absolute -right-6 bottom-2 flex flex-col items-center pointer-events-none z-10">
      <motion.div 
        className="relative w-8 h-10 flex flex-col items-center justify-end origin-bottom"
        animate={{ y: [0, -2, 0] }}
        transition={{ repeat: Infinity, duration: 0.4 }}
      >
        {/* Pernas */}
        <div className="flex gap-1 absolute bottom-0 z-0">
          <div className="w-1.5 h-3 bg-amber-900 rounded-sm"></div>
          <div className="w-1.5 h-3 bg-amber-900 rounded-sm"></div>
        </div>
        
        {/* Corpo Túnica */}
        <div className="absolute bottom-[8px] w-5 h-6 bg-amber-700 rounded-t-md rounded-b-sm z-10 flex flex-col items-center shadow-inner border border-amber-900">
           {/* cinto */}
           <div className="absolute bottom-[3px] w-full h-1 bg-amber-950"></div>
        </div>

        {/* Cabeça / Chapéu */}
        <div className="absolute top-[0px] w-4 h-4 bg-orange-200 rounded-full z-20 flex flex-col items-center border border-orange-900">
           {/* chapéu palha */}
           <div className="absolute top-[-2px] w-6 h-1.5 bg-yellow-600 rounded-full border border-yellow-800"></div>
           <div className="absolute top-[-5px] w-3 h-3 bg-yellow-600 rounded-t-full border-t border-x border-yellow-800"></div>
        </div>

        {/* Braço com Ferramenta */}
        <motion.div 
          className="absolute top-[12px] right-[-2px] w-1.5 h-4 bg-orange-200 rounded-full origin-top z-30 border border-orange-900"
          animate={{ rotate: [0, -60, 0] }}
          transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
        >
           {/* Ferramenta */}
           <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 drop-shadow-md">
             {worker.type === 'lumberjack' ? <Axe size={14} className="text-fantasy-success fill-amber-900" /> : <Pickaxe size={14} className="text-slate-300 fill-amber-900" />}
           </div>
        </motion.div>
      </motion.div>
      
      <div className="bg-black/90 px-1 py-0.5 rounded text-[8px] text-white font-bold mt-1 shadow-md border border-fantasy-border">
        {worker.name}
      </div>
    </div>
  );
}
