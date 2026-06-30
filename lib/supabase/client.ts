import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Supabase client factories.
 *
 * - `getSupabaseClient()` — anon key, RLS-enforced. Safe for public catalogue
 *   reads and the public enquiry insert. Usable from server or browser.
 * - `getServiceClient()` — service-role key, **bypasses RLS**. SERVER ONLY
 *   (admin reads/writes, enquiry management, seed). Never import into a Client
 *   Component.
 *
 * Clients are created lazily and memoised so importing a repository never
 * crashes when env vars are absent — the error is thrown only on first use.
 */
export type TypedSupabaseClient = SupabaseClient<Database>

let anonClient: TypedSupabaseClient | null = null
let serviceClient: TypedSupabaseClient | null = null

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`)
  }
  return value
}

export function getSupabaseClient(): TypedSupabaseClient {
  if (anonClient) return anonClient
  const url = required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
  const anonKey = required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  anonClient = createClient<Database>(url, anonKey)
  return anonClient
}

export function getServiceClient(): TypedSupabaseClient {
  if (serviceClient) return serviceClient
  const url = required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
  const serviceKey = required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY)
  serviceClient = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return serviceClient
}
