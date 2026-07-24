import Link from 'next/link'
import { repositories } from '@/lib/supabase'

/**
 * Homepage promotional banners — sourced from `promotional_banners`, the
 * table managed by Admin → Homepage → Promotional Banners (CRUD + scheduling
 * via starts_at/ends_at). Display/marketing only; does NOT affect product
 * prices, which come from each product's own `sale_price`.
 *
 * (Category-specific banners live in `category_promotions` and render on
 * each category's own page — see app/categories/[slug]/page.tsx.)
 */
/** Cycled per tile index when a banner has no admin-uploaded image, matching the four reference colors. */
const TILE_STYLES = [
  { bg: 'bg-blue-900', text: 'text-white', sub: 'text-blue-100', cta: 'bg-white text-blue-900 hover:bg-blue-50' },
  { bg: 'bg-yellow-400', text: 'text-blue-900', sub: 'text-blue-900/70', cta: 'bg-blue-900 text-white hover:bg-blue-800' },
  { bg: 'bg-orange-200', text: 'text-gray-900', sub: 'text-gray-700', cta: 'bg-blue-900 text-white hover:bg-blue-800' },
  { bg: 'bg-sky-300', text: 'text-blue-900', sub: 'text-blue-900/70', cta: 'bg-blue-900 text-white hover:bg-blue-800' },
] as const

export default async function Promotions() {
  const banners = await repositories.homepage.getPromotionalBanners()
  const promos = banners.slice(0, 4)

  if (promos.length === 0) return null

  return (
    <section className="px-4 py-2 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-6">
          {promos.map((banner, i) => {
            const style = TILE_STYLES[i % TILE_STYLES.length]
            return (
              <div
                key={banner.id}
                className={`group relative flex min-h-[150px] flex-col justify-center overflow-hidden rounded-2xl p-4 shadow-sm ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-lg md:min-h-[220px] md:p-8 ${
                  banner.image ? '' : style.bg
                }`}
              >
                {banner.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={banner.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="relative">
                  <h3 className={`mb-1 text-lg font-bold md:text-2xl ${banner.image ? 'text-white' : style.text}`}>
                    {banner.title}
                  </h3>
                  {banner.badge_text && (
                    <div className="mb-2 md:mb-3">
                      <span className={`text-base font-bold md:text-xl ${banner.image ? 'text-white' : style.text}`}>
                        {banner.badge_text}
                      </span>
                    </div>
                  )}
                  {banner.subtitle && (
                    <p className={`mb-2 text-xs md:mb-3 md:text-sm ${banner.image ? 'text-white/80' : style.sub}`}>
                      {banner.subtitle}
                    </p>
                  )}
                  <Link
                    href={banner.link ?? '/categories'}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition md:text-sm ${
                      banner.image ? 'bg-white text-gray-900 hover:bg-gray-100' : style.cta
                    }`}
                  >
                    Shop Now
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
