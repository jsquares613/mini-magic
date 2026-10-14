import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { canWrite, getCurrentProfile } from '@/lib/supabase/auth'
import { toSupabaseTransformUrl } from '@/lib/supabase/imageTransform'
import { formatPrice } from '@/lib/format'
import { stockStatusOf } from '@/lib/stock'
import {
  PRODUCT_SOURCES,
  PRODUCT_TABS,
  parseProductListFilters,
  productFilterConditions,
  toLogicTree,
} from '@/lib/admin/productFilters'
import ProductTable, { type ProductTableRow } from '@/components/admin/ProductTable'
import type { StockStatus } from '@/types'

const PAGE_SIZE = 50

const STOCK_BADGE: Record<StockStatus, { label: string; className: string }> = {
  'in-stock': { label: 'In stock', className: 'text-green-600' },
  'low-stock': { label: 'Low', className: 'text-orange-500' },
  'out-of-stock': { label: 'Out', className: 'text-red-500' },
  'pre-order': { label: 'Pre-order', className: 'text-blue-600' },
}

const control = 'rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'

type SearchParams = { [key: string]: string | string[] | undefined }

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseProductListFilters(searchParams)
  const page = Math.max(1, Number(searchParams.page) || 1)
  const from = (page - 1) * PAGE_SIZE

  const supabase = createServerSupabase()
  let query = supabase.from('products').select('*', { count: 'exact' })
  const tree = toLogicTree(productFilterConditions(filters))
  if (tree) query = query.or(tree)

  const [{ data: products, count }, { data: categories }, { data: subcategories }, { data: suppliers }, profile] =
    await Promise.all([
      query
        .order('is_published', { ascending: false })
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })
        .range(from, from + PAGE_SIZE - 1),
      supabase.from('categories').select('id, name').order('display_order', { ascending: true }),
      supabase.from('subcategories').select('id, name, emoji, category_id').order('display_order', { ascending: true }),
      supabase.rpc('marg_supplier_counts'),
      getCurrentProfile(),
    ])

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
    const stock = STOCK_BADGE[stockStatusOf(p)]
    const showPrice = p.price_display === 'show' && p.price != null
    const thumb = thumbs.get(p.id)
    return {
      id: p.id,
      name: p.name,
      margCode: p.marg_code,
      margName: p.marg_name && p.marg_name !== p.name ? p.marg_name : null,
      thumb: thumb ? toSupabaseTransformUrl(thumb, { width: 96 }) : null,
      category: p.category_id ? catName.get(p.category_id) ?? null : null,
      priceText: showPrice ? formatPrice(p.sale_price ?? (p.price as number)) : p.price_display,
      onSale: showPrice && p.sale_price != null,
      priceMuted: !showPrice,
      stockQty: p.marg_code ? Number(p.marg_stock ?? 0) : null,
      stockLabel: stock.label,
      stockClass: stock.className,
      popular: p.popular,
      newArrival: p.new_arrival,
      published: p.is_published,
      removed: p.marg_deleted_at ? 'Deleted in Marg' : p.marg_missing_since ? 'Missing in Marg' : null,
    }
  })

  const total = count ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const href = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams()
    const merged = { ...filters, page, ...overrides }
    for (const [k, v] of Object.entries(merged)) {
      if (v === '' || (k === 'status' && v === 'all') || (k === 'page' && v === 1)) continue
      params.set(k, String(v))
    }
    const qs = params.toString()
    return qs ? `/admin/products?${qs}` : '/admin/products'
  }
  const filtered = Boolean(filters.status !== 'all' || filters.q || filters.supplier || filters.source)

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">
            {`${total.toLocaleString('en-IN')} ${filtered ? 'matching ' : ''}products`}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          + New Product
        </Link>
      </div>

      <div className="mb-3 flex flex-wrap gap-1">
        {PRODUCT_TABS.map((t) => (
          <Link
            key={t.key}
            href={href({ status: t.key, page: 1 })}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filters.status === t.key ? 'bg-blue-900 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <form action="/admin/products" className="mb-4 flex flex-wrap items-center gap-2">
        {filters.status !== 'all' && <input type="hidden" name="status" value={filters.status} />}
        <input name="q" defaultValue={filters.q} placeholder="Search name or Marg code…" className={`w-56 ${control}`} />
        <select name="supplier" defaultValue={filters.supplier} className={`max-w-[16rem] ${control}`} aria-label="Supplier">
          <option value="">All suppliers</option>
          {(suppliers ?? []).map((s) => (
            <option key={s.supplier} value={s.supplier}>
              {s.supplier} ({s.product_count})
            </option>
          ))}
        </select>
        <select name="source" defaultValue={filters.source} className={control} aria-label="Source">
          {PRODUCT_SOURCES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200">
          Filter
        </button>
        {filtered && (
          <Link href="/admin/products" className="text-sm text-blue-600 hover:underline">
            Clear filters
          </Link>
        )}
      </form>

      <ProductTable
        rows={rows}
        total={total}
        filters={filters}
        categories={categories ?? []}
        subcategories={subcategories ?? []}
        canWrite={!!profile && canWrite(profile.role)}
        emptyMessage={
          page > 1 ? (
            <Link href={href({ page: 1 })} className="text-blue-600 hover:underline">
              No products on this page — back to page 1
            </Link>
          ) : filtered ? (
            'No products match these filters.'
          ) : (
            'No products yet. Run a Marg sync or create one.'
          )
        }
      />

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>
            {Math.min(from + 1, total)}–{Math.min(from + PAGE_SIZE, total)} of {total.toLocaleString('en-IN')}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={href({ page: page - 1 })} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50">
                ← Prev
              </Link>
            )}
            <span className="px-2 py-1.5">
              Page {page} of {pageCount}
            </span>
            {page < pageCount && (
              <Link href={href({ page: page + 1 })} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50">
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
