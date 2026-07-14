-- Migration 0001: V0.2 Resources and Inventory

CREATE TABLE public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 0,
    slot_index INTEGER
);

CREATE TABLE public.professions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
    profession_type TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0
);

CREATE TABLE public.nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id TEXT,
    node_type TEXT NOT NULL, -- 'tree', 'rock'
    resource_item_id TEXT NOT NULL, -- 'wood', 'stone'
    x INTEGER,
    y INTEGER,
    max_health INTEGER DEFAULT 100,
    current_health INTEGER DEFAULT 100,
    respawn_time_seconds INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE public.automation_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
    routine_name TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    rules JSONB -- [{"condition": "inventory_not_full", "action": "chop_nearest_tree"}]
);

-- RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own inventory" ON public.inventory_items FOR SELECT USING (
    character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
);
CREATE POLICY "Users can edit own inventory" ON public.inventory_items FOR ALL USING (
    character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
);

ALTER TABLE public.automation_routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own routines" ON public.automation_routines FOR SELECT USING (
    character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
);
CREATE POLICY "Users can edit own routines" ON public.automation_routines FOR ALL USING (
    character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
);
