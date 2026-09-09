-- A successful field verification earns a complete trust score, while Government
-- approval remains the legal gate that moves the property to verified status.
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
  select result into v_result
    from public.verification_results
   where property_id = p_property_id
   order by created_at desc
   limit 1;

  select location into v_location
    from public.properties
   where id = p_property_id;
  v_location := coalesce(v_location, '{}'::jsonb);

  v_base := greatest(0, least(100, coalesce((v_result ->> 'confidenceScore')::numeric, 0)));
  v_automated_pass := coalesce((v_result ->> 'status') = 'verified', false)
    and coalesce((v_result ->> 'documentsVerified')::boolean, false)
    and coalesce((v_result ->> 'boundaryVerified')::boolean, false)
    and coalesce((v_result ->> 'governmentCleared')::boolean, false)
    and coalesce((v_result ->> 'communityCleared')::boolean, false);
  v_surveyor_pass := coalesce(v_location ->> 'surveyorDecision', '') = 'verified';
  v_government_pass := coalesce(v_location ->> 'governmentDecision', '') = 'approved';

  -- Field verification completes the trust score. Legal verification remains
  -- separate: only Government plus all automated requirements can set status verified.
  if v_surveyor_pass then
    v_score := 100;
  else
    v_score := round(v_base);
  end if;

  update public.properties
     set trust_score = greatest(0, least(100, v_score)),
         status = case
           when v_government_pass and v_surveyor_pass and v_automated_pass then 'verified'
           when coalesce(v_location ->> 'surveyorDecision', '') = 'correction_required'
             or coalesce(v_location ->> 'governmentDecision', '') = 'rejected' then 'disputed'
           else 'pending'
         end,
         updated_at = now()
   where id = p_property_id;

  return v_score;
end;
$$;

grant execute on function public.recalculate_property_verification(uuid) to authenticated;
