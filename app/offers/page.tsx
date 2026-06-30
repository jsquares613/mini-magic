import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import ProductGrid from '@/components/ProductGrid'
import { getProductsOnOffer } from '@/lib/products'

export const metadata: Metadata = {
  title: 'Special Offers - Minimagic | Deals & Discounts',
  description: 'Grab amazing deals on handpicked toys and essentials with big discounts at Minimagic.',
}

// ISR — see app/page.tsx for why this is needed (no dynamic function on this
// page means Next.js would otherwise cache the rendered HTML indefinitely).
export const revalidate = 60

export default async function OffersPage() {
  const offers = await getProductsOnOffer()
  const maxDiscount = offers.length ? Math.max(...offers.map((p) => p.discountPercent)) : 0

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#FFFFEC]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <nav className="mb-3 text-sm text-gray-500">
                <Link href="/" className="hover:text-blue-900">Home</Link>{' '}
                <span className="mx-2">›</span> <span className="font-semibold">Offers</span>
              </nav>
              <h1 className="text-4xl font-bold md:text-5xl">
                Special <span className="text-orange-500">Offers</span>
              </h1>
              <p className="mt-3 max-w-xl text-gray-600">
                Grab amazing deals on our handpicked selection of products with huge discounts!
              </p>
            </div>

            <div className="hidden flex-col items-end md:flex">
              <div className="flex gap-3">
                <div className="rounded-full bg-red-500 px-4 py-2 font-bold text-white">{offers.length} Deals</div>
                <div className="rounded-full bg-blue-900 px-4 py-2 font-bold text-white">Save up to {maxDiscount}%</div>
              </div>
              <p className="mt-3 text-sm text-gray-500">Limited time offers — shop now before they're gone!</p>
            </div>
          </div>

          <ProductGrid products={offers} emptyMessage="No offers available at the moment." />
        </div>
      </main>

      <Footer />
    </>
  )
}
