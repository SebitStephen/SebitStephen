-- LocalPro: core schema
create extension if not exists "pgcrypto";

-- Service categories the platform supports. v1 only accepts bookings for
-- 'cleaning' (see README "Start small" scope) -- the rest exist so the
-- marketplace can expand into new verticals without a schema change.
create table if not exists public.categories (
  slug text primary key,
  label text not null,
  icon text not null,
  is_live boolean not null default false
);

insert into public.categories (slug, label, icon, is_live) values
  ('cleaning', 'Home Cleaning', '🧹', true),
  ('plumbing', 'Plumbing', '🔧', false),
  ('hairdresser', 'Hairdresser & Barber', '💇', false),
  ('handyman', 'Handyman', '🔨', false),
  ('car-detailing', 'Car Washing & Detailing', '🚗', false),
  ('gardening', 'Gardening', '🌳', false),
  ('moving', 'Moving', '📦', false),
  ('tech-repair', 'Computer & Phone Repair', '💻', false),
  ('pet-services', 'Pet Services', '🐕', false)
on conflict (slug) do nothing;

-- One row per authenticated user, created automatically by
-- handle_new_user() below. role defaults to 'customer'; the RoleSetup
-- onboarding screen lets a user switch to 'provider' once. 'admin' is
-- assigned manually (see README).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'provider', 'admin')),
  full_name text not null default '',
  phone text,
  city text,
  created_at timestamptz not null default now()
);

-- Business profile for a provider. One-to-one with profiles(id).
create table if not exists public.provider_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  category text not null references public.categories(slug),
  business_name text not null,
  bio text not null default '',
  city text not null,
  is_approved boolean not null default false,
  avg_rating numeric(3, 2) not null default 0,
  review_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists provider_profiles_category_city_idx
  on public.provider_profiles (category, city) where is_approved;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_profiles(id) on delete cascade,
  title text not null,
  description text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  created_at timestamptz not null default now()
);

create index if not exists services_provider_id_idx on public.services (provider_id);

-- Weekly working hours. weekday: 0 = Sunday ... 6 = Saturday.
create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_profiles(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null check (end_time > start_time)
);

create index if not exists availability_provider_id_idx on public.availability (provider_id);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.provider_profiles(id) on delete cascade,
  service_id uuid not null references public.services(id),
  scheduled_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  notes text not null default '',
  -- price/platform_fee/provider_payout are snapshotted by
  -- set_booking_price() below at insert time, from the service's price at
  -- that moment -- never trust these fields if sent by the client.
  price numeric(10, 2) not null,
  platform_fee numeric(10, 2) not null,
  provider_payout numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_customer_id_idx on public.bookings (customer_id);
create index if not exists bookings_provider_id_idx on public.bookings (provider_id);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.provider_profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists reviews_provider_id_idx on public.reviews (provider_id);

-- ---------------------------------------------------------------------
-- Functions & triggers
-- ---------------------------------------------------------------------

-- Platform commission taken on every booking. Changing it only affects
-- bookings created after the change since price/fee are snapshotted onto
-- the row at booking time (see set_booking_price()).
create or replace function public.platform_fee_percent()
returns numeric
language sql immutable
as $$ select 0.10 $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute procedure public.set_updated_at();

-- Prices come from the server, not the client: look up the service's
-- current price and compute the platform fee / provider payout at insert
-- time, overwriting whatever the client sent.
create or replace function public.set_booking_price()
returns trigger
language plpgsql
as $$
declare
  service_price numeric(10, 2);
  fee_pct numeric;
begin
  select price into service_price from public.services where id = new.service_id;
  if service_price is null then
    raise exception 'Unknown service_id %', new.service_id;
  end if;

  fee_pct := public.platform_fee_percent();
  new.price := service_price;
  new.platform_fee := round(service_price * fee_pct, 2);
  new.provider_payout := service_price - new.platform_fee;
  return new;
end;
$$;

drop trigger if exists bookings_set_price on public.bookings;
create trigger bookings_set_price
  before insert on public.bookings
  for each row execute procedure public.set_booking_price();

-- Creates a profile row the moment someone signs up, so the app never has
-- to handle a signed-in user with no profile.
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keeps provider_profiles.avg_rating / review_count in sync with reviews.
create or replace function public.refresh_provider_rating()
returns trigger
language plpgsql
as $$
declare
  target_provider uuid := coalesce(new.provider_id, old.provider_id);
