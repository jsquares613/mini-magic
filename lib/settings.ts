import { cache } from 'react'
import { repositories } from '@/lib/supabase'

/**
 * Site settings data-access layer — backed by Supabase (Phase 3). Replaces the
 * static `config/site.ts` for content staff actually manage day-to-day (nav,
 * contact, socials, announcements, footer). `config/site.ts` itself still
 * supplies brand-identity defaults (name/url/logo) used by `app/layout.tsx`
 * metadata, which is intentionally NOT per-request dynamic (it's build-time
 * brand identity, not admin content).
 */

export const getContactInfo = cache(async () => repositories.settings.getContactInformation())
export const getBusinessHours = cache(async () => repositories.settings.getBusinessHours())
export const getHeaderNav = cache(async () => repositories.settings.getNavigation('header'))
export const getFooterQuickLinks = cache(async () => repositories.settings.getNavigation('footer_quick'))
export const getFooterCategoryLinks = cache(async () => repositories.settings.getNavigation('footer_category'))
export const getSocialLinks = cache(async () => repositories.settings.getSocialLinks())

export const getAnnouncements = cache(async (): Promise<string[]> => {
  const value = await repositories.settings.getSetting<string[]>('announcements')
  return value ?? []
})

export const getFooterText = cache(async (): Promise<string | null> => {
  const value = await repositories.settings.getSetting<string>('footer_text')
  return value ?? null
})
