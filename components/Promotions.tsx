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
export default async function Promotions() {
  const banners = await repositories.homepage.getPromotionalBanners()
  const promos = banners.slice(0, 2)

  if (promos.length === 0) return null

  return (
    <section className="bg-[#FFFFEC] px-4 py-16 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {promos.map((banner) => (
            <div
              key={banner.id}
              className={`relative flex min-h-[260px] items-center overflow-hidden rounded-lg p-8 md:p-12 ${
                banner.image ? '' : 'bg-yellow-200'
              }`}
            >
              {banner.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={banner.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
              )}
              <div className="relative">
                <h3 className="mb-2 text-4xl font-bold text-gray-800 md:text-5xl">{banner.title}</h3>
                {banner.badge_text && (
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-blue-900 md:text-4xl">{banner.badge_text}</span>
                  </div>
                )}
                {banner.subtitle && <p className="mb-4 text-sm text-gray-600">{banner.subtitle}</p>}
                <Link
                  href={banner.link ?? '/categories'}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-900 px-6 py-2 font-bold text-white transition hover:bg-blue-800"
                >
                  Explore
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
