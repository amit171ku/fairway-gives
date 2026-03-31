-- ============================================================
-- FAIRWAY GIVES — COMPLETE DATABASE SCHEMA
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text unique not null,
  role text default 'subscriber' check (role in ('subscriber', 'admin')),
  charity_id uuid,
  charity_pct numeric default 10 check (charity_pct >= 10 and charity_pct <= 100),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan text check (plan in ('monthly', 'yearly')),
  status text default 'inactive' check (status in ('active', 'cancelled', 'lapsed', 'trialing', 'inactive')),
  current_period_end timestamptz,
  amount numeric not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- CHARITIES
-- ============================================================
create table public.charities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  image_url text,
  website_url text,
  is_featured boolean default false,
  is_active boolean default true,
  total_raised numeric default 0,
  upcoming_event text,
  event_date date,
  created_at timestamptz default now()
);

-- Seed charities
insert into public.charities (name, description, image_url, is_featured, total_raised, upcoming_event, event_date) values
  ('Macmillan Golf Days', 'Funding cancer support through community golf events and charity rounds nationwide.', 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400', true, 4820, 'Annual Charity Golf Day', '2026-06-15'),
  ('Greenkeepers Trust', 'Supporting sustainable golf course management and ecological conservation across the UK.', 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400', false, 3240, 'Course Conservation Walk', '2026-05-20'),
  ('Junior Golf Foundation', 'Getting young people onto the course — equipment, coaching bursaries, and free junior memberships.', 'https://images.unsplash.com/photo-1592919505780-303950717480?w=400', false, 2100, 'Junior Open Day', '2026-07-08'),
  ('Accessible Fairways', 'Making golf genuinely inclusive for disabled players through adapted equipment and course access.', 'https://images.unsplash.com/photo-1576613109753-27804de2cbbf?w=400', false, 1840, 'Inclusive Golf Morning', '2026-05-30');

-- ============================================================
-- SCORES (rolling 5 enforced by trigger)
-- ============================================================
create table public.scores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  points integer not null check (points >= 1 and points <= 45),
  played_at date not null,
  created_at timestamptz default now()
);

-- Rolling-5 trigger: keep only latest 5 per user
create or replace function public.enforce_rolling_scores()
returns trigger language plpgsql security definer as $$
begin
  delete from public.scores
  where user_id = NEW.user_id
    and id not in (
      select id from public.scores
      where user_id = NEW.user_id
      order by played_at desc, created_at desc
      limit 5
    );
  return NEW;
end;
$$;

create trigger after_score_insert
  after insert on public.scores
  for each row execute function public.enforce_rolling_scores();

-- ============================================================
-- DRAWS
-- ============================================================
create table public.draws (
  id uuid primary key default uuid_generate_v4(),
  draw_month text not null, -- e.g. '2026-03'
  draw_date date,
  drawn_numbers integer[] not null default '{}',
  mode text default 'random' check (mode in ('random', 'weighted_frequent', 'weighted_rare')),
  status text default 'draft' check (status in ('draft', 'simulated', 'published')),
  prize_pool_total numeric default 0,
  jackpot_carry_forward numeric default 0,
  five_match_pool numeric default 0,
  four_match_pool numeric default 0,
  three_match_pool numeric default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- DRAW RESULTS
-- ============================================================
create table public.draw_results (
  id uuid primary key default uuid_generate_v4(),
  draw_id uuid references public.draws(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  matched_count integer not null check (matched_count in (3, 4, 5)),
  prize_amount numeric not null default 0,
  payment_status text default 'pending' check (payment_status in ('pending', 'paid')),
  verification_status text default 'pending' check (verification_status in ('pending', 'approved', 'rejected')),
  proof_url text,
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- CHARITY CONTRIBUTIONS
-- ============================================================
create table public.charity_contributions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  charity_id uuid references public.charities(id) not null,
  subscription_id uuid references public.subscriptions(id),
  amount numeric not null,
  type text default 'subscription' check (type in ('subscription', 'independent')),
  contributed_at timestamptz default now()
);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );

  insert into public.subscriptions (user_id, amount, status)
  values (NEW.id, 0, 'inactive');

  return NEW;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- UPDATE updated_at TRIGGERS
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
create trigger set_draws_updated_at before update on public.draws for each row execute function public.set_updated_at();
create trigger set_draw_results_updated_at before update on public.draw_results for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.scores enable row level security;
alter table public.charities enable row level security;
alter table public.draws enable row level security;
alter table public.draw_results enable row level security;
alter table public.charity_contributions enable row level security;

-- Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can update all profiles" on public.profiles for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Subscriptions
create policy "Users can view own subscription" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Service role manages subscriptions" on public.subscriptions for all using (true);

-- Scores
create policy "Users manage own scores" on public.scores for all using (auth.uid() = user_id);
create policy "Admins can view all scores" on public.scores for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can edit all scores" on public.scores for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Charities (public read)
create policy "Anyone can view active charities" on public.charities for select using (is_active = true);
create policy "Admins manage charities" on public.charities for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Draws (public read for published)
create policy "Anyone can view published draws" on public.draws for select using (status = 'published');
create policy "Admins manage draws" on public.draws for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Draw results
create policy "Users view own results" on public.draw_results for select using (auth.uid() = user_id);
create policy "Users upload proof" on public.draw_results for update using (auth.uid() = user_id);
create policy "Admins manage results" on public.draw_results for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Contributions
create policy "Users view own contributions" on public.charity_contributions for select using (auth.uid() = user_id);
create policy "Admins view all contributions" on public.charity_contributions for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- STORAGE BUCKETS (run in Supabase dashboard > Storage)
-- ============================================================
-- Create bucket: "winner-proofs" (private)
-- Create bucket: "charity-images" (public)
-- Policies for winner-proofs: authenticated users can upload to own folder
