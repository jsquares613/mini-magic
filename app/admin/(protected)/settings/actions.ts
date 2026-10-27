'use server'

import { revalidatePath } from 'next/cache'
import { createAdminSupabase } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/supabase/auth'
import { str, bool, lineList } from '@/lib/admin/form'

function revalidateSettings() {
  revalidatePath('/admin/settings')
  revalidatePath('/', 'layout')
}

export async function updateContactInfo(formData: FormData) {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { error } = await supabase.from('contact_information').upsert({
    id: 1,
    phone:     str(formData, 'phone'),
    whatsapp:  str(formData, 'whatsapp'),
    email:     str(formData, 'email'),
    address:   str(formData, 'address'),
    map_url:   str(formData, 'map_url'),
  })
  if (error) return { error: error.message }
  revalidateSettings()
}

export async function updateBannerSettings(formData: FormData) {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { error } = await supabase.from('site_settings').upsert(
    [
      { key: 'announcement_enabled', value: bool(formData, 'announcement_enabled') },
      { key: 'announcements', value: lineList(formData, 'messages') },
      { key: 'marquee_enabled', value: bool(formData, 'marquee_enabled') },
    ],
    { onConflict: 'key' },
  )
  if (error) return { error: error.message }
  revalidateSettings()
}

export async function updateFooterText(formData: FormData) {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const value = str(formData, 'footer_text')
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key: 'footer_text', value }, { onConflict: 'key' })
  if (error) return { error: error.message }
  revalidateSettings()
}
