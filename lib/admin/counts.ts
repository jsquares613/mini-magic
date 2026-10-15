import type { TypedSupabaseClient } from '@/lib/supabase/client'
import type { Enums } from '@/lib/supabase/database.types'
import { ENQUIRY_STATUS_ORDER } from './enquiryLabels'

/**
 * Grouped counts for admin pages — one query via the Postgres functions in
 * migration 20261015100000_admin_performance.sql. If that migration isn't
 * applied yet, falls back to per-item head counts so a deploy can't break
 * the pages (slower, same numbers).
 */

type Client = Pick<TypedSupabaseClient, 'from' | 'rpc'>
type EnquiryStatus = Enums<'enquiry_status'>

/** `categoryIds` is only awaited for the fallback, so the grouped query can run in parallel with the categories query. */
export async function categoryProductCounts(
  supabase: Client,
  categoryIds: Promise<string[]>,
): Promise<Map<string, { total: number; live: number }>> {
  const { data, error } = await supabase.rpc('category_product_counts')
  if (!error && data) {
    return new Map(data.map((r) => [r.category_id, { total: Number(r.total), live: Number(r.published) }]))
  }
  return new Map(
    await Promise.all(
      (await categoryIds).map(async (id) => {
        const [total, live] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('category_id', id),
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('category_id', id).eq('is_published', true),
        ])
        return [id, { total: total.count ?? 0, live: live.count ?? 0 }] as const
      }),
    ),
  )
}

export async function enquiryStatusCounts(supabase: Client, type?: Enums<'enquiry_type'> | null): Promise<Record<EnquiryStatus, number>> {
  const counts = Object.fromEntries(ENQUIRY_STATUS_ORDER.map((s) => [s, 0])) as Record<EnquiryStatus, number>
  const { data, error } = await supabase.rpc('enquiry_status_counts', { p_type: type ?? null })
  if (!error && data) {
    for (const r of data) counts[r.status] = Number(r.total)
    return counts
  }
  await Promise.all(
    ENQUIRY_STATUS_ORDER.map(async (s) => {
      let q = supabase.from('enquiries').select('id', { count: 'exact', head: true }).eq('status', s)
      if (type) q = q.eq('enquiry_type', type)
      const { count } = await q
      counts[s] = count ?? 0
    }),
  )
  return counts
}
