'use client'

import { useState, type ReactNode } from 'react'

type Chip = { slug: string; label: string; emoji: string }

/**
 * Category filter chips for the Offers page. Swaps between server
 * pre-rendered product grids: ProductCard is an async Server Component, so this
 * Client Component can only toggle *visibility* of already-rendered groups,
 * never render one itself.
 */
export default function OfferCategoryFilter({
  chips,
  groups,
}: {
  chips: Chip[]
  groups: Record<string, ReactNode>
}) {
  const [selected, setSelected] = useState('all')

  return (
    <div>
      <div className="scrollbar-hide mb-6 flex gap-2 overflow-x-auto md:flex-wrap md:gap-3">
        <button
          onClick={() => setSelected('all')}
          className={`flex-shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition ${
            selected === 'all' ? 'bg-secondary text-white' : 'border border-gray-200 bg-white text-gray-700'
          }`}
        >
          All Offers
        </button>
        {chips.map((chip) => (
          <button
            key={chip.slug}
            onClick={() => setSelected(chip.slug)}
            className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition ${
              selected === chip.slug ? 'bg-secondary text-white' : 'border border-gray-200 bg-white text-gray-700'
            }`}
          >
            <span>{chip.emoji}</span>
            {chip.label}
          </button>
        ))}
      </div>

      {groups[selected] ?? groups.all}
    </div>
  )
}
