import { repositories } from '@/lib/supabase'
import type { HeroSlide } from '@/components/Hero'
import { getLqip } from '@/lib/lqip'

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
  const slides: HeroSlide[] = rows.map((row) => ({
    id: row.id,
    image: row.image ?? '/images/hero section/hero1.svg',
    imageAlt: row.title,
    badge: row.subtitle ?? undefined,
    title: [{ text: row.title }],
    description: row.description ? [{ text: row.description }] : [],
    ctaLabel: row.button_text ?? undefined,
    ctaHref: row.button_link ?? undefined,
  }))

  // Generate real LQIPs for every slide in parallel.
  // getLqip() is backed by unstable_cache (revalidate: false), so the actual
  // Supabase fetch only happens once per unique URL per server lifetime —
  // all subsequent renders are served from the Next.js file-system cache.
  const blurDataURLs = await Promise.all(slides.map((s) => getLqip(s.image)))

  return slides.map((slide, i) => ({ ...slide, blurDataURL: blurDataURLs[i] }))
}

export const getPromotionalBanners = repositories.homepage.getPromotionalBanners
