-- Simpletide: site visit funnel analytics + quick product out-of-stock overrides
-- Managed by the `admin-orders` Edge Function (locked to simpletidebusiness@gmail.com).

create table if not exists public.site_visits (
  id bigserial primary key,
  visitor_id text not null,
  path text not null,
  stage text not null default 'browse',
  created_at timestamptz not null default now()
);

create index if not exists idx_site_visits_created_at
  on public.site_visits (created_at desc);

create index if not exists idx_site_visits_visitor_created
  on public.site_visits (visitor_id, created_at desc);

alter table public.site_visits enable row level security;

drop policy if exists "Anyone can insert site visits" on public.site_visits;
create policy "Anyone can insert site visits"
  on public.site_visits
  for insert
  to anon, authenticated
  with check (char_length(visitor_id) between 4 and 128 and char_length(path) between 1 and 256);

-- No public SELECT on site_visits: only server/admin Edge Functions (service_role) read traffic analytics.

create table if not exists public.product_stock_overrides (
  product_key text primary key,
  out_of_stock boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.product_stock_overrides enable row level security;

drop policy if exists "Public can read stock overrides" on public.product_stock_overrides;
create policy "Public can read stock overrides"
  on public.product_stock_overrides
  for select
  to anon, authenticated
  using (true);

-- Writes to product_stock_overrides are restricted to service_role (admin-orders Edge Function).
