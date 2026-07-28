import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import WishlistButton from '@/components/WishlistButton'
import type { Product } from '@/types'
import { withPricing } from '@/lib/products'
import { formatPrice } from '@/lib/format'

/**
 * The single, reusable product card used everywhere a product is shown
 * (home rails, category pages, offers, related products). Replaces the four
 * divergent inline card markups that previously existed.
 *
 * No `'use client'` — it is a presentational Server Component (just a Link),
 * so it renders inside both server and client trees with zero JS cost.
 */
export default function ProductCard({ product }: { product: Product }) {
  const { effectivePrice, isOnSale, discountPercent } = withPricing(product)
  const hasImage = product.images.length > 0

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg md:hover:shadow-xl">
        {isOnSale && (
          <div className="absolute right-1.5 top-1.5 z-10 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white md:right-2 md:top-2 md:px-3 md:py-1 md:text-xs">
            -{discountPercent}%
          </div>
        )}

        {/* Visual: real image when available, else emoji placeholder — always square, matching the recommended 1000x1000 upload */}
        <div className={`relative flex aspect-square items-center justify-center overflow-hidden ${product.bg ?? 'bg-lightYellow'}`}>
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

        {/* Details — white background, natural height below the image */}
        <div className="flex flex-col justify-center gap-0.5 bg-white px-1.5 py-1 md:gap-1 md:px-3 md:py-2">
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
              <WishlistButton productId={product.id} productSlug={product.slug} productName={product.name} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
