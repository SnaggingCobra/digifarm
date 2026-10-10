create table if not exists public.expenses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    crop_id uuid references public.crops (id) on delete set null,
    category text not null check (
            category in (
        'Seeds',
        'Fertilizer',
        'Pesticides',
        'Labor',
        'Irrigation',
        'Equipment',
        'Transport',
        'Land Preparation',
        'Animal Feed',
        'Electricity',
        'Fuel',
        'Other'
    )
),

description text,
amount numeric(12, 2) not null
    check (amount>0),

expense_date date not null default current_date,
notes text,

created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
);

create index if not exists idx_expenses_user_id
on public.expenses (user_id);

create index if not exists idx_expenses_crop_id
on public.expenses (crop_id);

alter table public.expenses enable row level security;

revoke all on table public.expenses from anon;

grant select, insert, update, delete
on table public.expenses to authenticated;

create policy "Expenses are Viewable by Owner"
on public.expenses
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Expenses are insertable by Owner"
on public.expenses
for insert
to authenticated
with check (
    (select auth.uid()) = user_id
    and (
        crop_id is null
        or exists (
            select 1
            from public.crops
            where crops.id = expenses.crop_id
            and crops.user_id = (select auth.uid())
        )
    )
);

create policy "Expenses are Updatable by owner"
on public.expenses
for update
to authenticated
using ((select auth.uid()) user_id)
with check (
    (select auth.uid()) = user_id
    and (
        crop_id is null 
        or exists (
            select 1
            from public.crops
            where crops.id = expenses.crop_id
            and crops.user_id = (select auth.uid())
        )
    )
);

create policy "expenses are deletable by owner "
on public.expenses
for delete
to authenticated
using ((select auth.uid()) = user_id);


create trigger set_expenses_updated_at
before update on public.expenses
for each row 
execute function public.set_updated_at();

