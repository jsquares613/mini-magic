import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Hero from '@/components/Hero'
import SafeImage from '@/components/SafeImage'
import { getAllCategories } from '@/lib/categories'
import { getHomeHeroSlides } from '@/lib/homepage'

// ISR — see app/page.tsx for why this is needed (no dynamic function on this
// page means Next.js would otherwise cache the rendered HTML indefinitely).
export const revalidate = 60

export default async function CategoriesPage() {
  const [categories, heroSlides] = await Promise.all([getAllCategories(), getHomeHeroSlides()])

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#FFFFEC] pb-6 md:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-4 md:py-12">
          <nav className="mb-3 hidden text-sm text-gray-500 md:block">
            <Link href="/" className="hover:text-blue-900">Home</Link>{' '}
            <span className="mx-2">›</span> <span className="font-semibold">Categories</span>
          </nav>

          <h1 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900 md:mb-8 md:text-4xl">
            Categories
            <span aria-hidden="true"></span>
          </h1>

          <div className="grid grid-cols-5 gap-x-2 gap-y-4 sm:grid-cols-6 md:grid-cols-8 md:gap-x-6 md:gap-y-8 lg:grid-cols-10">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group flex flex-col items-center gap-1.5"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md">
                  {category.image ? (
                    <SafeImage
                      src={category.image}
                      alt={category.name}
                      sizes="(max-width: 768px) 18vw, 10vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center ${category.color}`}>
                      <span className="text-2xl md:text-4xl">{category.emoji}</span>
                    </div>
                  )}
                </div>
                <p className="line-clamp-2 text-center text-[10px] font-semibold leading-tight text-blue-900 md:text-sm">
                  {category.name}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <Hero slides={heroSlides} />
      </main>

      <Footer />
    </>
  )
}
