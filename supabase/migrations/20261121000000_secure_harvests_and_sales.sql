ALTER TABLE public.harvests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.harvests, public.sales FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.harvests, public.sales TO authenticated;

CREATE POLICY "Harvests are viewable by owner"
ON public.harvests
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Harvests are insertable by owner"
ON public.harvests
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
        SELECT 1
        FROM public.crops
        WHERE crops.id = harvests.crop_id
          AND crops.user_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Harvests are updatable by owner"
ON public.harvests
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
        SELECT 1
        FROM public.crops
        WHERE crops.id = harvests.crop_id
          AND crops.user_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Harvests are deletable by owner"
ON public.harvests
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can update their own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can delete their own sales" ON public.sales;

CREATE POLICY "Sales are viewable by owner"
ON public.sales
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Sales are insertable by owner"
ON public.sales
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
        SELECT 1
        FROM public.harvests
        WHERE harvests.id = sales.harvest_id
          AND harvests.user_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Sales are updatable by owner"
ON public.sales
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
        SELECT 1
        FROM public.harvests
        WHERE harvests.id = sales.harvest_id
          AND harvests.user_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Sales are deletable by owner"
ON public.sales
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.prevent_harvest_below_sold_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    sold_quantity NUMERIC(12, 2);
BEGIN
    IF NEW.quantity < OLD.quantity THEN
        SELECT COALESCE(SUM(quantity), 0)
        INTO sold_quantity
        FROM public.sales
        WHERE harvest_id = OLD.id;

        IF NEW.quantity < sold_quantity THEN
            RAISE EXCEPTION
                'Harvest quantity cannot be less than the quantity already sold (%).',
                sold_quantity;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_harvest_below_sold_quantity
BEFORE UPDATE OF quantity ON public.harvests
FOR EACH ROW
EXECUTE FUNCTION public.prevent_harvest_below_sold_quantity();
