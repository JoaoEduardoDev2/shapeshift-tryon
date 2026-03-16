-- Products table
create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  category text not null default 'tops',
  image_url text,
  sku text,
  price numeric(10,2),
  sizes text[] default '{}',
  colors text[] default '{}',
  is_active boolean default true,
  tryon_count integer default 0,
  share_count integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.products enable row level security;

create policy "Users manage own products" on public.products
  for all to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Analytics events
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  event_type text not null,
  product_id uuid references public.products(id) on delete set null,
  metadata jsonb default '{}',
  created_at timestamptz default now() not null
);

alter table public.analytics_events enable row level security;

create policy "Users read own events" on public.analytics_events
  for select to authenticated using (auth.uid() = user_id);

create policy "Users insert own events" on public.analytics_events
  for insert to authenticated with check (auth.uid() = user_id);

-- Store settings
create table public.store_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  store_name text default '',
  logo_url text,
  primary_color text default '#3b82f6',
  domain text,
  platform text,
  platform_url text,
  tracking_pixel text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.store_settings enable row level security;

create policy "Users manage own settings" on public.store_settings
  for all to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Storage bucket for product images
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true);

create policy "Authenticated users can upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images');

create policy "Anyone can view product images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');

create policy "Users can delete own product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images');