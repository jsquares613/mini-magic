import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

/**
 * Cookie-bound Supabase client for Server Components, Route Handlers and Server
 * Actions. Runs as the logged-in user, so RLS applies (defense-in-depth for the
 * admin panel). Use this for admin reads/writes.
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
