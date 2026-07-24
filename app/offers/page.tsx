import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import ProductGrid from '@/components/ProductGrid'
import OfferBanner from '@/components/OfferBanner'
import OfferCategoryFilter from '@/components/OfferCategoryFilter'
import { getProductsOnOffer } from '@/lib/products'
import { getAllCategories } from '@/lib/categories'
import { repositories } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'Special Offers - Minimagic | Deals & Discounts',
  description: 'Grab amazing deals on handpicked toys and essentials with big discounts at Minimagic.',
}

// ISR — see app/page.tsx for why this is needed (no dynamic function on this
// page means Next.js would otherwise cache the rendered HTML indefinitely).
export const revalidate = 60

export default async function OffersPage() {
  const [offers, banner, categories] = await Promise.all([
    getProductsOnOffer(),
    repositories.offers.getOfferBanner(),
    getAllCategories(),
  ])

  const chips = categories
    .filter((c) => offers.some((p) => p.category === c.slug))
    .map((c) => ({ slug: c.slug, label: c.name, emoji: c.emoji }))

  const groups = {
    all: <ProductGrid products={offers} emptyMessage="No offers available at the moment." />,
    ...Object.fromEntries(
      chips.map((chip) => [
        chip.slug,
        <ProductGrid
          key={chip.slug}
          products={offers.filter((p) => p.category === chip.slug)}
          emptyMessage="No offers available in this category."
        />,
      ]),
    ),
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#FFFFEC]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-900">Home</Link>{' '}
            <span className="mx-2">›</span> <span className="font-semibold">Offers</span>
          </nav>

          {banner?.image && <OfferBanner image={banner.image} />}

          <OfferCategoryFilter chips={chips} groups={groups} />
        </div>
      </main>

      <Footer />
    </>
  )
}
