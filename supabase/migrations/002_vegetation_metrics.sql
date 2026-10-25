-- Métricas verificadas con trazabilidad y aislamiento por usuario.
create table if not exists public.vegetation_metrics (
 id uuid primary key default gen_random_uuid(),
 parcel_id uuid not null references public.parcels(id) on delete cascade,
 observed_on date not null,
 source_product text not null check (source_product in ('HLSL30','HLSS30')),
 granule_id text not null,
 ndvi_mean double precision check (ndvi_mean between -1 and 1),
 valid_pixels integer not null check (valid_pixels>0),
 created_at timestamptz not null default now(),
 unique(parcel_id,observed_on,source_product,granule_id)
);
alter table public.vegetation_metrics enable row level security;
create policy "owner_vegetation_select" on public.vegetation_metrics for select to authenticated
using (exists(select 1 from public.parcels p where p.id=parcel_id and p.owner_id=(select auth.uid())));
create policy "owner_vegetation_insert" on public.vegetation_metrics for insert to authenticated
with check (exists(select 1 from public.parcels p where p.id=parcel_id and p.owner_id=(select auth.uid())));
