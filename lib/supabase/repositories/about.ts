import { getSupabaseClient } from '../client'
import type { Tables } from '../database.types'
import { ok } from './_util'

/** About Us content repository (singleton config + statistics/team/testimonials). */

export type AboutPage = Tables<'about_page'>
export type AboutStatisticRow = Tables<'about_statistics'>
export type TeamMemberRow = Tables<'team_members'>
export type TestimonialRow = Tables<'testimonials'>

export async function getAboutPage(): Promise<AboutPage | null> {
  const sb = getSupabaseClient()
  return ok(await sb.from('about_page').select('*').eq('id', 1).maybeSingle())
}

export async function getAboutStatistics(): Promise<AboutStatisticRow[]> {
  const sb = getSupabaseClient()
  return ok(await sb.from('about_statistics').select('*').order('sort_order', { ascending: true }))
}

export async function getTeamMembers(): Promise<TeamMemberRow[]> {
  const sb = getSupabaseClient()
  return ok(
    await sb.from('team_members').select('*').eq('active', true).order('display_order', { ascending: true }),
  )
}

export async function getTestimonials(): Promise<TestimonialRow[]> {
  const sb = getSupabaseClient()
  return ok(
    await sb.from('testimonials').select('*').eq('active', true).order('display_order', { ascending: true }),
  )
}
