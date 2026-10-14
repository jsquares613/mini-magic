import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { canWrite, getCurrentProfile } from '@/lib/supabase/auth'
import { toSupabaseTransformUrl } from '@/lib/supabase/imageTransform'
import { formatPrice, timeAgo } from '@/lib/format'
import { stockStatusOf } from '@/lib/stock'
import {
  PRODUCT_TABS,
  parseProductListFilters,
  productFilterConditions,
  toLogicTree,
  type ProductTab,
} from '@/lib/admin/productFilters'
import ProductListShell from '@/components/admin/ProductListShell'
import ProductTable, { type ProductTableRow } from '@/components/admin/ProductTable'
import { Page, PageHeader, buttonClass, type Tone } from '@/components/admin/ui'
import { PlusIcon, RefreshIcon } from '@/components/admin/icons'
import type { StockStatus } from '@/types'

const PAGE_SIZE = 50

const PRICE_HIDDEN_LABEL = { hide: 'Price hidden', enquire: 'On enquiry' } as const

/** Stock pill: Marg products show the synced quantity; a staff override says so. */
function stockBadge(status: StockStatus, qty: number | null, overridden: boolean): ProductTableRow['stock'] {
  const pieces = qty?.toLocaleString('en-IN')
  const fromMarg = qty != null && !overridden
  const badge: Record<StockStatus, { label: string; tone: Tone }> = {
    'in-stock': { label: fromMarg ? `${pieces} in stock` : 'In stock', tone: 'green' },
    'low-stock': { label: fromMarg ? `Only ${pieces} left` : 'Low stock', tone: 'amber' },
    'out-of-stock': { label: 'Out of stock', tone: 'red' },
    'pre-order': { label: 'Pre-order', tone: 'blue' },
  }
  const { label, tone } = badge[status]
  return overridden
    ? { label: `${label} · manual`, tone, title: `Set manually${qty != null ? ` — Marg stock: ${pieces}` : ''}` }
    : { label, tone }
}

type SearchParams = { [key: string]: string | string[] | undefined }

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseProductListFilters(searchParams)
  const page = Math.max(1, Number(searchParams.page) || 1)
  const from = (page - 1) * PAGE_SIZE

  const supabase = createServerSupabase()
  let query = supabase.from('products').select('*', { count: 'exact' })
  const tree = toLogicTree(productFilterConditions(filters))
  if (tree) query = query.or(tree)

  /** Per-tab counts, with the search/supplier/source filters applied. */
  const countTab = async (status: ProductTab) => {
    let q = supabase.from('products').select('id', { count: 'exact', head: true })
    const t = toLogicTree(productFilterConditions({ ...filters, status }))
    if (t) q = q.or(t)
    const { count } = await q
    return [status, count ?? 0] as const
  }

  const [{ data: products, count }, counts, { data: categories }, { data: subcategories }, { data: suppliers }, { data: lastSync }, profile] =
    await Promise.all([
      query
        .order('is_published', { ascending: false })
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })
        .range(from, from + PAGE_SIZE - 1),
      Promise.all(PRODUCT_TABS.map((t) => countTab(t.key))),
      supabase.from('categories').select('id, name').order('display_order', { ascending: true }),
      supabase.from('subcategories').select('id, name, emoji, category_id').order('display_order', { ascending: true }),
      supabase.rpc('marg_supplier_counts'),
      supabase
        .from('marg_sync_runs')
        .select('started_at, finished_at')
        .eq('status', 'success')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      getCurrentProfile(),
    ])
  const tabCounts = Object.fromEntries(counts) as Record<ProductTab, number>

  // Primary image (else first) per product on this page — one query.
  const ids = (products ?? []).map((p) => p.id)
  const { data: images } = ids.length
    ? await supabase
        .from('product_images')
        .select('product_id, image_url')
        .in('product_id', ids)
        .order('is_primary', { ascending: false })
        .order('sort_order', { ascending: true })
    : { data: [] as { product_id: string; image_url: string }[] }
  const thumbs = new Map<string, string>()
  for (const img of images ?? []) if (!thumbs.has(img.product_id)) thumbs.set(img.product_id, img.image_url)

  const catName = new Map((categories ?? []).map((c) => [c.id, c.name]))
  const rows: ProductTableRow[] = (products ?? []).map((p) => {
    const thumb = thumbs.get(p.id)
    const showPrice = p.price_display === 'show' && p.price != null
    const onSale = showPrice && p.sale_price != null && p.sale_price < (p.price as number)
    const needs = [!thumb && 'photo', !p.category_id && 'category'].filter((n): n is string => Boolean(n))
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      margCode: p.marg_code,
      margName: p.marg_name && p.marg_name !== p.name ? p.marg_name : null,
      supplier: p.marg_company,
      thumb: thumb ? toSupabaseTransformUrl(thumb, { width: 96 }) : null,
      category: p.category_id ? catName.get(p.category_id) ?? null : null,
      priceText: showPrice
        ? formatPrice(onSale ? (p.sale_price as number) : (p.price as number))
        : p.price_display === 'show'
          ? '—'
          : PRICE_HIDDEN_LABEL[p.price_display],
      originalPriceText: onSale ? formatPrice(p.price as number) : null,
      priceMuted: !showPrice,
      stock: stockBadge(stockStatusOf(p), p.marg_code ? Number(p.marg_stock ?? 0) : null, p.stock_status_override != null),
      popular: p.popular,
      newArrival: p.new_arrival,
      published: p.is_published,
      ready: !p.is_published && needs.length === 0 && !p.marg_deleted_at,
      needs,
      removed: p.marg_deleted_at ? 'Deleted in Marg' : p.marg_missing_since ? 'Missing in Marg' : null,
    }
  })

  const total = count ?? 0
  const filtered = Boolean(filters.status !== 'all' || filters.q || filters.supplier || filters.source)
  const lastSyncAt = lastSync ? lastSync.finished_at ?? lastSync.started_at : null
  const firstPage = new URLSearchParams(
    Object.entries({ ...filters, status: filters.status === 'all' ? '' : filters.status }).filter(([, v]) => v),
  ).toString()

  return (
    <Page>
      <PageHeader
        title="Products"
        description="Stock and prices come from Marg. Names, photos and categories are managed here."
        actions={
          <>
            <Link href="/admin/marg" className={buttonClass('secondary')} title="Marg sync">
              <RefreshIcon className="h-4 w-4 text-slate-400" />
              {lastSyncAt ? `Synced ${timeAgo(lastSyncAt)}` : 'Not synced yet'}
            </Link>
            <Link href="/admin/products/new" className={buttonClass()}>
              <PlusIcon className="h-4 w-4" />
              New product
            </Link>
          </>
        }
      />

      <ProductListShell
        filters={filters}
        tabCounts={tabCounts}
        suppliers={suppliers ?? []}
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
      >
        <ProductTable
          rows={rows}
          total={total}
          filters={filters}
          categories={categories ?? []}
          subcategories={subcategories ?? []}
          canWrite={!!profile && canWrite(profile.role)}
          empty={
            page > 1 && total > 0
              ? {
                  title: 'Nothing on this page',
                  message: (
                    <Link href={firstPage ? `/admin/products?${firstPage}` : '/admin/products'} className="text-blue-700 hover:underline">
                      Back to the first page
                    </Link>
                  ),
                }
              : filtered
                ? { title: 'No products match', message: 'Try another tab, or clear the search and filters.' }
                : { title: 'No products yet', message: 'Run a Marg sync, or add a product by hand.' }
          }
        />
      </ProductListShell>
    </Page>
  )
}
