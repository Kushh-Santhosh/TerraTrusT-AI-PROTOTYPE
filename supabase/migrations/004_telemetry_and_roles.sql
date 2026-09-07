-- TerraTrust AI Telemetry, Valuations, Audit Logs, and Canonical Roles Migration
-- Migration: 004_telemetry_and_roles.sql

-- Enable pgcrypto if not already enabled
create extension if not exists "pgcrypto";

-- 1. VERIFICATION RUNS (telemetry from n8n orchestrator)
create table if not exists public.verification_runs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  workflow_id text,
  status text not null,
  confidence_score numeric not null default 0,
  fraud_score numeric not null default 0,
  risk_score numeric not null default 0,
  result jsonb not null default '{}'::jsonb,
  correlation_id text,
  idempotency_key text,
  created_at timestamptz not null default now()
);

-- 2. VALUATIONS (authoritative INR valuations)
create table if not exists public.valuations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  amount numeric not null,
  currency text not null default 'INR',
  confidence_low numeric,
  confidence_high numeric,
  factors jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 3. AUDIT LOGS (immutable security & workflow audit trail)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  property_id text,
  event text,
  actor_role text default 'system',
  request_id text,
  correlation_id text,
  detail text,
  created_at timestamptz not null default now()
);

-- 4. NOTIFICATIONS (multi-role notification dispatch)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  property_id text,
  recipient_role text default 'citizen',
  title text not null,
  message text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_verification_runs_prop_id on public.verification_runs(property_id);
create index if not exists idx_verification_runs_corr_id on public.verification_runs(correlation_id);
create index if not exists idx_valuations_prop_id on public.valuations(property_id);
create index if not exists idx_audit_logs_prop_id on public.audit_logs(property_id);
create index if not exists idx_audit_logs_req_id on public.audit_logs(request_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);

-- Enable RLS
alter table public.verification_runs enable row level security;
alter table public.valuations enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;

-- Policies
create policy "Read verification runs" on public.verification_runs for select
  using (true);

create policy "Insert verification runs" on public.verification_runs for insert
  with check (true);

create policy "Read valuations" on public.valuations for select
  using (true);

create policy "Insert valuations" on public.valuations for insert
  with check (true);

create policy "Read audit logs" on public.audit_logs for select
  using (true);

create policy "Insert audit logs" on public.audit_logs for insert
  with check (true);

create policy "Read notifications" on public.notifications for select
  using (true);

create policy "Insert notifications" on public.notifications for insert
  with check (true);
