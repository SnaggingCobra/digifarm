-- Tighten the initial farm schema without changing or deleting user data.

create index if not exists idx_crops_user_id_created_at
on public.crops (user_id, created_at desc);

revoke all on table public.profiles from anon;
revoke all on table public.crops from anon;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.crops to authenticated;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
drop policy if exists "Profiles are insertable by owner" on public.profiles;
drop policy if exists "Profiles are updatable by owner" on public.profiles;
drop policy if exists "Profiles are deletable by owner" on public.profiles;
drop policy if exists "Crops are viewable by owner" on public.crops;
drop policy if exists "Crops are insertable by owner" on public.crops;
drop policy if exists "Crops are updatable by owner" on public.crops;
drop policy if exists "Crops are deletable by owner" on public.crops;

create policy "Profiles are viewable by owner"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Profiles are insertable by owner"
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

create policy "Profiles are updatable by owner"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Profiles are deletable by owner"
on public.profiles for delete to authenticated
using ((select auth.uid()) = id);

create policy "Crops are viewable by owner"
on public.crops for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Crops are insertable by owner"
on public.crops for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Crops are updatable by owner"
on public.crops for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Crops are deletable by owner"
on public.crops for delete to authenticated
using ((select auth.uid()) = user_id);

alter function public.set_updated_at() set search_path = '';
alter function public.handle_new_user() set search_path = '';
revoke execute on function public.handle_new_user() from public, anon, authenticated;
