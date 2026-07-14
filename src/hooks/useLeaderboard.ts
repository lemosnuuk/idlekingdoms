import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  gold: number;
}

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('leaderboard_view')
        .select('*')
        .order('gold', { ascending: false })
        .limit(100); // Fetch top 100 so we can find player's rank

      if (fetchError) throw fetchError;
      
      setLeaderboard(data as LeaderboardEntry[]);
    } catch (err: any) {
      console.error('Failed to fetch leaderboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { leaderboard, loading, error, refreshLeaderboard: fetchLeaderboard };
}
