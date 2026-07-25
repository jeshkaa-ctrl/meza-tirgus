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

-- 5. Pavadzīmju reģistrs
create table if not exists public.pavadzimes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  datums         text default '',
  pvz_nr         text default '',
  no_kurienes    text default '',
  cirt_apl_nr    text default '',
  sortiments     text default '',
  suga           text default '',
  piegade        text default '',
  kubi           numeric,
  veids          text default '',
  klients        text default '',
  kubi_uzmeriti  numeric,
  soferis        text default '',
  auto           text default '',
  km             numeric,
  created_at     timestamptz default now()
);

alter table public.pavadzimes enable row level security;
create policy "own_pavadzimes" on public.pavadzimes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 6. Klienta iestatījumi (šoferi, piegādes vietas, uzņēmuma nosaukums)
create table if not exists public.klienta_iestatijumi (
  user_id              uuid references auth.users(id) on delete cascade primary key,
  uznemums_nosaukums   text default '',
  soferi               jsonb default '[]',
  piegades_vietas      jsonb default '[]',
  updated_at           timestamptz default now()
);

alter table public.klienta_iestatijumi enable row level security;
create policy "own_iestatijumi" on public.klienta_iestatijumi for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Admins var lasīt/rakstīt visus iestatījumus (nomainīt uz īsto admin user ID)
-- create policy "admin_iestatijumi" on public.klienta_iestatijumi for all using (auth.uid() = 'ADMIN_UUID_ŠEIT');

-- 7. Vienreizējo maksājumu tabula
create table if not exists public.one_time_payments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  plan_id        text not null,
  merchant_ref   text unique,
  amount         numeric,
  status         text default 'paid',
  paid_at        timestamptz default now(),
  created_at     timestamptz default now()
);

alter table public.one_time_payments enable row level security;
create policy "own_payments" on public.one_time_payments for select using (auth.uid() = user_id);

-- 8. Profilu papildlauki kopienas funkcijai
alter table public.profiles add column if not exists loma text default '';
alter table public.profiles add column if not exists novads text default '';
alter table public.profiles add column if not exists bio text default '';
alter table public.profiles add column if not exists avatar_url text default '';

-- 9. Kopienas posti
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  teksts     text not null,
  bilde_url  text,
  tips       text default 'post',
  created_at timestamptz default now()
);
alter table public.posts enable row level security;
create policy "posts_lasit"   on public.posts for select using (true);
create policy "posts_rakstit" on public.posts for insert with check (auth.uid() = user_id);
create policy "posts_dzest"   on public.posts for delete using (auth.uid() = user_id);

-- 10. Reakcijas (like)
create table if not exists public.post_reakcijas (
  id      uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  tips    text default 'like',
  unique(post_id, user_id)
);
alter table public.post_reakcijas enable row level security;
create policy "reakcijas_visiem" on public.post_reakcijas for all using (true) with check (auth.uid() = user_id);

-- 11. Komentāri
create table if not exists public.komentari (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references public.posts(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  teksts     text not null,
  created_at timestamptz default now()
);
alter table public.komentari enable row level security;
create policy "komentari_lasit"   on public.komentari for select using (true);
create policy "komentari_rakstit" on public.komentari for insert with check (auth.uid() = user_id);

-- 12. Grupas
create table if not exists public.grupas (
  id         uuid primary key default gen_random_uuid(),
  nosaukums  text not null,
  apraksts   text,
  tips       text default 'publiska',
  izveidoja  uuid references auth.users(id),
  created_at timestamptz default now()
);
alter table public.grupas enable row level security;
create policy "grupas_lasit"  on public.grupas for select using (true);
create policy "grupas_veidot" on public.grupas for insert with check (auth.uid() = izveidoja);

-- 13. Grupu dalībnieki
create table if not exists public.grupas_dalibnieki (
  id       uuid primary key default gen_random_uuid(),
  grupa_id uuid references public.grupas(id) on delete cascade not null,
  user_id  uuid references auth.users(id) on delete cascade not null,
  loma     text default 'dalibnieks',
  unique(grupa_id, user_id)
);
alter table public.grupas_dalibnieki enable row level security;
create policy "dalibnieki_lasit"       on public.grupas_dalibnieki for select using (true);
create policy "dalibnieki_pievienoties" on public.grupas_dalibnieki for insert with check (auth.uid() = user_id);

-- 14. Admin politika — Artijs redz VISAS pavadzīmes (izpildi Supabase SQL Editor)
create policy "admin_visas_pavadzimes" on public.pavadzimes
  for select using (
    auth.uid() = user_id OR
    auth.jwt() ->> 'email' = 'mezatirgus.info@gmail.com'
  );

-- 14b. FK no posts uz profiles (ļauj PostgREST joinot profilus)
-- Izpildi tikai ja posts tabula tika tikko izveidota:
-- alter table public.posts
--   drop constraint if exists posts_user_id_fkey,
--   add constraint posts_user_id_fkey
--     foreign key (user_id) references public.profiles(id) on delete cascade;

-- 15. Seed dati — demo posti (aizstāj USER_ID ar reālu user uuid no auth.users)
-- insert into public.posts (user_id, teksts, tips) values
--   ('USER_ID', 'Šodien Gaujas krastā pamanīju melnā stārķa ligzdu vecajā priežu mežā. Cirte plānota tuvākajā kvartālā — kas jādara? Vai pietiek paziņot VMD vai arī jāsazinās ar DAP?', 'post'),
--   ('USER_ID', 'Kāds ir jūsu pieredze ar Bitterliha relaskopu? Tikko ieguvu un mēģinu izprast metodi. Cik parauglaukumus jāizdara uz 5 ha cirsmu?', 'post'),
--   ('USER_ID', 'Pārdodu priežu stādiņus — P+1 frakcija, 15-25 cm. Cena 0.12 EUR/gab, no 10 000 gab. Vidzeme.', 'sludinajums'),
--   ('USER_ID', 'Harvesteris Ponsse Ergo, 2019.g., 12 000 mth. Pilna dokumentācija. Pieprasiet cenu.', 'sludinajums'),
--   ('USER_ID', 'Jautājums par ekoloģiskajiem kokiem — ja cirsmā nav iepriekšējās paaudzes koku, cik lielus kokus jāatstāj? Saprotu ka D > vidējam D nogabalā, bet vai ir kāds minimums?', 'post');

-- 15. SVARĪGI: Supabase Dashboard → Authentication → Settings
--    Izslēdz "Enable email confirmations" lai lietotāji var pieteikties uzreiz pēc reģistrācijas
