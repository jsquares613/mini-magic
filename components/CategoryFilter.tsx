'use client'

import { useState, type ReactNode } from 'react'

type Chip = { slug: string; label: string }

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

  return (
    <div>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:gap-3 md:pb-0">
        <button
          onClick={() => setSelected('all')}
          className={`${
            selected === 'all' ? 'bg-yellow-500 text-white' : 'border border-gray-200 bg-white'
          } flex-shrink-0 rounded-full px-4 py-2 text-sm shadow-sm`}
        >
          All Products
        </button>
        {chips.map((chip) => (
          <button
            key={chip.slug}
            onClick={() => setSelected(chip.slug)}
            className={`${
              selected === chip.slug ? 'bg-yellow-500 text-white' : 'border border-gray-200 bg-white'
            } flex-shrink-0 rounded-full px-4 py-2 text-sm shadow-sm`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {groups[selected] ?? groups.all}
    </div>
  )
}
