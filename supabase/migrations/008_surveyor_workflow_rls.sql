-- Permit only the assigned Surveyor to submit field evidence for an assignment.

drop policy if exists "Owners and authorized roles can update properties" on public.properties;
create policy "Owners and authorized roles can update properties"
  on public.properties for update
  using (
    owner_id = auth.uid()
    or public.get_current_user_role() in ('admin', 'government')
    or exists (
      select 1 from public.surveyor_assignments a
      where a.property_id = id and a.surveyor_id = auth.uid() and a.status in ('assigned', 'in_progress')
    )
  )
  with check (
    owner_id = auth.uid()
    or public.get_current_user_role() in ('admin', 'government')
    or exists (
      select 1 from public.surveyor_assignments a
      where a.property_id = id and a.surveyor_id = auth.uid() and a.status in ('assigned', 'in_progress', 'submitted')
    )
  );

drop policy if exists "Authorized roles can create review cases" on public.review_cases;
create policy "Authorized roles can create review cases"
  on public.review_cases for insert
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_id
      and (
        p.owner_id = auth.uid()
        or public.get_current_user_role() in ('government', 'admin')
        or exists (
          select 1 from public.surveyor_assignments a
          where a.property_id = p.id and a.surveyor_id = auth.uid() and a.status in ('assigned', 'in_progress')
        )
      )
    )
  );