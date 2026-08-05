'use client'

import { useState } from 'react'
import ProductGrid from '@/components/ProductGrid'
import type { Product, Subcategory } from '@/types'

export default function SubcategoryFilter({
  subcategories,
  products,
}: {
  subcategories: Subcategory[]
  products: Product[]
}) {
  const [selected, setSelected] = useState<string | null>(null)

  const filtered = selected
    ? products.filter((p) => p.subcategory === selected)
    : products

  return (
    <>
      {subcategories.length > 0 && (
        <div className="mb-5">
          {/* Mobile: single scrollable row  Desktop: wraps */}
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible md:pb-0">
            <button
              onClick={() => setSelected(null)}
              className={`flex shrink-0 items-center rounded-full border px-3.5 py-1.5 text-sm font-semibold shadow-sm transition-colors ${
                selected === null
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-700'
              }`}
            >
              All
            </button>

            {subcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelected(sub.slug === selected ? null : sub.slug)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold shadow-sm transition-colors ${
                  selected === sub.slug
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-700'
                }`}
              >
                {sub.emoji && <span aria-hidden="true">{sub.emoji}</span>}
                {sub.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <p className="text-sm text-gray-500">
          {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
          {selected && (
            <span className="ml-1 text-blue-600">
              in {subcategories.find((s) => s.slug === selected)?.name}
            </span>
          )}
        </p>
      </div>

      <ProductGrid
        products={filtered}
        emptyMessage={
          selected
            ? `No products in this subcategory yet. Check back soon!`
            : 'No products in this category yet. Check back soon!'
        }
      />
    </>
  )
}
