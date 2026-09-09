-- Keep property creation citizen-owned and prevent Bank from manufacturing canonical data.
drop policy if exists "Citizens can create properties" on public.properties;
create policy "Citizens can create properties"
  on public.properties for insert to authenticated
  with check (
    owner_id = auth.uid()
    and public.get_current_user_role() in ('citizen', 'admin')
  );

-- Bank consumes persisted AI analyses; it does not write or replace them.
drop policy if exists "Insert AI analyses for accessible properties" on public.ai_property_analyses;
create policy "Authorized roles can insert AI analyses"
  on public.ai_property_analyses for insert to authenticated
  with check (
    public.get_current_user_role() in ('citizen', 'government', 'admin')
    and exists (
      select 1 from public.properties p
      where p.id = ai_property_analyses.property_id
    )
  );
