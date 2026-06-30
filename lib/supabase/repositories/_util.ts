import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Throw on a Supabase/PostgREST error, otherwise return the data. Centralises
 * error handling so repository functions stay terse. Works for list queries
 * (`data: T[]`) and `.maybeSingle()` (`data: T | null`) alike.
 */
export function ok<T>(res: { data: T; error: PostgrestError | null }): T {
  if (res.error) throw new Error(`[supabase] ${res.error.message}`)
  return res.data
}

/** True when a scheduled item is live right now (null bounds = open-ended). */
export function isLive(startsAt: string | null, endsAt: string | null, now: Date = new Date()): boolean {
  if (startsAt && new Date(startsAt) > now) return false
  if (endsAt && new Date(endsAt) < now) return false
  return true
}
