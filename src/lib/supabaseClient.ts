import { createClient, User, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Verify if Supabase is fully configured with valid variables
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') && 
  !supabaseAnonKey.includes('placeholder');

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder'
);

// ─── Auth Helpers ───────────────────────────────────────────

/** Returns the current authenticated user, or null if not logged in. */
export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** Returns the current session, or null. */
export async function getCurrentSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/** Synchronous check — returns true if a session token is cached locally. */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined' || !isSupabaseConfigured) return false;
  // Access token in localStorage means the SDK has a session cached
  const storageKey = `sb-${supabaseUrl.split('//')[1]?.split('.')[0]}-auth-token`;
  return !!localStorage.getItem(storageKey);
}

// ─── Legacy Character ID (offline/guest mode) ──────────────

/** Utility to get or create a mock Character ID stored in LocalStorage for testing without Auth */
export function getLocalCharacterId(): string | null {
  if (typeof window === 'undefined') return null;
  
  let charId = localStorage.getItem('kingdoms_char_id');
  if (!charId) {
    charId = crypto.randomUUID();
    localStorage.setItem('kingdoms_char_id', charId);
    
    if (isSupabaseConfigured) {
      const initChar = async () => {
        try {
          await supabase.from('characters').insert([
            { id: charId, name: 'Visitante', gold: 100 }
          ]);
        } catch (err) {
          console.error('Failed to initialize character in Supabase:', err);
        }
      };
      initChar();
    }
  }
  return charId;
}
