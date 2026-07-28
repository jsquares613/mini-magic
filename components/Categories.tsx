import Link from 'next/link'
import { getAllCategories } from '@/lib/categories'
import SafeImage from '@/components/SafeImage'
import SectionHeader from '@/components/SectionHeader'

/**
 * Homepage categories rail. Now driven by the category catalogue and links to
 * real `/categories/<slug>` pages (previously linked to non-existent routes
 * like `/categories/house%20hold`). Shows every category (same set as the
 * `/categories` page), scrolling horizontally instead of truncating.
 */
export default async function Categories() {
  const categories = await getAllCategories()

  return (
    <section className="px-4 py-2 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          title="Categories"
          accent="from-amber-400 to-yellow-500"
          viewAllHref="/categories"
          hideTitleOnMobile
        />

        {/* Mobile: horizontally scrollable row so any number of categories fit without squeezing */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide md:hidden -mx-4 px-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group flex w-16 shrink-0 flex-col items-center gap-1"
            >
              <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-black/5 transition group-hover:-translate-y-0.5 group-hover:shadow-md">
                {category.image ? (
                  <div className="relative h-full w-full">
                    <SafeImage src={category.image} alt={category.name} sizes="56px" className="object-cover" />
                  </div>
                ) : (
                  <span className="text-xl">{category.emoji}</span>
                )}
              </div>
              <p className="line-clamp-1 text-center text-[10px] font-medium leading-tight text-blue-900">
                {category.name}
              </p>
            </Link>
          ))}
        </div>

        {/* Desktop: horizontally scrollable row of square tiles so any number of categories fit */}
        <div className="hidden gap-6 overflow-x-auto scrollbar-hide md:flex">
          {categories.map((category) => (
            <Link key={category.id} href={`/categories/${category.slug}`} className="group w-48 shrink-0">
              <div className="cursor-pointer overflow-hidden rounded-2xl bg-lightYellow shadow-sm ring-1 ring-amber-400/60 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-amber-500">
                {category.image ? (
                  <>
                    <div className="relative aspect-square overflow-hidden">
                      <SafeImage
                        src={category.image}
                        alt={category.name}
                        sizes="192px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="border-t border-amber-400/60 bg-amber-400 px-2 py-3 text-center">
                      <p className="text-base font-bold text-blue-900">{category.name}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`${category.color} flex aspect-square flex-col items-center justify-center p-8`}>
                      <div className="text-5xl transition-transform duration-300 group-hover:scale-110">{category.emoji}</div>
                    </div>
                    <div className="border-t border-amber-400/60 bg-amber-400 px-2 py-3 text-center">
                      <p className="text-base font-bold text-blue-900">{category.name}</p>
                    </div>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
