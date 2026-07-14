-- Migration 0005: V0.6 Combat

CREATE TABLE public.monsters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'wolf', 'orc'
    level INTEGER DEFAULT 1,
    max_hp INTEGER NOT NULL,
    attack INTEGER NOT NULL,
    defense INTEGER NOT NULL,
    loot_table JSONB, -- ex: {"leather": 1}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.combat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
    monster_id UUID REFERENCES public.monsters(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active', -- 'active', 'victory', 'defeat', 'fled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.monsters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view monsters" ON public.monsters FOR SELECT USING (true);

ALTER TABLE public.combat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own combat sessions" ON public.combat_sessions FOR ALL USING (
    character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
);
