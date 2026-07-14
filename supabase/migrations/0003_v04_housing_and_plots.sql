-- Migration 0003: V0.4 Housing and Plots

CREATE TABLE public.plots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id TEXT,
    owner_id UUID REFERENCES public.characters(id) ON DELETE SET NULL, -- NULL significa que está a venda/livre
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    width INTEGER DEFAULT 100,
    height INTEGER DEFAULT 100,
    base_price INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plot_id UUID REFERENCES public.plots(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'tent', 'cabin'
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view plots" ON public.plots FOR SELECT USING (true);
CREATE POLICY "Owner can update plot" ON public.plots FOR UPDATE USING (
    owner_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
);

ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view buildings" ON public.buildings FOR SELECT USING (true);
CREATE POLICY "Owner can create buildings in their plot" ON public.buildings FOR INSERT WITH CHECK (
    plot_id IN (SELECT id FROM public.plots WHERE owner_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()))
);
