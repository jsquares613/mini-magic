import { repositories } from '@/lib/supabase'
import { getContactInfo } from '@/lib/settings'
import type { PlayInfoBlock, PlayZone } from '@/types'
import type { HeroSlide } from '@/components/Hero'

/**
 * Play Area content data-access layer — backed by Supabase (Phase 3).
 *
 * Known content-fidelity gap: `play_area_gallery` stores only `image_url` +
 * `alt_text` (no separate name/description columns), so `PlayZone.description`
 * is empty for DB-sourced zones. A follow-up migration could add a
 * `description` column to restore the original per-zone blurb.
 */

export async function getPlayAreaHero(): Promise<HeroSlide[]> {
  const playArea = await repositories.playArea.getPlayArea()
  if (!playArea?.hero_title) return []
  return [
    {
      id: 'play-area-hero',
      image: playArea.hero_image ?? '/images/play area/play-area-1.png',
      imageAlt: playArea.hero_title,
      badge: '🎠 Minimagic Play Area',
      title: [{ text: playArea.hero_title }],
      description: playArea.hero_description ? [{ text: playArea.hero_description }] : [],
      ctaLabel: 'Explore Play Zones',
      ctaHref: '#play-zones',
    },
  ]
}

export async function getPlayZones(): Promise<PlayZone[]> {
  const rows = await repositories.playArea.getPlayAreaGallery()
  return rows.map((row) => ({
    id: row.id,
    name: row.alt_text ?? 'Play Zone',
    description: '', // not stored — see content-fidelity note above
    image: row.image_url,
  }))
}

export async function getPlayFeatures() {
  const rows = await repositories.playArea.getPlayAreaFeatures()
  return rows.map((row) => ({
    icon: row.icon ?? '✓',
    title: row.title,
    desc: row.description ?? '',
    bgColor: 'bg-blue-50',
  }))
}

export async function getPlayRules(): Promise<string[]> {
  const playArea = await repositories.playArea.getPlayArea()
  return playArea?.rules ?? []
}

export async function getPlaySeo(): Promise<{ title: string | null; description: string | null }> {
  const playArea = await repositories.playArea.getPlayArea()
  return { title: playArea?.seo_title ?? null, description: playArea?.seo_description ?? null }
}

/**
 * "Plan Your Visit" info cards. Hours/pricing come from the `play_area`
 * singleton; Find Us comes from `contact_information` — reconstructed from
 * existing tables rather than a dedicated visit-info table.
 */
export async function getPlayVisitInfo(): Promise<PlayInfoBlock[]> {
  const [playArea, contact] = await Promise.all([repositories.playArea.getPlayArea(), getContactInfo()])

  const timings = ((playArea?.timings as { label: string; value: string }[]) ?? []).map(
    (t) => `${t.label}: ${t.value}`,
  )
  const pricing = ((playArea?.pricing as { label: string; value: string }[]) ?? []).map(
    (p) => `${p.label}: ${p.value}`,
  )

  return [
    { icon: '🕒', title: 'Opening Hours', lines: timings.length ? timings : ['Contact us for hours'] },
    { icon: '🎟️', title: 'Entry Passes', lines: pricing.length ? pricing : ['Contact us for pricing'] },
    {
      icon: '📍',
      title: 'Find Us',
      lines: [contact?.address ?? 'Minimagic Store', contact?.phone ?? ''].filter(Boolean),
    },
  ]
}
