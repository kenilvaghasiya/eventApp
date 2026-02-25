create extension if not exists "pgcrypto";

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sport_type text not null,
  event_at timestamptz not null,
  description text,
  image_url text,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events add column if not exists image_url text;
alter table public.events add column if not exists image_path text;

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_venues (
  event_id uuid not null references public.events(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, venue_id)
);

create table if not exists public.sports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists idx_events_user_id on public.events(user_id);
create index if not exists idx_events_event_at on public.events(event_at);
create index if not exists idx_events_sport_type on public.events(sport_type);
create index if not exists idx_venues_user_id on public.venues(user_id);
create index if not exists idx_sports_user_id on public.sports(user_id);

alter table public.events enable row level security;
alter table public.venues enable row level security;
alter table public.event_venues enable row level security;
alter table public.sports enable row level security;

create policy "events_select_own" on public.events for select using (auth.uid() = user_id);
create policy "events_insert_own" on public.events for insert with check (auth.uid() = user_id);
create policy "events_update_own" on public.events for update using (auth.uid() = user_id);
create policy "events_delete_own" on public.events for delete using (auth.uid() = user_id);

create policy "venues_select_own" on public.venues for select using (auth.uid() = user_id);
create policy "venues_insert_own" on public.venues for insert with check (auth.uid() = user_id);
create policy "venues_update_own" on public.venues for update using (auth.uid() = user_id);
create policy "venues_delete_own" on public.venues for delete using (auth.uid() = user_id);

create policy "sports_select_own" on public.sports for select using (auth.uid() = user_id);
create policy "sports_insert_own" on public.sports for insert with check (auth.uid() = user_id);
create policy "sports_update_own" on public.sports for update using (auth.uid() = user_id);
create policy "sports_delete_own" on public.sports for delete using (auth.uid() = user_id);

create policy "event_venues_select_own" on public.event_venues
for select
using (
  exists (
    select 1
    from public.events e
    where e.id = event_id and e.user_id = auth.uid()
  )
);

create policy "event_venues_insert_own" on public.event_venues
for insert
with check (
  exists (
    select 1
    from public.events e
    where e.id = event_id and e.user_id = auth.uid()
  )
);

create policy "event_venues_delete_own" on public.event_venues
for delete
using (
  exists (
    select 1
    from public.events e
    where e.id = event_id and e.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do nothing;

create policy "event_images_select_public"
on storage.objects
for select
using (bucket_id = 'event-images');

create policy "event_images_insert_own"
on storage.objects
for insert
with check (
  bucket_id = 'event-images' and auth.uid()::text = split_part(name, '/', 1)
);

create policy "event_images_update_own"
on storage.objects
for update
using (
  bucket_id = 'event-images' and auth.uid()::text = split_part(name, '/', 1)
);

create policy "event_images_delete_own"
on storage.objects
for delete
using (
  bucket_id = 'event-images' and auth.uid()::text = split_part(name, '/', 1)
);
