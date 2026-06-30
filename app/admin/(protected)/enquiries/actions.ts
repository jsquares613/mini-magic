'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase/server'
import { requireStaff, getSessionUser } from '@/lib/supabase/auth'
import { str, num } from '@/lib/admin/form'
import type { Database, TablesUpdate } from '@/lib/supabase/database.types'

type Status = Database['public']['Enums']['enquiry_status']

function refresh(id: string) {
  revalidatePath('/admin/enquiries')
  revalidatePath(`/admin/enquiries/${id}`)
}

export async function setStatus(id: string, formData: FormData) {
  await requireStaff()
  const supabase = createServerSupabase()
  const status = (str(formData, 'status') ?? 'new') as Status
  const patch: TablesUpdate<'enquiries'> = { status }
  if (status === 'contacted') patch.contacted_at = new Date().toISOString()
  if (status === 'converted') patch.converted_at = new Date().toISOString()
  await supabase.from('enquiries').update(patch).eq('id', id)
  refresh(id)
}

export async function assignEnquiry(id: string, formData: FormData) {
  await requireStaff()
  const supabase = createServerSupabase()
  const assignedTo = str(formData, 'assigned_to') // '' → unassign
  await supabase.from('enquiries').update({ assigned_to: assignedTo }).eq('id', id)
  refresh(id)
}

export async function addNote(enquiryId: string, formData: FormData) {
  await requireStaff()
  const note = str(formData, 'note')
  if (!note) return
  const supabase = createServerSupabase()
  const user = await getSessionUser()
  await supabase.from('enquiry_notes').insert({ enquiry_id: enquiryId, note, created_by: user?.id ?? null })
  refresh(enquiryId)
}

export async function markConverted(id: string, formData: FormData) {
  await requireStaff()
  const supabase = createServerSupabase()
  await supabase
    .from('enquiries')
    .update({ status: 'converted', converted_at: new Date().toISOString(), estimated_value: num(formData, 'estimated_value') })
    .eq('id', id)
  refresh(id)
}

export async function markLost(id: string, formData: FormData) {
  await requireStaff()
  const supabase = createServerSupabase()
  await supabase.from('enquiries').update({ status: 'lost', outcome_reason: str(formData, 'outcome_reason') }).eq('id', id)
  refresh(id)
}
