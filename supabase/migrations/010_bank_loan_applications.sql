create table if not exists public.bank_loan_applications (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  bank_name text not null,
  applicant_name text not null,
  requested_amount_inr numeric not null check (requested_amount_inr > 0),
  ltv_ratio numeric not null check (ltv_ratio > 0 and ltv_ratio <= 100),
  notes text,
  status text not null default 'underwriting_approved' check (status in ('underwriting_approved', 'submitted', 'declined')),
  created_at timestamptz not null default now()
);

create index if not exists idx_bank_loan_applications_property_id
  on public.bank_loan_applications(property_id);

alter table public.bank_loan_applications enable row level security;

drop policy if exists "Banks can read loan applications" on public.bank_loan_applications;
create policy "Banks can read loan applications"
  on public.bank_loan_applications for select
  using (public.get_current_user_role() in ('bank', 'admin'));

drop policy if exists "Banks can create loan applications" on public.bank_loan_applications;
create policy "Banks can create loan applications"
  on public.bank_loan_applications for insert
  with check (
    created_by = auth.uid()
    and public.get_current_user_role() in ('bank', 'admin')
  );