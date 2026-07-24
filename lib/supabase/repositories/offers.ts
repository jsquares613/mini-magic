import { getSupabaseClient } from '../client'
import type { Tables } from '../database.types'
import { ok } from './_util'

/** Offers page content repository (singleton hero banner). */

export type OfferBanner = Tables<'offer_banner'>

export async function getOfferBanner(): Promise<OfferBanner | null> {
  const sb = getSupabaseClient()
  const row = ok(await sb.from('offer_banner').select('*').eq('id', 1).maybeSingle())
  return row && row.active ? row : null
}
