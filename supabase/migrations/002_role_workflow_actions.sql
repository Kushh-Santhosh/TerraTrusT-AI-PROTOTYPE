-- TerraTrust AI Role Workflow Actions (RPC Functions)
-- Migration: 002_role_workflow_actions.sql

-- 1. Community Verification Decision
create or replace function public.record_community_decision(
  p_passport_id text,
  p_decision text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  property_row public.properties%rowtype;
  result_id uuid;
  current_result jsonb;
begin
  if p_decision not in ('attested', 'objected') then
    raise exception 'Invalid community decision: must be attested or objected';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('community', 'admin')
  ) then
    raise exception 'Community verifier role required';
  end if;

  select * into property_row from public.properties where passport_id = p_passport_id;
  if property_row.id is null then
    raise exception 'Property not found with passport id: %', p_passport_id;
  end if;

  select id, result into result_id, current_result
  from public.verification_results
  where property_id = property_row.id
  order by created_at desc
  limit 1;

  current_result := coalesce(current_result, '{}'::jsonb) || jsonb_build_object(
    'communityDecision', p_decision,
    'communityCleared', p_decision = 'attested',
    'communityAttestations', case when p_decision = 'attested' then 1 else 0 end,
    'communityRecordedAt', now()
  );

  if result_id is null then
    insert into public.verification_results(property_id, provider, result)
    values (property_row.id, 'community', current_result);
  else
    update public.verification_results set result = current_result where id = result_id;
  end if;

  if p_decision = 'objected' then
    update public.properties
    set status = 'disputed', trust_score = least(trust_score, 42), updated_at = now()
    where id = property_row.id;
  end if;

  return true;
end;
$$;

grant execute on function public.record_community_decision(text, text) to authenticated;

-- 2. Surveyor Evidence Recording
create or replace function public.record_survey_evidence(
  p_passport_id text,
  p_name text,
  p_kind text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_property_id uuid;
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('surveyor', 'admin')
  ) then
    raise exception 'Surveyor role required';
  end if;

  select id into v_property_id from public.properties where passport_id = p_passport_id;
  if v_property_id is null then
    raise exception 'Property not found with passport id: %', p_passport_id;
  end if;

  insert into public.property_documents(property_id, name, kind, verified)
  values (
    v_property_id,
    p_name,
    case when p_kind in ('deed', 'survey', 'tax', 'id') then p_kind else 'other' end,
    true
  );

  return true;
end;
$$;

grant execute on function public.record_survey_evidence(text, text, text) to authenticated;

-- 3. Government Review Resolution
create or replace function public.resolve_property_review(
  p_passport_id text,
  p_resolution text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_property_id uuid;
begin
  if p_resolution not in ('verified', 'pending', 'disputed') then
    raise exception 'Invalid review resolution: %', p_resolution;
  end if;

  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('government', 'admin')
  ) then
    raise exception 'Government officer role required';
  end if;

  select id into v_property_id from public.properties where passport_id = p_passport_id;
  if v_property_id is null then
    raise exception 'Property not found with passport id: %', p_passport_id;
  end if;

  update public.properties
  set status = p_resolution, updated_at = now()
  where id = v_property_id;

  update public.review_cases
  set status = 'resolved', updated_at = now()
  where review_cases.property_id = v_property_id and status in ('open', 'in_review');

  return true;
end;
$$;

grant execute on function public.resolve_property_review(text, text) to authenticated;
