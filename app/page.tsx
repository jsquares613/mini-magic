import Header from '@/components/Header'
import Hero from '@/components/Hero'
import { getHomeHeroSlides } from '@/lib/homepage'
import Categories from '@/components/Categories'
import Promotions from '@/components/Promotions'
import OffersRail from '@/components/OffersRail'
import AllProducts from '@/components/AllProducts'
import NewArrivals from '@/components/NewArrivals'
import FeaturedProducts from '@/components/FeaturedProducts'
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
    <main className="min-h-screen bg-[#FFFFEC]">
      <Header />
      <div className="flex flex-col">
        <FadeInSection>
          <Categories />
        </FadeInSection>
        <Hero slides={heroSlides} />
      </div>
      <FadeInSection>
        <NewArrivals />
      </FadeInSection>
      <FadeInSection>
        <Promotions />
      </FadeInSection>
      <FadeInSection>
        <OffersRail />
      </FadeInSection>
      <FadeInSection>
        <AllProducts />
      </FadeInSection>
      <FadeInSection>
        <FeaturedProducts />
      </FadeInSection>
      <Footer />
    </main>
  )
}
