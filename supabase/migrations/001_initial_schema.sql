-- TerraTrust AI Canonical Database Schema & Multi-Role RLS Policies
-- Migration: 001_initial_schema.sql

-- Enable UUID extension if not enabled
create extension if not exists "pgcrypto";

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'citizen' check (role in ('citizen', 'surveyor', 'government', 'community', 'bank', 'admin')),
  region text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. PROPERTIES
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  property_name text not null,
  passport_id text not null unique,
  location jsonb not null default '{}'::jsonb,
  area numeric not null default 0,
  status text not null default 'pending' check (status in ('verified', 'pending', 'disputed', 'draft')),
  trust_score integer not null default 0 check (trust_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. PROPERTY DOCUMENTS
create table if not exists public.property_documents (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('deed', 'survey', 'tax', 'id', 'other')),
  storage_path text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- 4. VERIFICATION RESULTS
create table if not exists public.verification_results (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  provider text not null default 'n8n',
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 5. REVIEW CASES
create table if not exists public.review_cases (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved')),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_properties_owner_id on public.properties(owner_id);
create index if not exists idx_properties_passport_id on public.properties(passport_id);
create index if not exists idx_properties_status on public.properties(status);
create index if not exists idx_property_documents_property_id on public.property_documents(property_id);
create index if not exists idx_verification_results_property_id on public.verification_results(property_id);
create index if not exists idx_review_cases_property_id on public.review_cases(property_id);

-- Helper function: get role of current authenticated user safely
create or replace function public.get_current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'citizen'
  );
$$;

-- Handle new user registration trigger
-- Enforces citizen role by default for public signups
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, region)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    'citizen', -- Public registrations strictly default to citizen
    new.raw_user_meta_data ->> 'region'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    region = coalesce(public.profiles.region, excluded.region);
  return new;
end;
$$;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable Row Level Security (RLS) on all tables
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_documents enable row level security;
alter table public.verification_results enable row level security;
alter table public.review_cases enable row level security;

-- ==========================================
-- PROFILES RLS POLICIES
-- ==========================================
create policy "Users can read their own profile"
  on public.profiles for select
  using (id = auth.uid() or public.get_current_user_role() in ('admin', 'government'));

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and (
      -- Disallow elevating role unless user is an admin
      role = (select role from public.profiles where id = auth.uid())
      or public.get_current_user_role() = 'admin'
    )
  );

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (id = auth.uid());

-- ==========================================
-- PROPERTIES RLS POLICIES
-- ==========================================
-- Controlled institutional access:
-- - Citizen: reads their own
-- - Surveyor: reads properties for survey workflows
-- - Government: reads properties for verification and dispute resolution
-- - Community: reads properties for community verification
-- - Bank: reads verified properties (passports)
-- - Admin: platform management access
create policy "Role-based property read access"
  on public.properties for select
  using (
    owner_id = auth.uid()
    or public.get_current_user_role() in ('admin', 'government', 'surveyor', 'community')
    or (public.get_current_user_role() = 'bank' and status = 'verified')
  );

create policy "Citizens can create properties"
  on public.properties for insert
  with check (
    owner_id = auth.uid()
  );

create policy "Owners and authorized roles can update properties"
  on public.properties for update
  using (
    owner_id = auth.uid()
    or public.get_current_user_role() in ('admin', 'government')
  )
  with check (
    owner_id = auth.uid()
    or public.get_current_user_role() in ('admin', 'government')
  );

-- ==========================================
-- PROPERTY DOCUMENTS RLS POLICIES
-- ==========================================
create policy "Role-based document read access"
  on public.property_documents for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
      and (
        p.owner_id = auth.uid()
        or public.get_current_user_role() in ('admin', 'government', 'surveyor', 'community')
        or (public.get_current_user_role() = 'bank' and p.status = 'verified')
      )
    )
  );

create policy "Owners and surveyors can create property documents"
  on public.property_documents for insert
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_id
      and (
        p.owner_id = auth.uid()
        or public.get_current_user_role() in ('admin', 'surveyor')
      )
    )
  );

create policy "Owners and authorized roles can update property documents"
  on public.property_documents for update
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
      and (
        p.owner_id = auth.uid()
        or public.get_current_user_role() in ('admin', 'government', 'surveyor')
      )
    )
  );

-- ==========================================
-- VERIFICATION RESULTS RLS POLICIES
-- ==========================================
create policy "Role-based verification results read access"
  on public.verification_results for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
      and (
        p.owner_id = auth.uid()
        or public.get_current_user_role() in ('admin', 'government', 'surveyor', 'community')
        or (public.get_current_user_role() = 'bank' and p.status = 'verified')
      )
    )
  );

create policy "Authenticated users can create verification results"
  on public.verification_results for insert
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_id
      and (
        p.owner_id = auth.uid()
        or public.get_current_user_role() in ('admin', 'government', 'surveyor', 'community')
      )
    )
  );

create policy "Authorized roles can update verification results"
  on public.verification_results for update
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
      and (
        p.owner_id = auth.uid()
        or public.get_current_user_role() in ('admin', 'government')
      )
    )
  );

-- ==========================================
-- REVIEW CASES RLS POLICIES
-- ==========================================
create policy "Role-based review cases read access"
  on public.review_cases for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
      and (
        p.owner_id = auth.uid()
        or public.get_current_user_role() in ('admin', 'government')
      )
    )
  );

create policy "Authorized roles can create review cases"
  on public.review_cases for insert
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_id
      and (
        p.owner_id = auth.uid()
        or public.get_current_user_role() in ('admin', 'government')
      )
    )
  );

create policy "Government and admin can update review cases"
  on public.review_cases for update
  using (
    public.get_current_user_role() in ('admin', 'government')
  );
