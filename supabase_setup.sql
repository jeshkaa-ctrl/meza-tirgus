-- Izpildi šo Supabase SQL Editor

-- 1. Profilu tabula
create table if not exists public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  vards         text default '',
  uznemums      text default '',
  darbiba       text default '',
  talrunis      text default '',
  bazesNovads   text default '',
  papilduNovadi text[] default '{}',
  tips          text default 'privatpersona',
  created_at    timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "select_own_profile" on public.profiles for select using (auth.uid() = id);
create policy "update_own_profile" on public.profiles for update using (auth.uid() = id);
create policy "insert_own_profile" on public.profiles for insert with check (auth.uid() = id);

-- 2. Abonementa plāni
create table if not exists public.subscription_plans (
  id             text primary key,
  name           text not null,
  price_monthly  numeric,
  price_yearly   numeric,
  features       jsonb
);

insert into public.subscription_plans values
  ('free',     'Bezmaksas', 0,   0,   '{"pdf":false,"archive":false,"listings":false,"auctions_publish":false,"waybills":false}'::jsonb),
  ('pro',      'Pro',       19,  159, '{"pdf":true,"archive":true,"listings":true,"auctions_publish":false,"waybills":false}'::jsonb),
  ('business', 'Komercija', 59,  490, '{"pdf":true,"archive":true,"listings":true,"auctions_publish":true,"waybills":true}'::jsonb)
on conflict (id) do nothing;

-- 3. Lietotāju abonementi
create table if not exists public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references auth.users(id) on delete cascade not null,
  plan_id              text references public.subscription_plans(id) default 'free',
  status               text default 'active',
  billing_cycle        text default 'monthly',
  current_period_start timestamptz default now(),
  current_period_end   timestamptz default (now() + interval '1 month'),
  created_at           timestamptz default now(),
  unique(user_id)
);

alter table public.subscriptions enable row level security;
create policy "select_own_sub" on public.subscriptions for select using (auth.uid() = user_id);
create policy "update_own_sub" on public.subscriptions for update using (auth.uid() = user_id);

-- 4. Trigger — automātiski izveido profilu un bezmaksas abonementu jaunam lietotājam
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  insert into public.subscriptions (user_id, plan_id) values (new.id, 'free') on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. SVARĪGI: Supabase Dashboard → Authentication → Settings
--    Izslēdz "Enable email confirmations" lai lietotāji var pieteikties uzreiz pēc reģistrācijas
