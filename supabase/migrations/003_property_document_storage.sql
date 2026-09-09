-- TerraTrust AI Property Document Storage Configuration & RLS
-- Migration: 003_property_document_storage.sql

-- Keep this migration bootstrappable for Supabase Preview databases that create
-- storage policies before replaying the full public helper set.
create or replace function public.get_current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'citizen'
  );
$$;

-- Ensure private storage bucket exists
insert into storage.buckets (id, name, public)
values ('property-documents', 'property-documents', false)
on conflict (id) do update set public = false;

-- Clean existing policies on storage.objects for this bucket
drop policy if exists "Authenticated users can upload property documents" on storage.objects;
drop policy if exists "Role-based document download access" on storage.objects;
drop policy if exists "Property owners can delete documents" on storage.objects;

-- 1. UPLOAD POLICY:
-- Citizens can upload into folder path: <user_id>/<property_id>/<filename>
-- where property is owned by the user
create policy "Authenticated users can upload property documents"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'property-documents'
  and (
    -- Citizen owner upload
    (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      and exists (
        select 1 from public.properties
        where id::text = (storage.foldername(name))[2]
          and owner_id = auth.uid()
      )
    )
    -- Surveyor upload
    or (
      public.get_current_user_role() in ('surveyor', 'admin')
    )
  )
);

-- 2. READ / DOWNLOAD POLICY:
-- Institutional and owner read access
create policy "Role-based document download access"
on storage.objects for select to authenticated
using (
  bucket_id = 'property-documents'
  and (
    -- Owner access
    (storage.foldername(name))[1] = (select auth.uid()::text)
    -- Institutional access
    or public.get_current_user_role() in ('admin', 'government', 'surveyor', 'community')
    -- Bank access for verified properties
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

-- 3. DELETE POLICY:
-- Only owner or platform admin can delete documents
create policy "Property owners can delete documents"
on storage.objects for delete to authenticated
using (
  bucket_id = 'property-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or public.get_current_user_role() = 'admin'
  )
);
