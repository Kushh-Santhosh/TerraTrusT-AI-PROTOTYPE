-- Require persisted field evidence and a surveyor boundary for every submitted decision.
create or replace function public.submit_surveyor_verification(
  p_assignment_id uuid,
  p_decision text,
  p_field_notes text,
  p_evidence_paths text[],
  p_surveyor_boundary jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_property_id uuid;
begin
  if public.get_current_user_role() not in ('surveyor', 'admin') then
    raise exception 'Surveyor role required';
  end if;
  if p_decision not in ('verified', 'correction_required') then
    raise exception 'Invalid surveyor decision';
  end if;
  if nullif(trim(p_field_notes), '') is null then
    raise exception 'Field notes are required';
  end if;
  if coalesce(array_length(p_evidence_paths, 1), 0) = 0 then
    raise exception 'Field evidence is required for every surveyor decision';
  end if;
  if p_decision = 'verified'
     and (p_surveyor_boundary is null
       or jsonb_typeof(p_surveyor_boundary) <> 'array'
       or jsonb_array_length(p_surveyor_boundary) < 3) then
    raise exception 'A verified survey requires a persisted surveyor boundary';
  end if;

  select property_id into v_property_id
    from public.surveyor_assignments
   where id = p_assignment_id
     and (surveyor_id = auth.uid() or public.get_current_user_role() = 'admin')
     and status in ('assigned', 'in_progress');
  if v_property_id is null then
    raise exception 'Assignment is not available to this surveyor';
  end if;

  update public.surveyor_assignments
     set decision = p_decision,
         field_notes = trim(p_field_notes),
         evidence_paths = p_evidence_paths,
         inspection_date = now(),
         submitted_by = auth.uid(),
         status = 'submitted',
         updated_at = now()
   where id = p_assignment_id;

  update public.properties
     set location = coalesce(location, '{}'::jsonb) || jsonb_build_object(
       'surveyorDecision', p_decision,
       'surveyorNotes', trim(p_field_notes),
       'surveyorFieldPhotos', p_evidence_paths,
       'surveyorSubmittedAt', now()
     ) || case
       when p_surveyor_boundary is null then '{}'::jsonb
       else jsonb_build_object('surveyorBoundary', p_surveyor_boundary)
     end,
     updated_at = now()
   where id = v_property_id;

  insert into public.review_cases(property_id, status, reason)
  values (
    v_property_id,
    'open',
    case
      when p_decision = 'verified' then 'Surveyor field verification submitted for Government review'
      else 'Surveyor reported a field discrepancy: ' || trim(p_field_notes)
    end
  );

  insert into public.notifications(user_id, property_id, recipient_role, title, message)
    select p.owner_id,
      p.id::text,
      'citizen',
      case when p_decision = 'verified' then 'Field inspection completed' else 'Field inspection requires review' end,
      case when p_decision = 'verified' then 'A surveyor submitted field evidence for Government review.' else 'A surveyor reported a field discrepancy and submitted evidence.' end
      from public.properties p
     where p.id = v_property_id;

  insert into public.notifications(user_id, property_id, recipient_role, title, message)
    select pr.id,
      v_property_id::text,
      'government',
      'Government review required',
      'Surveyor evidence is ready for final legal review.'
      from public.profiles pr
     where pr.role = 'government';

  return public.recalculate_property_verification(v_property_id);
end;
$$;

grant execute on function public.submit_surveyor_verification(uuid, text, text, text[], jsonb) to authenticated;
