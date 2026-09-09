-- Persist the human verification loop on the assignment and derive property state centrally.
alter table public.surveyor_assignments
  add column if not exists decision text check (decision in ('verified', 'correction_required')),
  add column if not exists field_notes text,
  add column if not exists evidence_paths text[] not null default '{}',
  add column if not exists inspection_date timestamptz,
  add column if not exists submitted_by uuid references public.profiles(id);

create or replace function public.user_owns_property(p_property_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.properties
    where id = p_property_id and owner_id = auth.uid()
  );
$$;

drop policy if exists "Property owners can read assignments" on public.surveyor_assignments;
create policy "Property owners can read assignments"
  on public.surveyor_assignments for select to authenticated
  using (
    surveyor_id = auth.uid()
    or public.get_current_user_role() in ('government', 'admin')
    or public.user_owns_property(property_id)
  );

create index if not exists idx_surveyor_assignments_decision
  on public.surveyor_assignments(property_id, decision, updated_at desc);

create or replace function public.recalculate_property_verification(p_property_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_location jsonb;
  v_base numeric;
  v_surveyor_pass boolean;
  v_government_pass boolean;
  v_automated_pass boolean;
  v_score integer;
begin
  select result into v_result from public.verification_results
   where property_id = p_property_id order by created_at desc limit 1;
  select location into v_location from public.properties where id = p_property_id;
  v_location := coalesce(v_location, '{}'::jsonb);
  v_base := greatest(0, least(100, coalesce((v_result ->> 'confidenceScore')::numeric, 0)));
  v_automated_pass := coalesce((v_result ->> 'status') = 'verified', false)
    and coalesce((v_result ->> 'documentsVerified')::boolean, false)
    and coalesce((v_result ->> 'boundaryVerified')::boolean, false)
    and coalesce((v_result ->> 'governmentCleared')::boolean, false)
    and coalesce((v_result ->> 'communityCleared')::boolean, false);
  v_surveyor_pass := coalesce(v_location ->> 'surveyorDecision', '') = 'verified';
  v_government_pass := coalesce(v_location ->> 'governmentDecision', '') = 'approved';

  v_score := round(v_base * 0.70 + case when v_surveyor_pass then 15 else 0 end + case when v_government_pass then 15 else 0 end);
  if v_surveyor_pass and v_government_pass and v_automated_pass then v_score := 100; end if;

  update public.properties set trust_score = greatest(0, least(100, v_score)),
    status = case
      when v_government_pass and v_surveyor_pass and v_automated_pass then 'verified'
      when coalesce(v_location ->> 'surveyorDecision', '') = 'correction_required'
        or coalesce(v_location ->> 'governmentDecision', '') = 'rejected' then 'disputed'
      else 'pending' end, updated_at = now()
   where id = p_property_id;
  return v_score;
end;
$$;

grant execute on function public.recalculate_property_verification(uuid) to authenticated;

create or replace function public.submit_surveyor_verification(
  p_assignment_id uuid, p_decision text, p_field_notes text, p_evidence_paths text[], p_surveyor_boundary jsonb
)
returns integer language plpgsql security definer set search_path = public as $$
declare v_property_id uuid;
begin
  if public.get_current_user_role() not in ('surveyor', 'admin') then raise exception 'Surveyor role required'; end if;
  if p_decision not in ('verified', 'correction_required') then raise exception 'Invalid surveyor decision'; end if;
  if nullif(trim(p_field_notes), '') is null then raise exception 'Field notes are required'; end if;
  if p_decision = 'correction_required' and coalesce(array_length(p_evidence_paths, 1), 0) = 0 then raise exception 'Evidence is required for a failed surveyor decision'; end if;

  select property_id into v_property_id from public.surveyor_assignments
   where id = p_assignment_id and (surveyor_id = auth.uid() or public.get_current_user_role() = 'admin')
     and status in ('assigned', 'in_progress');
  if v_property_id is null then raise exception 'Assignment is not available to this surveyor'; end if;

  update public.surveyor_assignments set decision = p_decision, field_notes = trim(p_field_notes),
    evidence_paths = coalesce(p_evidence_paths, '{}'), inspection_date = now(), submitted_by = auth.uid(),
    status = 'submitted', updated_at = now() where id = p_assignment_id;
  update public.properties set location = coalesce(location, '{}'::jsonb) || jsonb_build_object(
    'surveyorDecision', p_decision, 'surveyorNotes', trim(p_field_notes),
    'surveyorFieldPhotos', coalesce(p_evidence_paths, '{}'), 'surveyorSubmittedAt', now())
    || case when p_surveyor_boundary is null then '{}'::jsonb else jsonb_build_object('surveyorBoundary', p_surveyor_boundary) end,
    updated_at = now()
   where id = v_property_id;
  insert into public.review_cases(property_id, status, reason) values (v_property_id, 'open',
    case when p_decision = 'verified' then 'Surveyor field verification submitted for Government review'
      else 'Surveyor reported a field discrepancy: ' || trim(p_field_notes) end);
  insert into public.notifications(user_id, property_id, recipient_role, title, message)
    select p.owner_id, p.id::text, 'citizen',
      case when p_decision = 'verified' then 'Field inspection completed' else 'Field inspection requires review' end,
      case when p_decision = 'verified' then 'A surveyor submitted field evidence for Government review.' else 'A surveyor reported a field discrepancy and submitted evidence.' end
      from public.properties p where p.id = v_property_id;
  insert into public.notifications(user_id, property_id, recipient_role, title, message)
    select pr.id, v_property_id::text, 'government', 'Government review required', 'Surveyor evidence is ready for final legal review.'
      from public.profiles pr where pr.role = 'government';
  return public.recalculate_property_verification(v_property_id);
end;
$$;

grant execute on function public.submit_surveyor_verification(uuid, text, text, text[], jsonb) to authenticated;

create or replace function public.record_government_verification(
  p_property_id uuid, p_resolution text, p_officer_notes text
)
returns integer language plpgsql security definer set search_path = public as $$
declare v_score integer;
begin
  if public.get_current_user_role() not in ('government', 'admin') then raise exception 'Government officer role required'; end if;
  if p_resolution not in ('approved', 'rejected', 'clarification_requested') then raise exception 'Invalid government resolution'; end if;
  if nullif(trim(p_officer_notes), '') is null then raise exception 'Government notes are required'; end if;
  update public.properties set location = coalesce(location, '{}'::jsonb) || jsonb_build_object(
    'governmentDecision', p_resolution, 'governmentOfficerNotes', trim(p_officer_notes), 'governmentDecidedAt', now()), updated_at = now()
   where id = p_property_id;
  if not found then raise exception 'Property not found'; end if;
  update public.review_cases set status = case when p_resolution = 'approved' then 'resolved' else 'open' end,
    reason = trim(p_officer_notes), updated_at = now() where property_id = p_property_id and status in ('open', 'in_review');
  insert into public.notifications(user_id, property_id, recipient_role, title, message)
    select p.owner_id, p.id::text, 'citizen',
      case when p_resolution = 'approved' then 'Property verification approved' when p_resolution = 'rejected' then 'Property verification failed' else 'Government requested clarification' end,
      trim(p_officer_notes) from public.properties p where p.id = p_property_id;
  v_score := public.recalculate_property_verification(p_property_id);
  return v_score;
end;
$$;

grant execute on function public.record_government_verification(uuid, text, text) to authenticated;