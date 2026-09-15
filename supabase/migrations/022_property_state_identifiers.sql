-- Add state and official property record identifier columns to public.properties
-- Migration: 022_property_state_identifiers.sql

alter table public.properties
  add column if not exists property_state text,
  add column if not exists record_identifier_type text,
  add column if not exists record_identifier_value text;

-- Enforce server-side uniqueness to prevent duplicate property identifiers per state & type
create unique index if not exists idx_properties_state_identifier
  on public.properties(property_state, record_identifier_type, record_identifier_value)
  where property_state is not null
    and record_identifier_type is not null
    and record_identifier_value is not null;

-- Index for rapid lookup by state
create index if not exists idx_properties_property_state
  on public.properties(property_state);

-- Index for rapid lookup by record identifier value
create index if not exists idx_properties_record_identifier_value
  on public.properties(record_identifier_value);
