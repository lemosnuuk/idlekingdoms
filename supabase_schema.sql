-- =============================================
-- Idle Kingdoms — Supabase Schema
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- 1. Tabela de perfis de jogador (JSONB único para todo o game state)
CREATE TABLE IF NOT EXISTS player_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  game_state JSONB DEFAULT '{}'::jsonb
);

-- 2. Row Level Security
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de segurança: cada usuário só acessa o próprio registro
CREATE POLICY "Users can read own profile"
  ON player_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON player_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON player_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
