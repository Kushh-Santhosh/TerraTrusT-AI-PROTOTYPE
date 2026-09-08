-- Persist provider-backed AI analysis for each property.
create table if not exists public.ai_property_analyses (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  passport_id text not null,
  model text not null,
  input_version text not null default 'property-evidence-v1',
  result jsonb not null default '{}'::jsonb,
  confidence numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ai_property_analyses_property_id
  on public.ai_property_analyses(property_id, created_at desc);

alter table public.ai_property_analyses enable row level security;

create policy "Read AI analyses for accessible properties"
  on public.ai_property_analyses for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = ai_property_analyses.property_id
    )
  );

create policy "Insert AI analyses for accessible properties"
  on public.ai_property_analyses for insert
  with check (
    exists (
      select 1 from public.properties p
      where p.id = ai_property_analyses.property_id
    )
  );