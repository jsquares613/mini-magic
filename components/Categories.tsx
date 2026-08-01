import Link from 'next/link'
import { getAllCategories } from '@/lib/categories'
import SafeImage from '@/components/SafeImage'
import SectionHeader from '@/components/SectionHeader'

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

        <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 md:-mx-8 md:px-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group flex w-16 shrink-0 flex-col items-center gap-1 md:w-20"
            >
              <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-black/5 transition group-hover:-translate-y-0.5 group-hover:shadow-md">
                {category.image ? (
                  <div className="relative h-full w-full">
                    <SafeImage
                      src={category.image}
                      alt={category.name}
                      sizes="(max-width: 768px) 56px, 72px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <span className="text-xl md:text-2xl">{category.emoji}</span>
                )}
              </div>
              <p className="line-clamp-1 text-center text-[10px] font-medium leading-tight text-blue-900 md:text-xs">
                {category.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
