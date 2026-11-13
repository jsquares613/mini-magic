import type { ProductColorJson } from '@/lib/supabase/database.types'

/**
 * Product colours (products.colors). Each colour has a stable `id` so photos
 * can be tied to it (product_images.color_id) and survive a rename.
 * Shared by the admin form, the server actions and the storefront.
 */
export type ProductColor = ProductColorJson

export const MAX_COLORS = 20
const MAX_NAME = 40
const HEX = /^#[0-9a-f]{6}$/i

/** Quick-add chips in the admin, and swatches for colours saved without one. */
export const COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Yellow', hex: '#facc15' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Navy', hex: '#1e3a8a' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Brown', hex: '#92400e' },
  { name: 'Black', hex: '#111827' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Grey', hex: '#9ca3af' },
  { name: 'Silver', hex: '#cbd5e1' },
  { name: 'Gold', hex: '#d4a017' },
]

const PRESET_BY_NAME = new Map(COLOR_PRESETS.map((p) => [p.name.toLowerCase(), p.hex]))
PRESET_BY_NAME.set('gray', '#9ca3af')

/** The colour to paint a swatch with: its own hex, else a preset matching its name. */
export function swatchOf(color: Pick<ProductColor, 'name' | 'hex'>): string | null {
  return color.hex ?? PRESET_BY_NAME.get(color.name.trim().toLowerCase()) ?? null
}

/** True for light swatches (white, yellow…) that need a visible border / dark tick. */
export function isLightSwatch(hex: string | null): boolean {
  if (!hex) return true
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return 0.299 * r + 0.587 * g + 0.114 * b > 186
}

/** Validates untrusted input (form JSON, a jsonb column) into a clean colour list. */
export function parseColors(raw: unknown): ProductColor[] {
  let value = raw
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return []
    }
  }
  if (!Array.isArray(value)) return []

  const seenIds = new Set<string>()
  const seenNames = new Set<string>()
  const out: ProductColor[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const { id, name, hex } = item as Record<string, unknown>
    const cleanName = typeof name === 'string' ? name.trim().slice(0, MAX_NAME) : ''
    const cleanId = typeof id === 'string' ? id.trim().slice(0, 64) : ''
    if (!cleanName || !cleanId) continue
    const key = cleanName.toLowerCase()
    if (seenIds.has(cleanId) || seenNames.has(key)) continue
    seenIds.add(cleanId)
    seenNames.add(key)
    out.push({ id: cleanId, name: cleanName, hex: typeof hex === 'string' && HEX.test(hex) ? hex.toLowerCase() : null })
    if (out.length >= MAX_COLORS) break
  }
  return out
}

/** A fresh colour id (browser or server). */
export function newColorId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}
