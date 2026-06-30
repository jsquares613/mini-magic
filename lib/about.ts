import { cache } from 'react'
import { repositories } from '@/lib/supabase'
import { aboutHeroSlides } from '@/lib/hero'
import type { HeroSlide } from '@/components/Hero'
import type { AboutGalleryItem, AboutStatistic, TeamMember, Testimonial } from '@/types'
import type { AboutStatisticRow, TeamMemberRow, TestimonialRow } from '@/lib/supabase/repositories/about'

/**
 * About Us content data-access layer — backed by Supabase. Mirrors
 * `lib/categories.ts`'s `cache()`-wrapped convention so the many components
 * that might need this content share one Supabase round trip per request.
 */

export const getCachedAboutPage = cache(async () => repositories.about.getAboutPage())

export async function getAboutContent() {
  const page = await getCachedAboutPage()
  return {
    story: page?.story ?? '',
    storyTitle: page?.story_title ?? null,
    storyImage: page?.story_image ?? null,
    mission: page?.mission ?? '',
    vision: page?.vision ?? '',
    valuesText: page?.values_text ?? '',
  }
}

/**
 * Falls back to the hardcoded `aboutHeroSlides` carousel until an admin sets
 * `hero_title` on `about_page` — mirrors `getPlayAreaHero()`'s DB-override
 * pattern, but degrades to existing content instead of an empty hero.
 */
export async function getAboutHero(): Promise<HeroSlide[]> {
  const page = await getCachedAboutPage()
  if (!page?.hero_title) return aboutHeroSlides
  return [
    {
      id: 'about-hero',
      image: page.hero_image ?? aboutHeroSlides[0].image,
      imageAlt: page.hero_title,
      badge: '✨ Our Story',
      title: [{ text: page.hero_title }],
      description: page.hero_description ? [{ text: page.hero_description }] : [],
      ctaLabel: 'Discover Our Story',
      ctaHref: '#our-story',
    },
  ]
}

export async function getAboutSeo(): Promise<{ title: string | null; description: string | null }> {
  const page = await getCachedAboutPage()
  return { title: page?.seo_title ?? null, description: page?.seo_description ?? null }
}

export async function getAboutGallery(): Promise<AboutGalleryItem[]> {
  const page = await getCachedAboutPage()
  return (page?.gallery as unknown as AboutGalleryItem[]) ?? []
}

function toStatistic(row: AboutStatisticRow): AboutStatistic {
  return { id: row.id, label: row.label, value: Number(row.value), suffix: row.suffix ?? '' }
}

export const getAboutStatistics = cache(async (): Promise<AboutStatistic[]> => {
  const rows = await repositories.about.getAboutStatistics()
  return rows.map(toStatistic)
})

function toTeamMember(row: TeamMemberRow): TeamMember {
  return { id: row.id, name: row.name, designation: row.designation ?? '', image: row.image, bio: row.bio ?? '' }
}

export const getTeamMembers = cache(async (): Promise<TeamMember[]> => {
  const rows = await repositories.about.getTeamMembers()
  return rows.map(toTeamMember)
})

function toTestimonial(row: TestimonialRow): Testimonial {
  return {
    id: row.id,
    authorName: row.author_name,
    authorRole: row.author_role ?? '',
    quote: row.quote,
    rating: row.rating,
    image: row.image,
  }
}

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  const rows = await repositories.about.getTestimonials()
  return rows.map(toTestimonial)
})
