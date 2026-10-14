import type { Tone } from '@/components/admin/ui'
import type { Enums } from '@/lib/supabase/database.types'

/** Human labels + badge tones for enquiry enums (dashboard, list and detail pages). */
export const ENQUIRY_STATUS: Record<Enums<'enquiry_status'>, { label: string; tone: Tone }> = {
  new: { label: 'New', tone: 'blue' },
  contacted: { label: 'Contacted', tone: 'amber' },
  in_progress: { label: 'In progress', tone: 'violet' },
  converted: { label: 'Converted', tone: 'green' },
  lost: { label: 'Lost', tone: 'gray' },
}

export const ENQUIRY_STATUS_ORDER = ['new', 'contacted', 'in_progress', 'converted', 'lost'] as const

export const ENQUIRY_TYPE: Record<Enums<'enquiry_type'>, string> = {
  product: 'Product',
  play_area: 'Play area',
  contact: 'Contact',
  general: 'General',
}

export const ENQUIRY_CHANNEL: Record<Enums<'enquiry_channel'>, string> = {
  web_form: 'Website form',
  whatsapp: 'WhatsApp',
  phone: 'Phone',
  email: 'Email',
}

export const CONTACT_PREFERENCE: Record<Enums<'contact_preference'>, string> = {
  phone: 'Phone call',
  whatsapp: 'WhatsApp',
  email: 'Email',
  any: 'Any',
}
