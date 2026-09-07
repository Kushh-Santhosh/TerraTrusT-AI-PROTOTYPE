-- Restrict telemetry and operational records to authenticated, authorized users.

drop policy if exists "Read verification runs" on public.verification_runs;
drop policy if exists "Insert verification runs" on public.verification_runs;
drop policy if exists "Read valuations" on public.valuations;
drop policy if exists "Insert valuations" on public.valuations;
drop policy if exists "Read audit logs" on public.audit_logs;
drop policy if exists "Insert audit logs" on public.audit_logs;
drop policy if exists "Read notifications" on public.notifications;
drop policy if exists "Insert notifications" on public.notifications;

create policy "Authorized users can read verification runs"
  on public.verification_runs for select to authenticated
  using (
    public.get_current_user_role() in ('admin', 'government')
    or exists (
      select 1 from public.properties p
      where p.id = property_id
      and (p.owner_id = auth.uid() or public.get_current_user_role() in ('surveyor', 'bank'))
    )
  );

create policy "Authorized users can insert verification runs"
  on public.verification_runs for insert to authenticated
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_id
      and (p.owner_id = auth.uid() or public.get_current_user_role() in ('admin', 'government', 'surveyor'))
    )
  );

create policy "Authorized users can read valuations"
  on public.valuations for select to authenticated
  using (
    public.get_current_user_role() in ('admin', 'government')
    or exists (
      select 1 from public.properties p
      where p.id = property_id
      and (p.owner_id = auth.uid() or (public.get_current_user_role() = 'bank' and p.status = 'verified'))
    )
  );

create policy "Authorized users can insert valuations"
  on public.valuations for insert to authenticated
  with check (public.get_current_user_role() in ('admin', 'government'));

create policy "Admins can read audit logs"
  on public.audit_logs for select to authenticated
  using (public.get_current_user_role() in ('admin', 'government'));

create policy "Authorized services can insert audit logs"
  on public.audit_logs for insert to authenticated
  with check (public.get_current_user_role() in ('admin', 'government', 'surveyor', 'bank') or actor_role = 'system');

create policy "Users can read their notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid() or public.get_current_user_role() = 'admin');

create policy "Authorized services can insert notifications"
  on public.notifications for insert to authenticated
  with check (public.get_current_user_role() in ('admin', 'government', 'surveyor') or user_id = auth.uid());