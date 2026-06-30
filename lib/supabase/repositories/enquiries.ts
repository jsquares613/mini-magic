import { getSupabaseClient, getServiceClient } from '../client'
import type { Tables, TablesInsert } from '../database.types'
import { ok } from './_util'

/**
 * Enquiries repository — the lead-management core.
 *
 * - `createEnquiry` runs on the **anon** client (public INSERT allowed by RLS);
 *   it does not read the row back (anon can't SELECT enquiries).
 * - All admin/CRM functions run on the **service** client (server-only) since
 *   reads/updates are staff-restricted by RLS.
 */

export type Enquiry = Tables<'enquiries'>
export type EnquiryNote = Tables<'enquiry_notes'>
export type EnquiryInsert = TablesInsert<'enquiries'>
export type EnquiryStatus = Enquiry['status']

/** Public: submit an enquiry (web form or best-effort WhatsApp logging). */
export async function createEnquiry(payload: EnquiryInsert): Promise<void> {
  const sb = getSupabaseClient()
  const { error } = await sb.from('enquiries').insert(payload)
  if (error) throw new Error(`[supabase] ${error.message}`)
}

/* ----------------------------- Admin / CRM ----------------------------- */

export interface EnquiryFilter {
  status?: EnquiryStatus
  type?: Enquiry['enquiry_type']
  assignedTo?: string
  limit?: number
}

export async function listEnquiries(filter: EnquiryFilter = {}): Promise<Enquiry[]> {
  const sb = getServiceClient()
  let q = sb.from('enquiries').select('*').order('created_at', { ascending: false })
  if (filter.status) q = q.eq('status', filter.status)
  if (filter.type) q = q.eq('enquiry_type', filter.type)
  if (filter.assignedTo) q = q.eq('assigned_to', filter.assignedTo)
  if (filter.limit) q = q.limit(filter.limit)
  return ok(await q)
}

export async function getEnquiry(id: string): Promise<{ enquiry: Enquiry; notes: EnquiryNote[] } | null> {
  const sb = getServiceClient()
  const enquiry = ok(await sb.from('enquiries').select('*').eq('id', id).maybeSingle())
  if (!enquiry) return null
  const notes = ok(
    await sb.from('enquiry_notes').select('*').eq('enquiry_id', id).order('created_at', { ascending: true }),
  )
  return { enquiry, notes }
}

export async function updateEnquiryStatus(id: string, status: EnquiryStatus): Promise<Enquiry> {
  const sb = getServiceClient()
  const patch: Partial<Enquiry> = { status }
  if (status === 'contacted') patch.contacted_at = new Date().toISOString()
  if (status === 'converted') patch.converted_at = new Date().toISOString()
  return ok(await sb.from('enquiries').update(patch).eq('id', id).select('*').single())
}

export async function assignEnquiry(id: string, userId: string | null): Promise<Enquiry> {
  const sb = getServiceClient()
  return ok(await sb.from('enquiries').update({ assigned_to: userId }).eq('id', id).select('*').single())
}

export async function markLost(id: string, reason: string): Promise<Enquiry> {
  const sb = getServiceClient()
  return ok(
    await sb.from('enquiries').update({ status: 'lost', outcome_reason: reason }).eq('id', id).select('*').single(),
  )
}

export async function markConverted(id: string, estimatedValue?: number): Promise<Enquiry> {
  const sb = getServiceClient()
  return ok(
    await sb
      .from('enquiries')
      .update({ status: 'converted', converted_at: new Date().toISOString(), estimated_value: estimatedValue ?? null })
      .eq('id', id)
      .select('*')
      .single(),
  )
}

export async function addEnquiryNote(enquiryId: string, note: string, createdBy?: string): Promise<EnquiryNote> {
  const sb = getServiceClient()
  return ok(
    await sb.from('enquiry_notes').insert({ enquiry_id: enquiryId, note, created_by: createdBy ?? null }).select('*').single(),
  )
}
