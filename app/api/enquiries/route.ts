import { NextResponse } from 'next/server'
import type { EnquiryPayload } from '@/types'
import { getSupabaseClient } from '@/lib/supabase/client'
import { repositories } from '@/lib/supabase'

/**
 * Enquiry submission endpoint — the real persistence path for every "Send
 * Enquiry" CTA on the storefront (product pages, play-area, contact).
 *
 * Maps the client's `EnquiryPayload` (source: 'product' | 'play-area' |
 * 'contact') onto the `enquiries` table (enquiry_type enum uses 'play_area',
 * underscored) and resolves `productSlug` to a real `product_id` so the
 * admin Enquiry CRM can link back to the product.
 */

function isValid(body: Partial<EnquiryPayload>): body is EnquiryPayload {
  return Boolean(
    body &&
      typeof body.name === 'string' &&
      body.name.trim() &&
      typeof body.email === 'string' &&
      body.email.includes('@') &&
      typeof body.phone === 'string' &&
      body.phone.trim() &&
      typeof body.subject === 'string' &&
      typeof body.source === 'string',
  )
}

const SOURCE_TO_ENQUIRY_TYPE = {
  product: 'product',
  'play-area': 'play_area',
  contact: 'contact',
} as const

export async function POST(request: Request) {
  let body: Partial<EnquiryPayload>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  if (!isValid(body)) {
    return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 422 })
  }

  let productId: string | null = null
  if (body.productSlug) {
    const sb = getSupabaseClient()
    const { data } = await sb.from('products').select('id').eq('slug', body.productSlug).maybeSingle()
    productId = data?.id ?? null
  }

  try {
    await repositories.enquiries.createEnquiry({
      name: body.name,
      email: body.email,
      phone: body.phone,
      message: body.message || null,
      subject: body.subject,
      enquiry_type: SOURCE_TO_ENQUIRY_TYPE[body.source as keyof typeof SOURCE_TO_ENQUIRY_TYPE] ?? 'general',
      product_id: productId,
      source_page: request.headers.get('referer'),
    })
  } catch (err) {
    console.error('[enquiry] insert failed:', err)
    return NextResponse.json({ ok: false, error: 'Failed to save enquiry' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: 'Enquiry received' }, { status: 201 })
}
