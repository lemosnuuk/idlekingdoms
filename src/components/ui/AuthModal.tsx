"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, KeyRound, Sparkles, LogIn, UserPlus, Wand2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { buildGameStateSnapshot, hydrateFromPayload, GameStatePayload } from "@/hooks/useSyncEngine";
import { useGameStore, Vocation } from "@/stores/gameStore";
import { Sword, Shield, Crosshair } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthTab = 'login' | 'register';

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showMergePrompt, setShowMergePrompt] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [vocation, setVocation] = useState<Vocation>('Knight');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError(null);
    setSuccess(null);
  };

  // ─── Email/Password Auth ──────────────────────────────────

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Preencha todos os campos.');
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'Email ou senha incorretos.'
        : authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await handlePostLogin(data.user.id);
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!email || !password) {
      setError('Preencha todos os campos.');
      return;
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      useGameStore.getState().setVocation(vocation);
      // Create profile row
      await supabase.from('player_profiles').upsert({
        id: data.user.id,
        updated_at: new Date().toISOString(),
        game_state: buildGameStateSnapshot(),
      }, { onConflict: 'id' });

      setSuccess('✨ Conta criada com sucesso! Seu progresso será salvo automaticamente na nuvem.');
      setTimeout(() => onClose(), 2500);
    }
    setLoading(false);
  };

  // ─── Magic Link ───────────────────────────────────────────

  const handleMagicLink = async () => {
    if (!email) {
      setError('Informe seu email para receber o link mágico.');
      return;
    }
    setLoading(true);
    setError(null);

    const { error: linkError } = await supabase.auth.signInWithOtp({ email });
    if (linkError) {
      setError(linkError.message);
    } else {
      setSuccess('📧 Link mágico enviado! Verifique seu email.');
    }
    setLoading(false);
  };

  // ─── Post-Login Reconciliation ────────────────────────────

  const handlePostLogin = async (userId: string) => {
    // Check if cloud profile exists
    const { data: profile } = await supabase
      .from('player_profiles')
      .select('game_state, updated_at')
      .eq('id', userId)
      .single();

    const hasLocalData = !!localStorage.getItem('kingdoms_char_id');

    if (profile?.game_state && hasLocalData) {
      // Both cloud AND local data exist — ask user
      setPendingUserId(userId);
      setShowMergePrompt(true);
    } else if (profile?.game_state) {
      // Only cloud data — load it
      hydrateFromPayload(profile.game_state as unknown as GameStatePayload);
      setSuccess('☁️ Progresso carregado da nuvem!');
      setTimeout(() => onClose(), 1500);
    } else {
      // No cloud data — upload local
      await supabase.from('player_profiles').upsert({
        id: userId,
        updated_at: new Date().toISOString(),
        game_state: buildGameStateSnapshot(),
      }, { onConflict: 'id' });
      setSuccess('☁️ Progresso local vinculado à sua conta!');
      setTimeout(() => onClose(), 1500);
    }
  };

  const handleMergeChoice = async (useLocal: boolean) => {
    if (!pendingUserId) return;
    setShowMergePrompt(false);

    if (useLocal) {
      // Upload current local state to cloud
      await supabase.from('player_profiles').upsert({
        id: pendingUserId,
        updated_at: new Date().toISOString(),
        game_state: buildGameStateSnapshot(),
      }, { onConflict: 'id' });
      setSuccess('☁️ Progresso local vinculado à nuvem!');
    } else {
      // Load cloud state into stores
      const { data: profile } = await supabase
        .from('player_profiles')
        .select('game_state')
        .eq('id', pendingUserId)
        .single();
      if (profile?.game_state) {
        hydrateFromPayload(profile.game_state as unknown as GameStatePayload);
      }
      setSuccess('☁️ Progresso da nuvem carregado!');
    }
    setTimeout(() => onClose(), 1500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md mx-4 rounded-2xl overflow-hidden"
        >
          {/* Glassmorphism container */}
          <div className="bg-[#0a0a12]/80 backdrop-blur-xl border border-[#d4af37]/20 shadow-[0_0_80px_rgba(212,175,55,0.08)] rounded-2xl">

            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[#d4af37]" />
                  <h2 className="text-lg font-serif font-bold text-white tracking-wide">
                    Kingdoms Online
                  </h2>
                </div>
                <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
                  <X size={18} />
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-1 font-mono">
                Salve seu progresso na nuvem
              </p>
            </div>

            {/* Merge Prompt */}
            {showMergePrompt ? (
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-zinc-300 mb-1">Conflito de progresso detectado!</p>
                  <p className="text-xs text-zinc-500">
                    Você possui dados salvos localmente E na nuvem. Qual deseja manter?
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleMergeChoice(true)}
                    className="flex-1 py-3 rounded-xl bg-emerald-950/50 border border-emerald-700/40 text-emerald-400 text-sm font-bold hover:bg-emerald-900/50 transition-colors"
                  >
                    📱 Usar Local
                  </button>
                  <button
                    onClick={() => handleMergeChoice(false)}
                    className="flex-1 py-3 rounded-xl bg-blue-950/50 border border-blue-700/40 text-blue-400 text-sm font-bold hover:bg-blue-900/50 transition-colors"
                  >
                    ☁️ Usar Nuvem
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Tab Switch */}
                <div className="flex border-b border-white/5">
                  <button
                    onClick={() => { setTab('login'); resetForm(); }}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                      tab === 'login'
                        ? 'text-[#d4af37] border-b-2 border-[#d4af37] bg-[#d4af37]/5'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <LogIn size={14} /> Entrar
                  </button>
                  <button
                    onClick={() => { setTab('register'); resetForm(); }}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                      tab === 'register'
                        ? 'text-[#d4af37] border-b-2 border-[#d4af37] bg-[#d4af37]/5'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <UserPlus size={14} /> Cadastrar
                  </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Email</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37]/40 focus:ring-1 focus:ring-[#d4af37]/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Senha</label>
                    <div className="relative">
                      <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') tab === 'login' ? handleLogin() : handleRegister();
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37]/40 focus:ring-1 focus:ring-[#d4af37]/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Vocation Selection (Only on Register) */}
                  {tab === 'register' && (
                    <div className="space-y-2 pt-2">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Escolha sua Classe</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setVocation('Knight')}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                            vocation === 'Knight'
                              ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                              : 'bg-black/40 border-white/10 hover:border-white/30 text-zinc-500'
                          }`}
                        >
                          <Sword size={20} className={vocation === 'Knight' ? 'text-red-400' : ''} />
                          <span className={`text-[10px] mt-1.5 font-bold uppercase ${vocation === 'Knight' ? 'text-red-100' : ''}`}>Knight</span>
                        </button>

                        <button
                          onClick={() => setVocation('Paladin')}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                            vocation === 'Paladin'
                              ? 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                              : 'bg-black/40 border-white/10 hover:border-white/30 text-zinc-500'
                          }`}
                        >
                          <Crosshair size={20} className={vocation === 'Paladin' ? 'text-emerald-400' : ''} />
                          <span className={`text-[10px] mt-1.5 font-bold uppercase ${vocation === 'Paladin' ? 'text-emerald-100' : ''}`}>Paladin</span>
                        </button>

                        <button
                          onClick={() => setVocation('Mage')}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                            vocation === 'Mage'
                              ? 'bg-blue-950/40 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                              : 'bg-black/40 border-white/10 hover:border-white/30 text-zinc-500'
                          }`}
                        >
                          <Wand2 size={20} className={vocation === 'Mage' ? 'text-blue-400' : ''} />
                          <span className={`text-[10px] mt-1.5 font-bold uppercase ${vocation === 'Mage' ? 'text-blue-100' : ''}`}>Mage</span>
                        </button>
                      </div>
                      <p className="text-[9px] text-zinc-500 text-center mt-1">
                        {vocation === 'Knight' && 'Mestres do combate corpo a corpo (Sword & Axe).'}
                        {vocation === 'Paladin' && 'Especialistas em combate à distância (Distance).'}
                        {vocation === 'Mage' && 'Manipuladores de energia arcana (Magic Level).'}
                      </p>
                    </div>
                  )}

                  {/* Error / Success */}
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-400 bg-red-950/30 border border-red-900/30 px-3 py-2 rounded-lg"
                    >
                      {error}
                    </motion.p>
                  )}
                  {success && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900/30 px-3 py-2 rounded-lg"
                    >
                      {success}
                    </motion.p>
                  )}

                  {/* Primary Button */}
                  <button
                    onClick={tab === 'login' ? handleLogin : handleRegister}
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8961f] text-black font-bold text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        {tab === 'login' ? <LogIn size={14} /> : <UserPlus size={14} />}
                        {tab === 'login' ? 'Entrar' : 'Criar Conta'}
                      </>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[10px] text-zinc-600 uppercase tracking-widest">ou</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>

                  {/* Magic Link */}
                  <button
                    onClick={handleMagicLink}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-zinc-400 text-xs font-bold uppercase tracking-wider hover:bg-white/[0.06] hover:text-zinc-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Wand2 size={13} />
                    Entrar com Link Mágico
                  </button>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="px-6 pb-4">
              <p className="text-[9px] text-zinc-700 text-center font-mono">
                Seus dados são protegidos por criptografia end-to-end via Supabase.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
