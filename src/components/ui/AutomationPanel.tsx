"use client";

import { useAutomationStore, RoutineRule } from "@/stores/automationStore";
import { X, Play, Square, Plus, Trash2, Bot, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

function CustomSelect({ value, options, onChange, label }: { value: string, options: {value: string, label: string}[], onChange: (val: string) => void, label: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const currentOption = options.find(o => o.value === value);
  
  return (
    <div className="relative text-xs font-mono w-full" onMouseLeave={() => setIsOpen(false)}>
      <label className="text-[10px] text-fantasy-text-muted block mb-1 font-serif tracking-widest uppercase">{label}</label>
      <div 
        className="bg-[#0b0b0d] border border-[#ffffff]/10 hover:border-fantasy-accent/30 rounded px-3 py-2 text-slate-300 cursor-pointer flex justify-between items-center shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {currentOption?.label}
        <ChevronDown size={14} className={`transition-transform text-fantasy-text-muted ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            className="absolute z-50 left-0 right-0 top-[110%] bg-[#141417] border border-[#ffffff]/10 rounded shadow-2xl overflow-hidden"
          >
            {options.map(opt => (
              <div 
                key={opt.value}
                className="px-3 py-2 hover:bg-[#d4af37]/20 hover:text-[#d4af37] cursor-pointer transition-colors text-slate-300"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
              >
                {opt.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AutomationPanel() {
  const { rules, isActive, isOpen, toggleAutomationPanel, setIsActive, addRule, removeRule } = useAutomationStore();
  const [condition, setCondition] = useState("inventory_not_full");
  const [action, setAction] = useState("chop_nearest_tree");

  const handleAddRule = () => {
    addRule({
      id: Math.random().toString(36).substr(2, 9),
      condition,
      action
    });
  };

  const conditionOptions = [
    { value: 'inventory_not_full', label: 'Inventário com espaço livre' },
    { value: 'inventory_full', label: 'Inventário totalmente cheio' },
    { value: 'health_low', label: 'HP Crítico (<30%)' }
  ];

  const actionOptions = [
    { value: 'chop_nearest_tree', label: 'Cortar Árvore mais próxima' },
    { value: 'mine_nearest_rock', label: 'Minerar Pedra mais próxima' },
    { value: 'go_to_city', label: 'Retornar para a Cidade' }
  ];

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
          <div className="w-96 h-full bg-gradient-to-b from-[#141417]/95 to-[#0b0b0d]/98 border-r border-[#ffffff]/5 backdrop-blur-md shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-[#ffffff]/5 bg-black/20">
              <div className="flex items-center gap-3">
                <Bot className="text-[#d4af37]" size={20} />
                <h2 className="font-serif font-bold text-lg text-[#d4af37] uppercase tracking-widest">Rotinas de IA</h2>
              </div>
              <button onClick={toggleAutomationPanel} className="text-fantasy-text-muted hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto">
              {/* Rule Builder */}
              <div className="bg-[#0a0a0c] p-4 rounded-lg border border-[#ffffff]/5 mb-6 shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)]">
                <h3 className="text-[11px] font-bold text-fantasy-text-muted uppercase tracking-widest mb-4">Adicionar Regra</h3>
                
                <div className="space-y-4 mb-5">
                  <CustomSelect value={condition} options={conditionOptions} onChange={setCondition} label="SE (Condição)" />
                  <CustomSelect value={action} options={actionOptions} onChange={setAction} label="ENTÃO (Ação)" />
                </div>
                
                <button 
                  onClick={handleAddRule}
                  className="w-full bg-[#1a1811] hover:bg-[#d4af37] border border-[#d4af37]/30 hover:text-black text-[#d4af37] py-2 rounded text-xs font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Registrar Rotina
                </button>
              </div>

              {/* Rule List */}
              <div className="space-y-3">
                {rules.length === 0 ? (
                  <div className="text-center text-xs text-fantasy-text-muted py-6 opacity-50 font-serif">Nenhuma rotina de IA configurada.</div>
                ) : (
                  rules.map((rule, index) => (
                    <div key={rule.id} className="bg-[#0b0b0d] border border-[#ffffff]/5 hover:border-fantasy-accent/20 rounded-lg p-3 flex items-center justify-between group shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] transition-colors">
                      <div className="flex-1 font-mono text-[11px] space-y-1">
                        <div className="text-[10px] text-fantasy-text-muted font-serif uppercase tracking-widest mb-1.5 border-b border-[#ffffff]/5 pb-1">Passo {index + 1}</div>
                        <div className="text-slate-300">
                          <span className="text-[#d4af37] font-bold">SE</span> {conditionOptions.find(o => o.value === rule.condition)?.label}
                        </div>
                        <div className="text-slate-300">
                          <span className="text-[#d4af37] font-bold">FAÇA</span> {actionOptions.find(o => o.value === rule.action)?.label}
                        </div>
                      </div>
                      <button 
                        onClick={() => removeRule(rule.id)}
                        className="text-fantasy-text-muted hover:text-red-500 opacity-50 group-hover:opacity-100 transition-all p-2 bg-black/50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer Controls */}
            <div className="p-5 border-t border-[#ffffff]/5 bg-black/20">
              <button 
                onClick={() => setIsActive(!isActive)}
                className={`w-full py-3 rounded text-xs font-bold flex items-center justify-center gap-2 transition-all uppercase tracking-widest shadow-xl ${
                  isActive 
                    ? 'bg-red-900/30 text-red-400 border border-red-500/50 hover:bg-red-900 hover:text-white' 
                    : 'bg-green-900/30 text-green-400 border border-green-500/50 hover:bg-green-900 hover:text-white'
                }`}
              >
                {isActive ? (
                  <><Square size={14} /> Suspender IA</>
                ) : (
                  <><Play size={14} fill="currentColor" /> Ativar IA</>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
