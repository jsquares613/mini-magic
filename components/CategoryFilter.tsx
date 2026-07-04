'use client'

import { useState, type ReactNode } from 'react'

type Chip = { slug: string; label: string }

const ALL_CHIP: Chip = { slug: 'all', label: 'All Products' }

// How many chips (including "All Products") show before the "More" toggle on mobile.
const MOBILE_VISIBLE_COUNT = 4

/**
 * Client-side filter chips that swap between PRE-RENDERED product grids.
 *
 * Why this shape: `ProductGrid`/`ProductCard` are `async` Server Components
 * (Phase 3 — they fetch category names from Supabase). A Client Component
 * cannot import/invoke an async Server Component directly, so the server
 * pre-renders one grid per category (`groups`) and this component only swaps
 * *which already-rendered grid* is visible — zero extra requests per click,
 * same instant-filter UX as the old client-side `.filter()` version.
 */
export default function CategoryFilter({
  chips,
  groups,
}: {
  chips: Chip[]
  groups: Record<string, ReactNode>
}) {
  const [selected, setSelected] = useState('all')
  const [expanded, setExpanded] = useState(false)

  const allChips = [ALL_CHIP, ...chips]
  const hasOverflow = allChips.length > MOBILE_VISIBLE_COUNT

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2 md:gap-3">
        {allChips.map((chip, i) => (
          <button
            key={chip.slug}
            onClick={() => setSelected(chip.slug)}
            className={`${
              selected === chip.slug ? 'bg-yellow-500 text-white' : 'border border-gray-200 bg-white'
            } ${
              // Beyond the mobile cap: hidden on mobile until expanded, always shown from md up.
              hasOverflow && i >= MOBILE_VISIBLE_COUNT && !expanded ? 'hidden md:inline-flex' : 'flex'
            } flex-shrink-0 rounded-full px-4 py-2 text-sm shadow-sm`}
          >
            {chip.label}
          </button>
        ))}
        {hasOverflow && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex-shrink-0 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-blue-700 shadow-sm md:hidden"
          >
            {expanded ? 'Less ▴' : 'More ▾'}
          </button>
        )}
      </div>

      {groups[selected] ?? groups.all}
    </div>
  )
}
