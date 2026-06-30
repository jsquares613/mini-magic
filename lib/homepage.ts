import { repositories } from '@/lib/supabase'
import type { HeroSlide } from '@/components/Hero'

/**
 * Homepage content data-access layer — backed by Supabase (Phase 3).
 *
 * Hero slides in the DB store plain text (admin-editable via a form), unlike
 * the original hardcoded `lib/hero.ts` which used per-word coloured segments.
 * Each slide's title/description is wrapped as a single segment so the
 * existing `Hero` component renders unchanged.
 */

export async function getHomeHeroSlides(): Promise<HeroSlide[]> {
  const rows = await repositories.homepage.getHeroSlides()
  return rows.map((row) => ({
    id: row.id,
    image: row.image ?? '/images/hero section/hero1.svg',
    imageAlt: row.title,
    badge: row.subtitle ?? undefined,
    title: [{ text: row.title }],
    description: row.description ? [{ text: row.description }] : [],
    ctaLabel: row.button_text ?? undefined,
    ctaHref: row.button_link ?? undefined,
  }))
}

export const getPromotionalBanners = repositories.homepage.getPromotionalBanners
