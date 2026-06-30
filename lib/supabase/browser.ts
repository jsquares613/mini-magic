'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

/**
 * Supabase client for Client Components (login form, image uploads). Persists
 * the session in cookies so the server client + middleware can read it.
 */
export function createBrowserSupabase() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
