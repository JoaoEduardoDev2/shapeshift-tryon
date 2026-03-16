-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Saved looks table for social sharing
create table public.saved_looks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  image_base64 text not null,
  garment_name text not null,
  garment_description text,
  mode text not null default 'photo',
  created_at timestamptz default now() not null
);

alter table public.saved_looks enable row level security;

create policy "Users can read own looks"
  on public.saved_looks for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own looks"
  on public.saved_looks for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own looks"
  on public.saved_looks for delete
  to authenticated
  using (auth.uid() = user_id);

-- Public looks (for shared links)
create policy "Anyone can read public looks by id"
  on public.saved_looks for select
  to anon
  using (true);