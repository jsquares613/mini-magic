import { getSupabaseClient } from '../client'
import type { Tables } from '../database.types'
import { ok } from './_util'

/** Play Area content repository (singleton config + gallery/features). */

export type PlayArea = Tables<'play_area'>
export type PlayAreaGalleryItem = Tables<'play_area_gallery'>
export type PlayAreaFeature = Tables<'play_area_features'>

export async function getPlayArea(): Promise<PlayArea | null> {
  const sb = getSupabaseClient()
  return ok(await sb.from('play_area').select('*').eq('id', 1).maybeSingle())
}

export async function getPlayAreaGallery(): Promise<PlayAreaGalleryItem[]> {
  const sb = getSupabaseClient()
  return ok(await sb.from('play_area_gallery').select('*').order('sort_order', { ascending: true }))
}

export async function getPlayAreaFeatures(): Promise<PlayAreaFeature[]> {
  const sb = getSupabaseClient()
  return ok(await sb.from('play_area_features').select('*').order('sort_order', { ascending: true }))
}
