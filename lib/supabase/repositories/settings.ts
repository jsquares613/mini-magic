import { getSupabaseClient } from '../client'
import type { Tables } from '../database.types'
import type { Database } from '../database.types'
import { ok } from './_util'

/**
 * Site settings repository: contact info, business hours, navigation, socials,
 * key/value settings, and per-page SEO. Replaces reads from `config/site.ts`.
 */

export type ContactInformation = Tables<'contact_information'>
export type BusinessHours = Tables<'business_hours'>
export type NavigationLink = Tables<'navigation_links'>
export type SocialLink = Tables<'social_links'>
export type SeoPage = Tables<'seo_pages'>
export type NavLocation = Database['public']['Enums']['nav_location']

export async function getContactInformation(): Promise<ContactInformation | null> {
  const sb = getSupabaseClient()
  return ok(await sb.from('contact_information').select('*').eq('id', 1).maybeSingle())
}

export async function getBusinessHours(): Promise<BusinessHours[]> {
  const sb = getSupabaseClient()
  return ok(await sb.from('business_hours').select('*').order('day_of_week', { ascending: true }))
}

export async function getNavigation(location?: NavLocation): Promise<NavigationLink[]> {
  const sb = getSupabaseClient()
  let q = sb.from('navigation_links').select('*').eq('active', true).order('display_order', { ascending: true })
  if (location) q = q.eq('location', location)
  return ok(await q)
}

export async function getSocialLinks(): Promise<SocialLink[]> {
  const sb = getSupabaseClient()
  return ok(await sb.from('social_links').select('*').eq('active', true).order('sort_order', { ascending: true }))
}

/** A single key/value setting (e.g. `announcements`, `footer_text`). */
export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const sb = getSupabaseClient()
  const row = ok(await sb.from('site_settings').select('value').eq('key', key).maybeSingle())
  return row ? (row.value as T) : null
}

/** All settings as a `{ key: value }` map. */
export async function getAllSettings(): Promise<Record<string, unknown>> {
  const sb = getSupabaseClient()
  const rows = ok(await sb.from('site_settings').select('key, value'))
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

export async function getSeoPage(pageKey: string): Promise<SeoPage | null> {
  const sb = getSupabaseClient()
  return ok(await sb.from('seo_pages').select('*').eq('page_key', pageKey).maybeSingle())
}
