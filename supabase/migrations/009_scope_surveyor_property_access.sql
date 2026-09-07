-- Surveyors may inspect only properties assigned to their authenticated account.

drop policy if exists "Role-based property read access" on public.properties;
create policy "Role-based property read access"
  on public.properties for select
  using (
    owner_id = auth.uid()
    or public.get_current_user_role() in ('admin', 'government')
    or exists (
      select 1 from public.surveyor_assignments a
      where a.property_id = id and a.surveyor_id = auth.uid()
    )
    or (public.get_current_user_role() = 'bank' and status = 'verified')
  );

drop policy if exists "Role-based document read access" on public.property_documents;
create policy "Role-based document read access"
  on public.property_documents for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
      and (
        p.owner_id = auth.uid()
        or public.get_current_user_role() in ('admin', 'government')
        or exists (select 1 from public.surveyor_assignments a where a.property_id = p.id and a.surveyor_id = auth.uid())
        or (public.get_current_user_role() = 'bank' and p.status = 'verified')
      )
    )
  );

drop policy if exists "Role-based verification results read access" on public.verification_results;
create policy "Role-based verification results read access"
  on public.verification_results for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
      and (
        p.owner_id = auth.uid()
        or public.get_current_user_role() in ('admin', 'government')
        or exists (select 1 from public.surveyor_assignments a where a.property_id = p.id and a.surveyor_id = auth.uid())
        or (public.get_current_user_role() = 'bank' and p.status = 'verified')
      )
    )
  );

drop policy if exists "Role-based review cases read access" on public.review_cases;
create policy "Role-based review cases read access"
  on public.review_cases for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
      and (
        p.owner_id = auth.uid()
        or public.get_current_user_role() in ('admin', 'government')
        or exists (select 1 from public.surveyor_assignments a where a.property_id = p.id and a.surveyor_id = auth.uid())
      )
    )
  );