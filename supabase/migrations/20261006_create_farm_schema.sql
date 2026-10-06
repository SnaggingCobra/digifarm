create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text,
  phone text,
  farm_name text,
  farm_location text,
  farm_size numeric check (farm_size is null or farm_size >= 0),
  land_unit text check (land_unit is null or land_unit in ('ropani', 'aana', 'bigha', 'kattha', 'dhur', 'hectare', 'acre'))
);

create table if not exists public.crops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  variety text,
  status text not null default 'planned' check (status in ('planned', 'growing', 'ready', 'harvested', 'completed')),
  planting_date date,
  expected_harvest_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_updated_at on public.profiles (updated_at);
create index if not exists idx_crops_user_id on public.crops (user_id);
create index if not exists idx_crops_status on public.crops (status);

alter table public.profiles enable row level security;
alter table public.crops enable row level security;

create policy "Profiles are viewable by owner"
on public.profiles for select
using (auth.uid() = id);

create policy "Profiles are insertable by owner"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Profiles are updatable by owner"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Crops are viewable by owner"
on public.crops for select
using (auth.uid() = user_id);

create policy "Crops are insertable by owner"
on public.crops for insert
with check (auth.uid() = user_id);

create policy "Crops are updatable by owner"
on public.crops for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Crops are deletable by owner"
on public.crops for delete
using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, farm_name, farm_location, farm_size, land_unit)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    coalesce(new.raw_user_meta_data ->> 'farm_name', null),
    coalesce(new.raw_user_meta_data ->> 'farm_location', null),
    case
      when nullif(new.raw_user_meta_data ->> 'farm_size', '') is null then null
      else (new.raw_user_meta_data ->> 'farm_size')::numeric
    end,
    coalesce(new.raw_user_meta_data ->> 'land_unit', 'ropani')
  )
  on conflict (id) do update
  set full_name = coalesce(excluded.full_name, public.profiles.full_name),
      farm_name = coalesce(excluded.farm_name, public.profiles.farm_name),
      farm_location = coalesce(excluded.farm_location, public.profiles.farm_location),
      farm_size = coalesce(excluded.farm_size, public.profiles.farm_size),
      land_unit = coalesce(excluded.land_unit, public.profiles.land_unit),
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_crops_updated_at on public.crops;
create trigger set_crops_updated_at
before update on public.crops
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
