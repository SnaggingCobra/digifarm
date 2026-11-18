CREATE TABLE public.harvests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.user(id) ON DELETE CASCADE,

    crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE RESTRICT,

    harvest_date DATE NOT NUll DEFAULT CURRENT_DATE,

    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),

    unit TEXT NOT NULL DEFAULT 'kg',

    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
