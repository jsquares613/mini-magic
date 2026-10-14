import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { Badge, Card, EmptyState, Page, PageHeader, buttonClass } from '@/components/admin/ui'
import { PlusIcon, ShapesIcon, StarIcon } from '@/components/admin/icons'

export default async function AdminCategoriesPage() {
  const supabase = createServerSupabase()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, emoji, image, featured, display_order')
    .order('display_order', { ascending: true })

  // One head-count per category (a single row select would stop at 1,000 rows).
  const counts = new Map(
    await Promise.all(
      (categories ?? []).map(async (c) => {
        const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('category_id', c.id)
        return [c.id, count ?? 0] as const
      }),
    ),
  )

  return (
    <Page>
      <PageHeader
        title="Categories"
        description="Group products for the storefront menus, filters and category pages."
        meta={<Badge tone="gray">{(categories?.length ?? 0).toLocaleString('en-IN')} total</Badge>}
        actions={
          <Link href="/admin/categories/new" className={buttonClass()}>
            <PlusIcon className="h-4 w-4" />
            New category
          </Link>
        }
      />

      {categories && categories.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/admin/categories/${c.id}`}
              className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                ) : (
                  <span className="flex h-full items-center justify-center text-5xl">{c.emoji || '🗂️'}</span>
                )}
                {c.featured && (
                  <span className="absolute left-3 top-3">
                    <Badge tone="amber" icon={StarIcon}>
                      Featured
                    </Badge>
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{c.name}</p>
                  <p className="truncate text-xs text-slate-500">/{c.slug}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-semibold tabular-nums text-slate-900">{(counts.get(c.id) ?? 0).toLocaleString('en-IN')}</p>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">products</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={ShapesIcon}
            title="No categories yet"
            description="Create your first category to start organising products."
            action={
              <Link href="/admin/categories/new" className={buttonClass('primary', 'sm')}>
                <PlusIcon className="h-3.5 w-3.5" />
                New category
              </Link>
            }
          />
        </Card>
      )}
    </Page>
  )
}
