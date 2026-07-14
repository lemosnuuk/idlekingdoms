-- Migration 0004: V0.5 Workers

CREATE TABLE public.workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
    assigned_plot_id UUID REFERENCES public.plots(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'lumberjack', 'miner'
    status TEXT DEFAULT 'idle', -- 'idle', 'working', 'sleeping'
    salary INTEGER DEFAULT 1,
    energy INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can manage workers" ON public.workers FOR ALL USING (
    owner_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
);
