-- Migration 0000: Init Kingdoms Online Database
-- This is a conceptual structure for the MVP.

CREATE TABLE public.characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL UNIQUE,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    gold INTEGER DEFAULT 0,
    health INTEGER DEFAULT 100,
    max_health INTEGER DEFAULT 100,
    current_action TEXT,
    location_x INTEGER DEFAULT 500,
    location_y INTEGER DEFAULT 500,
    region_id TEXT DEFAULT 'starting_city',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS setup
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own characters"
ON public.characters FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own characters"
ON public.characters FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own characters"
ON public.characters FOR UPDATE
USING (auth.uid() = user_id);
