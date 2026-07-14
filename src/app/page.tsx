"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { useGameStore } from "@/stores/gameStore";
import { buildGameStateSnapshot, hydrateFromPayload, GameStatePayload } from "@/hooks/useSyncEngine";
import { User, LogIn, Sparkles, UserPlus, Sword, Shield, Book } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { setPlayerName } = useGameStore();
  
  const [tab, setTab] = useState<'guest' | 'login' | 'register'>('guest');
  const [characterName, setCharacterName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      if (isSupabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // If logged in, check cloud profile
          const { data: profile } = await supabase
            .from('player_profiles')
            .select('game_state')
            .eq('id', session.user.id)
            .single();
            
          if (profile?.game_state) {
            hydrateFromPayload(profile.game_state as unknown as GameStatePayload);
          }
          router.push('/world');
          return;
        }
      }
      
      // If no session, check if there's a guest character already configured (with a name !== 'Visitante')
      // For now, let's just show the landing page if no session.
      // If they already played as guest, their state is in localStorage.
      const localGameStateStr = localStorage.getItem('kingdoms-game-store');
      if (localGameStateStr) {
        try {
          const state = JSON.parse(localGameStateStr);
          if (state.state?.playerName && state.state.playerName !== 'Visitante') {
             // They already have a character, pre-fill or just let them click 'Continue'
             setCharacterName(state.state.playerName);
             setTab('guest'); // Focus on guest tab to continue
          }
        } catch (e) {}
      }

      setLoading(false);
    };
    checkSession();
  }, [router]);

  const handlePlayAsGuest = () => {
    if (!characterName.trim()) {
      setError("Por favor, digite o nome do seu personagem.");
      return;
    }
    
    // Set the character name in the store
    setPlayerName(characterName.trim());
    
    // Redirect to the game
    router.push('/world');
  };

  const handleAuth = async (type: 'login' | 'register') => {
    if (!email || !password) {
      setError('Preencha email e senha.');
      return;
    }
    if (type === 'register' && !characterName.trim()) {
      setError('Por favor, digite o nome do seu personagem para o cadastro.');
      return;
    }
    if (type === 'register' && password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);

    if (type === 'login') {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError('Email ou senha incorretos.');
        setLoading(false);
        return;
      }
      if (data.user) {
        const { data: profile } = await supabase
          .from('player_profiles')
          .select('game_state')
          .eq('id', data.user.id)
          .single();
          
        if (profile?.game_state) {
          hydrateFromPayload(profile.game_state as unknown as GameStatePayload);
        }
        router.push('/world');
      }
    } else {
      // Register
      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      if (data.user) {
        // Set name and create profile
        setPlayerName(characterName.trim());
        const payload = buildGameStateSnapshot();
        payload.playerName = characterName.trim();
        
        await supabase.from('player_profiles').upsert({
          id: data.user.id,
          updated_at: new Date().toISOString(),
          game_state: payload,
        }, { onConflict: 'id' });
        
        router.push('/world');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080b17] flex flex-col items-center justify-center font-serif text-[#d4af37]">
        <div className="w-12 h-12 border-4 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin mb-4" />
        <p className="tracking-widest uppercase text-sm font-bold animate-pulse">Carregando Reino...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b17] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#d4af37]/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center p-3 bg-black/40 border border-[#d4af37]/30 rounded-2xl mb-4 shadow-[0_0_30px_rgba(212,175,55,0.15)]"
          >
            <Sparkles className="text-[#d4af37]" size={32} />
          </motion.div>
          <h1 className="text-4xl font-serif font-black text-white tracking-widest uppercase mb-2 drop-shadow-[0_2px_10px_rgba(212,175,55,0.3)]">
            Kingdoms
            <span className="block text-2xl text-[#d4af37] mt-1">Online</span>
          </h1>
          <p className="text-zinc-400 text-sm">O novo mundo, onde seu império nunca dorme.</p>
        </div>

        {/* Auth Box */}
        <div className="bg-[#0a0a12]/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl overflow-hidden">
          
          {/* Tabs */}
          <div className="flex border-b border-white/5 bg-black/20">
            <button
              onClick={() => { setTab('guest'); setError(null); }}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                tab === 'guest' ? 'text-[#d4af37] border-b-2 border-[#d4af37] bg-white/5' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <User size={14} /> Visitante
            </button>
            <button
              onClick={() => { setTab('login'); setError(null); }}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                tab === 'login' ? 'text-[#d4af37] border-b-2 border-[#d4af37] bg-white/5' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LogIn size={14} /> Login
            </button>
            <button
              onClick={() => { setTab('register'); setError(null); }}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                tab === 'register' ? 'text-[#d4af37] border-b-2 border-[#d4af37] bg-white/5' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <UserPlus size={14} /> Cadastro
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Character Name (For Guest and Register) */}
            {(tab === 'guest' || tab === 'register') && (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Nome do Personagem</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input
                    type="text"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="Ex: Ragnar, Arthur..."
                    maxLength={16}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (tab === 'guest') handlePlayAsGuest();
                        else if (tab === 'register') handleAuth('register');
                      }
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/20 transition-all"
                  />
                </div>
                {tab === 'guest' && characterName && (
                  <p className="text-[10px] text-zinc-500 ml-1">Seu progresso será salvo localmente neste navegador.</p>
                )}
              </div>
            )}

            {/* Email & Password (For Login and Register) */}
            {(tab === 'login' || tab === 'register') && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAuth(tab);
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/20 transition-all"
                  />
                </div>
                {tab === 'register' && (
                  <p className="text-[10px] text-zinc-500 ml-1">Sua conta Supabase armazenará seu progresso na nuvem.</p>
                )}
              </>
            )}

            {error && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-950/30 border border-red-900/30 rounded-xl">
                <p className="text-xs text-red-400">{error}</p>
              </motion.div>
            )}

            <button
              onClick={() => {
                if (tab === 'guest') handlePlayAsGuest();
                else handleAuth(tab);
              }}
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8961f] text-black font-bold text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
            >
              {tab === 'guest' && !characterName && <Sword size={16} />}
              {tab === 'guest' && characterName && 'Iniciar Aventura'}
              {tab === 'guest' && !characterName && 'Jogar Offline'}
              
              {tab === 'login' && 'Entrar no Mundo'}
              {tab === 'register' && 'Forjar Destino'}
            </button>

          </div>
        </div>
        
        <div className="mt-8 flex justify-center gap-6 opacity-60">
           <div className="flex flex-col items-center gap-2">
             <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"><Sword size={16} className="text-zinc-400" /></div>
             <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Lute</span>
           </div>
           <div className="flex flex-col items-center gap-2">
             <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"><Shield size={16} className="text-zinc-400" /></div>
             <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Evolua</span>
           </div>
           <div className="flex flex-col items-center gap-2">
             <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"><Book size={16} className="text-zinc-400" /></div>
             <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Conquiste</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
