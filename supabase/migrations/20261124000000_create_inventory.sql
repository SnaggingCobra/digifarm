CREATE TABLE public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth.users(id) ON DELETE CASCADE,

    name TEXT NOT NULL
        CHECK (length(trim(name)) > 0),

    category TEXT NOT NULL
        CHECK ( 
            category IN (
                'Seeds',
                'Fertilizers',
                'Pesticides',
                'Tools',
                'Equipment',
                'Others'
            )
        ),

    unit TEXT NOT NULL
        CHECK (length(trim(unit)) > 0),

    current_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0
        CHECK (current_quantity >= 0),

    reorder_level NUMERIC(12, 2) NOT NULL DEFAULT 0
        CHECK (reorder_level >= 0),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth.users(id) ON DELETE CASCADE,

    item_id UUID NOT NULL
        REFERENCES public.inventory_items(id) ON DELETE RESTRICT,

    crop_id UUID
        REFERENCES public.crops(id) ON DELETE SET NULL,

    transaction_type TEXT NOT NULL
        CHECK (
            transaction_type IN (
                'purchase',
                'usage',
                'adjustment'
            )
        ),

    quantity NUMERIC(12, 2) NOT NULL,

    unit_cost NUMERIC(12, 2)
        CHECK (unit_cost IS NULL OR unit_cost >= 0),

    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,

    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT inventory_transactions_quantity_check
    CHECK (
        (
            transaction_type IN ('purchase', 'usage')
            AND quantity > 0
        )
        OR
        (
            transaction_type = 'adjustment'
            AND quantity <> 0
        )
    )
);


CREATE INDEX inventory_items_user_id_idx
ON public.inventory_items(user_id);

CREATE INDEX inventory_transactions_user_id_idx
ON public.inventory_transactions(user_id);

CREATE INDEX inventory_transactions_item_id_idx
ON public.inventory_transactions(item_id);

CREATE INDEX inventory_transactions_crop_id_idx
ON public.inventory_transactions(crop_id);

CREATE INDEX inventory_transactions_date_idx
ON public.inventory_transactions(transaction_date);


CREATE TRIGGER set_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


CREATE OR REPLACE FUNCTION public.protect_inventory_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    -- New inventory items must start with zero stock.
    -- Initial stock should be recorded as a purchase.
    IF TG_OP = 'INSERT' THEN
        IF NEW.current_quantity <> 0 THEN
            RAISE EXCEPTION
                'Initial stock must be recorded through a purchase transaction.';
        END IF;

    -- Stock can only be changed by the transaction trigger.
    ELSIF NEW.current_quantity IS DISTINCT FROM OLD.current_quantity THEN
        IF pg_trigger_depth() < 2 THEN
            RAISE EXCEPTION
                'Stock can only be changed through inventory transactions.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER protect_inventory_quantity_trigger
BEFORE INSERT OR UPDATE
ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.protect_inventory_quantity();


CREATE OR REPLACE FUNCTION public.handle_inventory_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    item_quantity NUMERIC(12, 2);
    item_owner UUID;
    crop_owner UUID;

    old_change NUMERIC(12, 2) := 0;
    new_change NUMERIC(12, 2) := 0;

    target_item_id UUID;
BEGIN

    -- Require an authenticated user.
    IF (SELECT auth.uid()) IS NULL THEN
        RAISE EXCEPTION 'You must be signed in.';
    END IF;


    IF TG_OP IN ('UPDATE', 'DELETE') THEN

        IF OLD.user_id <> (SELECT auth.uid()) THEN
            RAISE EXCEPTION 'Access denied.';
        END IF;

        -- Do not allow changing the inventory item
        -- associated with an existing transaction.
        IF TG_OP = 'UPDATE' AND NEW.item_id <> OLD.item_id THEN
            RAISE EXCEPTION
                'You cannot change the inventory item of an existing transaction.';
        END IF;

        target_item_id := OLD.item_id;

        -- Calculate the old transaction's stock effect.
        CASE OLD.transaction_type

            WHEN 'purchase' THEN
                old_change := OLD.quantity;

            WHEN 'usage' THEN
                old_change := -OLD.quantity;

            WHEN 'adjustment' THEN
                old_change := OLD.quantity;

        END CASE;

    END IF;

    IF TG_OP IN ('INSERT', 'UPDATE') THEN

        IF NEW.user_id <> (SELECT auth.uid()) THEN
            RAISE EXCEPTION 'Invalid transaction owner.';
        END IF;

        target_item_id := NEW.item_id;

        CASE NEW.transaction_type

            WHEN 'purchase' THEN
                new_change := NEW.quantity;

            WHEN 'usage' THEN
                new_change := -NEW.quantity;

            WHEN 'adjustment' THEN
                new_change := NEW.quantity;

            ELSE
                RAISE EXCEPTION 'Invalid transaction type.';

        END CASE;


        -- Validate crop ownership.
        IF NEW.crop_id IS NOT NULL THEN

            SELECT user_id
            INTO crop_owner
            FROM public.crops
            WHERE id = NEW.crop_id;

            IF NOT FOUND
               OR crop_owner <> (SELECT auth.uid()) THEN

                RAISE EXCEPTION
                    'Crop not found or access denied.';

            END IF;

        END IF;

    END IF;


    SELECT current_quantity, user_id
    INTO item_quantity, item_owner
    FROM public.inventory_items
    WHERE id = target_item_id
    FOR UPDATE;

    IF NOT FOUND
       OR item_owner <> (SELECT auth.uid()) THEN

        RAISE EXCEPTION
            'Inventory item not found or access denied.';

    END IF;

    IF item_quantity - old_change + new_change < 0 THEN

        RAISE EXCEPTION
            'Insufficient stock. Available quantity after reversing the old transaction: %',
            item_quantity - old_change;

    END IF;


    UPDATE public.inventory_items
    SET current_quantity =
        current_quantity - old_change + new_change
    WHERE id = target_item_id;


    -- Return the correct record.
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;

END;
$$;


CREATE TRIGGER inventory_transaction_stock_trigger
BEFORE INSERT OR UPDATE OR DELETE
ON public.inventory_transactions
FOR EACH ROW
EXECUTE FUNCTION public.handle_inventory_transaction();


ALTER TABLE public.inventory_items
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.inventory_transactions
ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Users can view their inventory items"
ON public.inventory_items
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);


CREATE POLICY "Users can insert their inventory items"
ON public.inventory_items
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);


CREATE POLICY "Users can update their inventory items"
ON public.inventory_items
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);


CREATE POLICY "Users can delete their inventory items"
ON public.inventory_items
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);


CREATE POLICY "Users can view their inventory transactions"
ON public.inventory_transactions
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);


CREATE POLICY "Users can insert their inventory transactions"
ON public.inventory_transactions
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);


CREATE POLICY "Users can update their inventory transactions"
ON public.inventory_transactions
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);


CREATE POLICY "Users can delete their inventory transactions"
ON public.inventory_transactions
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);


GRANT SELECT, INSERT, UPDATE, DELETE
ON public.inventory_items
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.inventory_transactions
TO authenticated;
