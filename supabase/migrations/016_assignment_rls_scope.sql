-- Break the property <-> assignment RLS cycle with narrowly scoped authorization helpers.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.user_owns_property(p_property_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.properties
    where id = p_property_id and owner_id = p_user_id
  );
$$;

create or replace function private.surveyor_has_assignment(p_property_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.surveyor_assignments
    where property_id = p_property_id
      and surveyor_id = p_user_id
      and status in ('assigned', 'in_progress', 'submitted')
  );
$$;

revoke all on function private.user_owns_property(uuid, uuid) from public;
revoke all on function private.surveyor_has_assignment(uuid, uuid) from public;
grant execute on function private.user_owns_property(uuid, uuid) to authenticated;
grant execute on function private.surveyor_has_assignment(uuid, uuid) to authenticated;

drop policy if exists "Property owners can read assignments" on public.surveyor_assignments;
create policy "Property owners can read assignments"
  on public.surveyor_assignments for select to authenticated
  using (
    surveyor_id = auth.uid()
    or public.get_current_user_role() in ('government', 'admin')
    or (public.get_current_user_role() = 'citizen' and private.user_owns_property(property_id, auth.uid()))
  );

drop policy if exists "Role-based property read access" on public.properties;
create policy "Role-based property read access"
  on public.properties for select to authenticated
  using (
    owner_id = auth.uid()
    or public.get_current_user_role() in ('admin', 'government')
    or private.surveyor_has_assignment(id, auth.uid())
    or (public.get_current_user_role() = 'bank' and status = 'verified')
  );

drop policy if exists "Role-based document read access" on public.property_documents;
create policy "Role-based document read access"
  on public.property_documents for select to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
        and (
          p.owner_id = auth.uid()
          or public.get_current_user_role() in ('admin', 'government')
          or private.surveyor_has_assignment(p.id, auth.uid())
          or (public.get_current_user_role() = 'bank' and p.status = 'verified')
        )
    )
  );

drop policy if exists "Owners and surveyors can create property documents" on public.property_documents;
create policy "Owners and surveyors can create property documents"
  on public.property_documents for insert to authenticated
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_id
        and (
          p.owner_id = auth.uid()
          or public.get_current_user_role() = 'admin'
          or private.surveyor_has_assignment(p.id, auth.uid())
        )
    )
  );

drop policy if exists "Owners and authorized roles can update property documents" on public.property_documents;
create policy "Owners and authorized roles can update property documents"
  on public.property_documents for update to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
        and (
          p.owner_id = auth.uid()
          or public.get_current_user_role() in ('admin', 'government')
          or private.surveyor_has_assignment(p.id, auth.uid())
        )
    )
  );

drop policy if exists "Owners and authorized roles can update properties" on public.properties;
create policy "Owners and authorized roles can update properties"
  on public.properties for update to authenticated
  using (
    owner_id = auth.uid()
    or public.get_current_user_role() in ('admin', 'government')
    or private.surveyor_has_assignment(id, auth.uid())
  )
  with check (
    owner_id = auth.uid()
    or public.get_current_user_role() in ('admin', 'government')
    or private.surveyor_has_assignment(id, auth.uid())
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
          or (public.get_current_user_role() = 'bank' and p.status = 'verified')
        )
    )
  );

drop policy if exists "Role-based review cases read access" on public.review_cases;
create policy "Role-based review cases read access"
  on public.review_cases for select to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
        and (
          p.owner_id = auth.uid()
          or public.get_current_user_role() in ('admin', 'government')
          or private.surveyor_has_assignment(p.id, auth.uid())
        )
    )
  );

drop policy if exists "Authenticated users can upload property documents" on storage.objects;
create policy "Authenticated users can upload property documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'property-documents'
    and (
      (
        (storage.foldername(name))[1] = auth.uid()::text
        and exists (
          select 1 from public.properties p
          where p.id::text = (storage.foldername(name))[2]
            and p.owner_id = auth.uid()
        )
      )
      or (
        public.get_current_user_role() in ('surveyor', 'admin')
        and private.surveyor_has_assignment((storage.foldername(name))[2]::uuid, auth.uid())
      )
    )
  );

drop policy if exists "Role-based document download access" on storage.objects;
create policy "Role-based document download access"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'property-documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.get_current_user_role() in ('admin', 'government')
      or (
        public.get_current_user_role() = 'surveyor'
        and private.surveyor_has_assignment((storage.foldername(name))[2]::uuid, auth.uid())
      )
      or (
        public.get_current_user_role() = 'bank'
        and exists (
          select 1 from public.properties p
          where p.id::text = (storage.foldername(name))[2]
            and p.status = 'verified'
        )
      )
    )
  );