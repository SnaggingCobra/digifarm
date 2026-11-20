CREATE TABLE public.harvests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE RESTRICT,
    harvest_date DATE NOT NUll DEFAULT CURRENT_DATE,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL DEFAULT 'kg',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.sales (
    id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    harvest_id UUID NOT NULL REFERENCES public.harvests(id) ON DELETE RESTRICT,
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price > 0),
    buyer TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE POLICY "Users can create their own sales"
ON public.sales
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales"
ON public.sales
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


CREATE POLICY "Users can delete their own sales"
ON public.sales
FOR DELETE
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.validate_harvest_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    harvested_quantity NUMERIC(12, 2);
    already_sold NUMERIC(12, 2);
BEGIN
    -- Lock the harvest row to prevent simultaneous
    -- sales from exceeding its quantity.
    SELECT quantity
    INTO harvested_quantity
    FROM public.harvests
    WHERE id = NEW.harvest_id
      AND user_id = NEW.user_id
    FOR UPDATE;

    -- Make sure the harvest belongs to this user.
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Harvest not found or does not belong to this user.';
    END IF;

    -- Calculate the quantity already sold.
    SELECT COALESCE(SUM(quantity), 0)
    INTO already_sold
    FROM public.sales
    WHERE harvest_id = NEW.harvest_id
      AND id IS DISTINCT FROM NEW.id;

    -- Reject the sale if it exceeds the harvest quantity.
    IF already_sold + NEW.quantity > harvested_quantity THEN
        RAISE EXCEPTION
            'Sale quantity exceeds available harvest. Harvested: %, Already sold: %, Requested: %',
            harvested_quantity,
            already_sold,
            NEW.quantity;
    END IF;

    RETURN NEW;
END;
$$;


CREATE TRIGGER check_harvest_sale_quantity
BEFORE INSERT OR UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.validate_harvest_sale();