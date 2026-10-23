-- AGRONEX: esquema inicial para Supabase PostgreSQL
create extension if not exists pgcrypto;
create table if not exists public.parcels (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null,
 latitude double precision not null check (latitude between -90 and 90),
 longitude double precision not null check (longitude between -180 and 180),
 area_ha numeric(12,3) check (area_ha > 0),
 created_at timestamptz not null default now()
);
create table if not exists public.crop_history (
 id uuid primary key default gen_random_uuid(),
 parcel_id uuid not null references public.parcels(id) on delete cascade,
 crop_name text not null,
 planted_on date,
 harvested_on date,
 constraint valid_dates check (harvested_on is null or planted_on is null or harvested_on >= planted_on)
);
create table if not exists public.environmental_observations (
 id bigserial primary key,
 parcel_id uuid not null references public.parcels(id) on delete cascade,
 observed_on date not null,
 source text not null,
 temperature_c double precision,
 precipitation_mm double precision check (precipitation_mm is null or precipitation_mm >= 0),
 radiation_mj_m2 double precision,
 fetched_at timestamptz not null default now(),
 unique (parcel_id, observed_on, source)
);
create table if not exists public.analysis_runs (
 id uuid primary key default gen_random_uuid(),
 parcel_id uuid not null references public.parcels(id) on delete cascade,
 model_name text not null,
 model_version text not null,
 result jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists obs_parcel_date_idx on public.environmental_observations(parcel_id, observed_on);
create index if not exists runs_parcel_date_idx on public.analysis_runs(parcel_id, created_at desc);
alter table public.parcels enable row level security;
alter table public.crop_history enable row level security;
alter table public.environmental_observations enable row level security;
alter table public.analysis_runs enable row level security;
create policy "owner_parcels" on public.parcels for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "owner_crop_history" on public.crop_history for all to authenticated using (exists(select 1 from public.parcels p where p.id=parcel_id and p.owner_id=(select auth.uid()))) with check (exists(select 1 from public.parcels p where p.id=parcel_id and p.owner_id=(select auth.uid())));
create policy "owner_observations" on public.environmental_observations for all to authenticated using (exists(select 1 from public.parcels p where p.id=parcel_id and p.owner_id=(select auth.uid()))) with check (exists(select 1 from public.parcels p where p.id=parcel_id and p.owner_id=(select auth.uid())));
create policy "owner_analysis" on public.analysis_runs for all to authenticated using (exists(select 1 from public.parcels p where p.id=parcel_id and p.owner_id=(select auth.uid()))) with check (exists(select 1 from public.parcels p where p.id=parcel_id and p.owner_id=(select auth.uid())));
