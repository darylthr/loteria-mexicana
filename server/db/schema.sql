-- ─────────────────────────────────────────────────────────────
-- Lotería API — Supabase schema
-- Run this in the Supabase SQL editor before starting the server.
-- ─────────────────────────────────────────────────────────────

-- Player profiles. One row per auth.users record.
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  balance      integer not null default 1000,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Clients (anon key) may read only their own profile. All writes go
-- through the backend using the service-role key, which bypasses RLS.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Persistent custom boards (16 card ids each), owned by a player.
create table if not exists public.custom_boards (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  card_ids   integer[] not null,
  created_at timestamptz not null default now()
);

create index if not exists custom_boards_user_id_idx
  on public.custom_boards (user_id);

alter table public.custom_boards enable row level security;

drop policy if exists "Users can read own boards" on public.custom_boards;
create policy "Users can read own boards"
  on public.custom_boards for select
  using (auth.uid() = user_id);
