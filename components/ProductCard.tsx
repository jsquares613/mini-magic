import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import WhatsAppCardButton from '@/components/WhatsAppCardButton'
import type { Product } from '@/types'
import { withPricing } from '@/lib/products'
import { getCategoryName } from '@/lib/categories'
import { formatPrice } from '@/lib/format'

/**
 * The single, reusable product card used everywhere a product is shown
 * (home rails, category pages, offers, related products). Replaces the four
 * divergent inline card markups that previously existed.
 *
 * No `'use client'` — it is a presentational, `async` Server Component (just a
 * Link), so it renders inside both server and client trees with zero JS cost.
 * `getCategoryName` is request-cached (see lib/categories.ts), so rendering
 * many cards costs one categories round trip, not one per card.
 */
export default async function ProductCard({ product }: { product: Product }) {
  const { effectivePrice, isOnSale, discountPercent } = withPricing(product)
  const hasImage = product.images.length > 0
  const categoryName = await getCategoryName(product.category)

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-lg">
        {/* Badges */}
        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
          {product.isNew && (
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">New</span>
          )}
        </div>
        {isOnSale && (
          <div className="absolute right-2 top-2 z-10 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
            -{discountPercent}%
          </div>
        )}

        {/* Visual: real image when available, else emoji placeholder */}
        <div className={`relative flex aspect-square items-center justify-center ${product.bg ?? 'bg-gray-50'}`}>
          {hasImage ? (
            <SafeImage
              src={product.images[0]}
              alt={product.name}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="text-6xl transition-transform duration-300 group-hover:scale-110">
              {product.emoji ?? '🎁'}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-4">
          <p className="mb-2 text-xs font-semibold uppercase text-blue-700">{categoryName}</p>
          <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] font-semibold text-gray-900">{product.name}</h3>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`font-bold ${isOnSale ? 'text-green-600' : 'text-blue-900'}`}>
                {formatPrice(effectivePrice)}
              </span>
              {isOnSale && (
                <span className="text-sm text-gray-400 line-through">{formatPrice(product.price)}</span>
              )}
            </div>
            <WhatsAppCardButton productName={product.name} />
          </div>
        </div>
      </div>
    </Link>
  )
}
