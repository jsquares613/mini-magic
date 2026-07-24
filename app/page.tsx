import Header from '@/components/Header'
import Hero from '@/components/Hero'
import { getHomeHeroSlides } from '@/lib/homepage'
import Categories from '@/components/Categories'
import PopularToys from '@/components/PopularToys'
import Promotions from '@/components/Promotions'
import OffersGrid from '@/components/OffersGrid'
import NewArrivals from '@/components/NewArrivals'
import FeaturedProducts from '@/components/FeaturedProducts'
import SectionHeader from '@/components/SectionHeader'
import Footer from '@/components/Footer'
import FadeInSection from '@/components/FadeInSection'

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
    <main className="min-h-screen bg-surface">
      <Header />
      <Hero slides={heroSlides} />
      <FadeInSection>
        <Categories />
      </FadeInSection>
      <FadeInSection>
        <PopularToys />
      </FadeInSection>
      <FadeInSection>
        <Promotions />
      </FadeInSection>
      <FadeInSection>
        <section className="px-4 py-2 md:px-8 md:py-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              title="Special Offers"
              accent="from-red-400 to-rose-500"
              viewAllHref="/offers"
            />
            <OffersGrid limit={4} />
          </div>
        </section>
      </FadeInSection>
      <FadeInSection>
        <NewArrivals />
      </FadeInSection>
      <FadeInSection>
        <FeaturedProducts />
      </FadeInSection>
      <Footer />
    </main>
  )
}
