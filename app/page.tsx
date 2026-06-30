import Link from 'next/link'
import Header from '@/components/Header'
import Hero from '@/components/Hero'
import { getHomeHeroSlides } from '@/lib/homepage'
import Categories from '@/components/Categories'
import PopularToys from '@/components/PopularToys'
import Promotions from '@/components/Promotions'
import OffersGrid from '@/components/OffersGrid'
import NewArrivals from '@/components/NewArrivals'
import FeaturedProducts from '@/components/FeaturedProducts'
import Footer from '@/components/Footer'

/**
 * ISR: without this, Next.js treats this page as fully static (no dynamic
 * function detected) and caches the rendered HTML indefinitely — surviving
 * even a dev server restart. Admin-driven changes still appear immediately
 * via `revalidatePath('/')` in the relevant Server Actions, but this is the
 * time-based fallback for any other path to data changes.
 */
export const revalidate = 60

export default async function Home() {
  const heroSlides = await getHomeHeroSlides()

  return (
    <main className="min-h-screen bg-[#FFFFEC]">
      <Header />
      <Hero slides={heroSlides} />
      <Categories />
      <PopularToys />
      <Promotions />
      <section className="bg-[#FFFFEC] px-4 py-16 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Special Offers</h2>
          <Link href="/offers" className="font-semibold text-blue-600">
            View All →
          </Link>
        </div>
        <div className="mx-auto max-w-7xl px-4">
          <OffersGrid limit={4} />
        </div>
      </section>
      <NewArrivals />
      <FeaturedProducts />
      <Footer />
    </main>
  )
}
