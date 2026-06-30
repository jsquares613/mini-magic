'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/supabase/auth'
import { str } from '@/lib/admin/form'

function revalidateSettings() {
  revalidatePath('/admin/settings')
  revalidatePath('/')
}

export async function updateContactInfo(formData: FormData) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { error } = await supabase.from('contact_information').upsert({
    id: 1,
    phone:     str(formData, 'phone'),
    whatsapp:  str(formData, 'whatsapp'),
    email:     str(formData, 'email'),
    address:   str(formData, 'address'),
    map_url:   str(formData, 'map_url'),
  })
  if (error) throw new Error(error.message)
  revalidateSettings()
}

export async function updateFooterText(formData: FormData) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const value = str(formData, 'footer_text')
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key: 'footer_text', value }, { onConflict: 'key' })
  if (error) throw new Error(error.message)
  revalidateSettings()
}
