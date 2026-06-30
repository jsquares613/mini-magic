import { redirect } from 'next/navigation'
import { createServerSupabase } from './server'
import type { Tables } from './database.types'

export type Profile = Tables<'profiles'>
export type Role = Profile['role']

/** The current authenticated user (or null). */
export async function getSessionUser() {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/** The current user's profile row (role etc.), or null if not signed in. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  return data
}

const STAFF_ROLES: Role[] = ['admin', 'editor', 'viewer']

/**
 * Guard for admin pages/actions. Redirects to login if signed-out, or to the
 * dashboard with an error if the account has no staff profile. Returns the
 * profile so callers can branch on role.
 */
export async function requireStaff(minRole: Role = 'viewer'): Promise<Profile> {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/admin/login')
  if (!STAFF_ROLES.includes(profile.role)) redirect('/admin/login?error=not-staff')

  // Role hierarchy: admin > editor > viewer
  const rank: Record<Role, number> = { viewer: 1, editor: 2, admin: 3 }
  if (rank[profile.role] < rank[minRole]) redirect('/admin?error=insufficient-role')

  return profile
}

/** True if the role can create/edit/delete content. */
export function canWrite(role: Role): boolean {
  return role === 'admin' || role === 'editor'
}
