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
      <div className="relative grid aspect-[3/5] grid-rows-[80fr_20fr] overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg md:aspect-auto md:grid-rows-[3fr_1fr] md:hover:shadow-xl">
        {/* Badges */}
        <div className="absolute left-1.5 top-1.5 z-10 flex flex-col gap-1 md:left-2 md:top-2">
          {product.isNew && (
            <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white md:px-3 md:py-1 md:text-xs">
              New
            </span>
          )}
        </div>
        {isOnSale && (
          <div className="absolute right-1.5 top-1.5 z-10 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white md:right-2 md:top-2 md:px-3 md:py-1 md:text-xs">
            -{discountPercent}%
          </div>
        )}

        {/* Visual: real image when available, else emoji placeholder — ~80% of the card */}
        <div className={`relative flex items-center justify-center overflow-hidden ${product.bg ?? 'bg-lightYellow'}`}>
          {hasImage ? (
            <SafeImage
              src={product.images[0]}
              alt={product.name}
              sizes="(max-width: 640px) 33vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="text-3xl transition-transform duration-300 group-hover:scale-110 md:text-6xl">
              {product.emoji ?? '🎁'}
            </span>
          )}
        </div>

        {/* Details — white background, ~20% of the card */}
        <div className="flex flex-col justify-center gap-0.5 bg-white px-1.5 py-1 md:gap-1 md:px-3 md:py-2">
          <p className="text-[8px] font-bold uppercase tracking-wide text-gray-400 md:text-xs md:text-amber-600">
            {categoryName}
          </p>
          <h3 className="line-clamp-1 text-[11px] font-semibold text-gray-900 md:mb-1 md:text-base">{product.name}</h3>
          <div className="flex items-center justify-between gap-1 md:gap-2">
            <div className="flex flex-wrap items-baseline gap-1 md:gap-2">
              <span className={`text-xs font-bold md:text-base ${isOnSale ? 'text-green-600' : 'text-blue-900'}`}>
                {formatPrice(effectivePrice)}
              </span>
              {isOnSale && (
                <span className="text-[9px] text-gray-400 line-through md:text-sm">{formatPrice(product.price)}</span>
              )}
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <WhatsAppCardButton productName={product.name} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
