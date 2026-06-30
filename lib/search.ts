import { getAllProducts } from '@/lib/products'
import { getAllCategories } from '@/lib/categories'
import { repositories } from '@/lib/supabase'
import type { SearchResult } from '@/types'

/**
 * Centralised search across products, categories and play-area content.
 * Backed by Supabase (Phase 3) via `lib/products.ts` / `lib/categories.ts` /
 * the play-area repository — async because reads now go over the network.
 */

function matches(haystack: string[], needle: string): boolean {
  const q = needle.trim().toLowerCase()
  if (!q) return false
  return haystack.some((field) => field.toLowerCase().includes(q))
}

export async function searchSite(query: string): Promise<SearchResult[]> {
  const q = query.trim()
  if (!q) return []

  const [products, categories, playZones] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
    repositories.playArea.getPlayAreaGallery(),
  ])

  const productResults: SearchResult[] = products
    .filter((p) => matches([p.name, p.shortDescription, p.category, ...p.tags], q))
    .map((p) => ({
      type: 'product',
      title: p.name,
      subtitle: p.shortDescription,
      href: `/products/${p.slug}`,
      emoji: p.emoji,
      image: p.images[0],
    }))

  const categoryResults: SearchResult[] = categories
    .filter((c) => matches([c.name, c.description, c.slug], q))
    .map((c) => ({
      type: 'category',
      title: c.name,
      subtitle: c.description,
      href: `/categories/${c.slug}`,
      emoji: c.emoji,
    }))

  const playResults: SearchResult[] = playZones
    .filter((z) => matches([z.alt_text ?? '', 'play area'], q))
    .map((z) => ({
      type: 'play-area',
      title: z.alt_text ?? 'Play Area',
      subtitle: 'Minimagic Play Area',
      href: '/play-area#play-zones',
      image: z.image_url,
    }))

  return [...productResults, ...categoryResults, ...playResults]
}
