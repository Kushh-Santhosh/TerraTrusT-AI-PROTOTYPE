-- Secure owner-scoped property deletion.
-- Storage objects are removed by the authenticated client before this RPC runs.
create or replace function public.delete_owned_property(p_property_id uuid, p_passport_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  property_owner uuid;
  property_passport text;
begin
  select owner_id, passport_id
    into property_owner, property_passport
    from public.properties
   where id = p_property_id;

  if property_owner is null or property_owner <> auth.uid() or property_passport <> p_passport_id then
    raise exception 'Property deletion is not authorized';
  end if;

  insert into public.audit_logs (action, property_id, event, actor_role, detail)
  values (
    'PROPERTY_DELETED',
    p_property_id::text,
    p_passport_id,
    'citizen',
    'Owner deleted property and associated records'
  );

  delete from public.notifications where property_id = p_property_id::text;
  delete from public.properties where id = p_property_id;
  return true;
end;
$$;

grant execute on function public.delete_owned_property(uuid, text) to authenticated;
