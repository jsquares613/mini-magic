import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

/**
 * Cookie-bound Supabase client for Server Components, Route Handlers and Server
 * Actions. Runs as the logged-in user, so RLS applies (defense-in-depth for the
 * admin panel). Use this for reads and auth checks.
 */
export function createServerSupabase() {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // `set` throws when called from a Server Component render; safe to
          // ignore because middleware refreshes the session on every request.
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            /* called from a Server Component — ignore */
          }
        },
      },
    },
  )
}

/**
 * Service-role Supabase client for server-side admin mutations (bypasses RLS).
 * Only use AFTER verifying auth with requireStaff() — never on the client side.
 * Needed because RLS UPDATE/DELETE policies silently return 0 rows on failure
 * (no error), making session-based writes unreliable in Server Actions.
 */
export function createAdminSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}
