-- Persist Government-to-Surveyor field assignments.
create table if not exists public.surveyor_assignments (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  surveyor_id uuid references public.profiles(id) on delete set null,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'assigned' check (status in ('assigned', 'in_progress', 'submitted', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_surveyor_assignments_property on public.surveyor_assignments(property_id);
create index if not exists idx_surveyor_assignments_surveyor on public.surveyor_assignments(surveyor_id);

alter table public.surveyor_assignments enable row level security;

create policy "Government can read assignments"
  on public.surveyor_assignments for select to authenticated
  using (public.get_current_user_role() in ('government', 'admin') or surveyor_id = auth.uid());

create policy "Government can create assignments"
  on public.surveyor_assignments for insert to authenticated
  with check (
    assigned_by = auth.uid()
    and public.get_current_user_role() in ('government', 'admin')
    and exists (select 1 from public.profiles p where p.id = surveyor_id and p.role = 'surveyor')
  );

create policy "Authorized roles can update assignments"
  on public.surveyor_assignments for update to authenticated
  using (public.get_current_user_role() in ('government', 'admin') or surveyor_id = auth.uid())
  with check (public.get_current_user_role() in ('government', 'admin') or surveyor_id = auth.uid());