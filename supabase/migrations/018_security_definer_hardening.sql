-- Remove the superseded public helper after assignment policies moved to private helpers.
-- The active policies use private.user_owns_property(uuid, uuid) from migration 016.
drop function if exists public.user_owns_property(uuid);