begin
  update public.provider_profiles p
  set avg_rating = coalesce(
        (select round(avg(rating)::numeric, 2) from public.reviews where provider_id = target_provider), 0),
      review_count = (select count(*) from public.reviews where provider_id = target_provider)
  where p.id = target_provider;
  return null;
end;
$$;

drop trigger if exists reviews_refresh_rating on public.reviews;
create trigger reviews_refresh_rating
  after insert or update or delete on public.reviews
  for each row execute procedure public.refresh_provider_rating();

-- Returns just the busy time ranges for a provider on a given day, so the
-- booking screen can compute open slots without needing read access to
-- other customers' bookings (which RLS below correctly denies).
create or replace function public.provider_busy_slots(p_provider_id uuid, p_date date)
returns table (starts_at timestamptz, duration_minutes integer)
language sql
stable security definer set search_path = public
as $$
  select b.scheduled_at, s.duration_minutes
  from public.bookings b
  join public.services s on s.id = b.service_id
  where b.provider_id = p_provider_id
    and b.status in ('pending', 'accepted')
    and b.scheduled_at::date = p_date;
$$;

grant execute on function public.provider_busy_slots(uuid, date) to anon, authenticated;

-- select-only helper used by RLS policies below. security definer so it
-- can read profiles without recursing back into the profiles policy it's
-- used from.
create or replace function public.is_admin()
returns boolean
language sql
stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.categories enable row level security;
drop policy if exists "Categories are public" on public.categories;
create policy "Categories are public" on public.categories for select using (true);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile" on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

alter table public.provider_profiles enable row level security;

drop policy if exists "Provider profiles are visible when approved or owned" on public.provider_profiles;
create policy "Provider profiles are visible when approved or owned" on public.provider_profiles
  for select using (is_approved or auth.uid() = id or public.is_admin());

drop policy if exists "Providers create their own profile" on public.provider_profiles;
create policy "Providers create their own profile" on public.provider_profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Providers update their own profile" on public.provider_profiles;
create policy "Providers update their own profile" on public.provider_profiles
  for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

alter table public.services enable row level security;

drop policy if exists "Services are visible for approved providers" on public.services;
create policy "Services are visible for approved providers" on public.services
  for select using (
    exists (
      select 1 from public.provider_profiles p
      where p.id = provider_id and (p.is_approved or p.id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "Providers manage their own services" on public.services;
create policy "Providers manage their own services" on public.services
  for all using (provider_id = auth.uid()) with check (provider_id = auth.uid());

alter table public.availability enable row level security;

drop policy if exists "Availability is visible for approved providers" on public.availability;
create policy "Availability is visible for approved providers" on public.availability
  for select using (
    exists (
      select 1 from public.provider_profiles p
      where p.id = provider_id and (p.is_approved or p.id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "Providers manage their own availability" on public.availability;
create policy "Providers manage their own availability" on public.availability
  for all using (provider_id = auth.uid()) with check (provider_id = auth.uid());

alter table public.bookings enable row level security;

drop policy if exists "Customers and providers view their own bookings" on public.bookings;
create policy "Customers and providers view their own bookings" on public.bookings
  for select using (customer_id = auth.uid() or provider_id = auth.uid() or public.is_admin());

drop policy if exists "Customers create bookings for themselves" on public.bookings;
create policy "Customers create bookings for themselves" on public.bookings
  for insert with check (customer_id = auth.uid());

-- v1 keeps status-transition rules (who may move a booking to which
-- status) in the app layer rather than the database -- see README roadmap
-- for hardening this with a check constraint / trigger.
drop policy if exists "Customers and providers update their own bookings" on public.bookings;
create policy "Customers and providers update their own bookings" on public.bookings
  for update
  using (customer_id = auth.uid() or provider_id = auth.uid() or public.is_admin())
  with check (customer_id = auth.uid() or provider_id = auth.uid() or public.is_admin());

alter table public.reviews enable row level security;

drop policy if exists "Reviews are public" on public.reviews;
create policy "Reviews are public" on public.reviews for select using (true);

drop policy if exists "Customers review their own completed bookings" on public.reviews;
create policy "Customers review their own completed bookings" on public.reviews
  for insert with check (
    customer_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.customer_id = auth.uid() and b.status = 'completed'
    )
  );
