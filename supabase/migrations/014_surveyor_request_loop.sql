-- Citizen-requested surveyor verification using the existing assignment workflow.
create or replace function public.request_surveyor_verification(p_property_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  property_owner uuid;
  selected_surveyor uuid;
  existing_assignment uuid;
  assignment_id uuid;
begin
  select owner_id into property_owner from public.properties where id = p_property_id;
  if property_owner is null or property_owner <> auth.uid() then
    raise exception 'Property request is not authorized';
  end if;

  select id into existing_assignment
    from public.surveyor_assignments
   where property_id = p_property_id
    and status in ('assigned', 'in_progress', 'submitted')
   order by created_at desc
   limit 1;
  if existing_assignment is not null then
    return existing_assignment;
  end if;

  select id into selected_surveyor
    from public.profiles
   where role = 'surveyor'
   order by region nulls last, created_at
   limit 1;
  if selected_surveyor is null then
    raise exception 'No surveyor is currently available';
  end if;

  insert into public.surveyor_assignments (property_id, surveyor_id, assigned_by, status, notes)
  values (p_property_id, selected_surveyor, auth.uid(), 'assigned', 'Citizen requested field verification')
  returning id into assignment_id;

  insert into public.notifications (user_id, property_id, recipient_role, title, message)
  values
    (auth.uid(), p_property_id::text, 'citizen', 'Surveyor verification requested', 'A surveyor verification request is waiting for field inspection.'),
    (selected_surveyor, p_property_id::text, 'surveyor', 'New property verification request', 'A citizen requested field verification for an assigned property.');

  return assignment_id;
end;
$$;

grant execute on function public.request_surveyor_verification(uuid) to authenticated;

-- Keep citizen-requested assignments visible to the owner while preserving surveyor scope.
drop policy if exists "Property owners can read assignments" on public.surveyor_assignments;
create policy "Property owners can read assignments"
  on public.surveyor_assignments for select to authenticated
  using (
    surveyor_id = auth.uid()
    or public.get_current_user_role() in ('government', 'admin')
    or exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
  );
