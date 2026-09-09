-- Allow Bank to review non-draft canonical property intelligence without granting writes.
-- Private property documents remain restricted to verified properties by existing policies.
drop policy if exists "Role-based property read access" on public.properties;
create policy "Role-based property read access"
  on public.properties for select to authenticated
  using (
    owner_id = auth.uid()
    or public.get_current_user_role() in ('admin', 'government')
    or private.surveyor_has_assignment(id, auth.uid())
    or (
      public.get_current_user_role() = 'bank'
      and status in ('pending', 'verified', 'disputed')
    )
  );

drop policy if exists "Role-based verification results read access" on public.verification_results;
create policy "Role-based verification results read access"
  on public.verification_results for select to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
        and (
          p.owner_id = auth.uid()
          or public.get_current_user_role() in ('admin', 'government')
          or private.surveyor_has_assignment(p.id, auth.uid())
          or (
            public.get_current_user_role() = 'bank'
            and p.status in ('pending', 'verified', 'disputed')
          )
        )
    )
  );
