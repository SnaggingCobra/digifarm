ALTER TABLE public.expenses
DROP CONSTRAINT IF EXISTS expenses_crop_id_fkey;

ALTER TABLE public.expenses
ADD CONSTRAINT expenses_crop_id_fkey
FOREIGN KEY (crop_id)
REFERENCES public.crops(id)
ON DELETE CASCADE;

ALTER TABLE public.harvests
DROP CONSTRAINT IF EXISTS harvests_crop_id_fkey;

ALTER TABLE public.harvests
ADD CONSTRAINT harvests_crop_id_fkey
FOREIGN KEY (crop_id)
REFERENCES public.crops(id)
ON DELETE CASCADE;

ALTER TABLE public.sales
DROP CONSTRAINT IF EXISTS sales_harvest_id_fkey;

ALTER TABLE public.sales
ADD CONSTRAINT sales_harvest_id_fkey
FOREIGN KEY (harvest_id)
REFERENCES public.harvests(id)
ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.reset_farm_records()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    IF (SELECT auth.uid()) IS NULL THEN
        RAISE EXCEPTION 'You must be signed in to reset farm records.'
            USING ERRCODE = '28000';
    END IF;

    DELETE FROM public.expenses
    WHERE user_id = (SELECT auth.uid());

    DELETE FROM public.crops
    WHERE user_id = (SELECT auth.uid());
END;
$$;

REVOKE ALL ON FUNCTION public.reset_farm_records() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_farm_records() TO authenticated;
