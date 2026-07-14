-- Migration 0006: V0.7 Logistics

CREATE TABLE public.caravans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
    payload JSONB NOT NULL DEFAULT '[]', -- Ex: [{"itemId": "wood", "quantity": 100}]
    status TEXT DEFAULT 'preparing', -- 'preparing', 'traveling_out', 'traveling_back', 'arrived'
    dispatch_time TIMESTAMP WITH TIME ZONE,
    return_time TIMESTAMP WITH TIME ZONE,
    gold_reward INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.caravans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own caravans" ON public.caravans FOR ALL USING (
    owner_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
);
