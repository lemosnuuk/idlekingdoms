-- Migration 0002: V0.3 Market and Crafting

CREATE TABLE public.market_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price_per_unit INTEGER NOT NULL,
    status TEXT DEFAULT 'active', -- active, sold, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.market_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active market listings" ON public.market_listings FOR SELECT USING (status = 'active');
CREATE POLICY "Users can create their own listings" ON public.market_listings FOR INSERT WITH CHECK (
    seller_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
);
CREATE POLICY "Users can edit their own listings" ON public.market_listings FOR UPDATE USING (
    seller_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
);
