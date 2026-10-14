-- =============================================================================
-- Mini Magic — scheduled Marg sync via Supabase Cron (pg_cron + pg_net)
--
-- pg_cron fires on schedule; pg_net POSTs to the site's /api/cron/marg-sync
-- route, which runs the sync inside the Next.js app (lib/marg/sync.ts).
--
-- The site URL and the shared secret live in Supabase Vault, not in this
-- file. Create them once in the SQL editor (the secret must equal the app's
-- CRON_SECRET env var):
--
--   select vault.create_secret('https://<your-site>', 'marg_sync_url', 'Minimagic site base URL');
--   select vault.create_secret('<CRON_SECRET value>', 'marg_cron_secret', 'Bearer token for /api/cron/marg-sync');
--
-- Until both exist, the jobs run but do nothing. Run once by hand with
--   select trigger_marg_sync();          -- or trigger_marg_sync('full')
-- and see the HTTP result in net._http_response.
--
-- Stop the schedule:
--   select cron.unschedule('marg-sync-changes');
--   select cron.unschedule('marg-sync-full');
-- =============================================================================

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

/** Calls the sync route; returns the pg_net request id (null when not configured). */
create or replace function trigger_marg_sync(kind text default 'changes')
returns bigint
language plpgsql
set search_path = public
as $$
declare
  base_url text;
  secret   text;
begin
  select decrypted_secret into base_url from vault.decrypted_secrets where name = 'marg_sync_url';
  select decrypted_secret into secret   from vault.decrypted_secrets where name = 'marg_cron_secret';
  if base_url is null or secret is null then
    raise notice 'Marg sync schedule: create the marg_sync_url and marg_cron_secret Vault secrets first.';
    return null;
  end if;

  return net.http_post(
    url     := rtrim(base_url, '/') || '/api/cron/marg-sync' || case when kind = 'full' then '?kind=full' else '' end,
    body    := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || secret),
    -- A full sync can take a while; the route answers when the sync finishes.
    timeout_milliseconds := 120000
  );
end $$;

-- Only the scheduler (postgres) may call it — never the public API.
revoke execute on function trigger_marg_sync(text) from public, anon, authenticated;

-- pg_cron runs in UTC (IST = UTC+5:30).
-- Changes since the last sync, every 15 minutes.
select cron.schedule('marg-sync-changes', '*/15 * * * *', $$select public.trigger_marg_sync('changes')$$);
-- Full sync nightly at 21:40 UTC = 03:10 IST (off the quarter-hour, so it never
-- collides with a changes run); also flags items Marg no longer lists.
select cron.schedule('marg-sync-full', '40 21 * * *', $$select public.trigger_marg_sync('full')$$);
