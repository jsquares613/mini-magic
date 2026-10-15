import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { canWrite, getCurrentProfile } from '@/lib/supabase/auth'
import { productListHref } from '@/lib/admin/productFilters'
import { categoryProductCounts } from '@/lib/admin/counts'
import CategoryBrowser, { type CategoryItem } from '@/components/admin/CategoryBrowser'
import { Badge, Page, PageHeader, buttonClass } from '@/components/admin/ui'
import { ArrowRightIcon, ExternalLinkIcon, PlusIcon, ShapesIcon } from '@/components/admin/icons'

export default async function AdminCategoriesPage() {
  const supabase = createServerSupabase()
  // Run once, shared by the page and the counts fallback (awaiting a query builder twice would re-run it).
  const categoriesQuery = Promise.resolve(
    supabase
      .from('categories')
      .select('id, name, slug, emoji, image, banner_image, featured, display_order')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true }),
  )

  const [{ data: categories, error }, counts, { data: subcategories }, { data: promotions }, { count: uncategorised }, profile] =
    await Promise.all([
      categoriesQuery,
      // One grouped query for every category's product counts.
      categoryProductCounts(
        supabase,
        categoriesQuery.then((r) => (r.data ?? []).map((c) => c.id)),
      ),
      supabase.from('subcategories').select('category_id'),
      supabase.from('category_promotions').select('category_id, active'),
      supabase.from('products').select('id', { count: 'exact', head: true }).is('category_id', null),
      getCurrentProfile(),
    ])
  if (error) throw new Error(`Could not load categories: ${error.message}`)
  const tally = (rows: { category_id: string }[] | null) => {
    const m = new Map<string, number>()
    for (const r of rows ?? []) m.set(r.category_id, (m.get(r.category_id) ?? 0) + 1)
    return m
  }
  const subCounts = tally(subcategories)
  const promoCounts = tally((promotions ?? []).filter((p) => p.active))

  const items: CategoryItem[] = (categories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    emoji: c.emoji,
    image: c.image,
    hasBanner: Boolean(c.banner_image),
    featured: c.featured,
    products: counts.get(c.id)?.total ?? 0,
    live: counts.get(c.id)?.live ?? 0,
    subcategories: subCounts.get(c.id) ?? 0,
    promotions: promoCounts.get(c.id) ?? 0,
  }))

  return (
    <Page>
      <PageHeader
        title="Categories"
        description="Group products for the storefront menus, filters and category pages. Featured categories appear on the homepage."
        meta={<Badge tone="gray">{items.length.toLocaleString('en-IN')} total</Badge>}
        actions={
          <>
            <a href="/categories" target="_blank" rel="noreferrer" className={buttonClass('secondary')}>
              <ExternalLinkIcon className="h-4 w-4" />
              View on website
            </a>
            <Link href="/admin/categories/new" className={buttonClass()}>
              <PlusIcon className="h-4 w-4" />
              New category
            </Link>
          </>
        }
      />

      {(uncategorised ?? 0) > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <ShapesIcon className="h-4 w-4" />
          </span>
          <p className="min-w-0 flex-1 text-sm text-amber-900">
            <span className="font-semibold">{(uncategorised ?? 0).toLocaleString('en-IN')} products</span> don&apos;t have a category yet — they
            can&apos;t be published until they do.
          </p>
          <Link href={productListHref({ issue: 'no-category' })} className={buttonClass('secondary', 'sm')}>
            Assign categories
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <CategoryBrowser categories={items} canWrite={!!profile && canWrite(profile.role)} />
    </Page>
  )
}
