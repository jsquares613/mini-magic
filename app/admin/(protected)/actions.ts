'use server'

import { redirect } from 'next/navigation'
import { createAdminSupabase } from '@/lib/supabase/server'

export async function signOut() {
  const supabase = createAdminSupabase()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
