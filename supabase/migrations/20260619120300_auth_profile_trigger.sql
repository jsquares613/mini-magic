-- =============================================================================
-- Auto-create a profile row for every new auth user (default role: viewer).
-- Promote the first admin manually:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- =============================================================================

create or replace function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'viewer')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
