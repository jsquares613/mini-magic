'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { bulkUpdateProducts, type BulkOperation } from '@/app/admin/(protected)/products/actions'
import { isActionError } from '@/lib/admin/actionResult'
import type { ProductListFilters } from '@/lib/admin/productFilters'
import type { Tables } from '@/lib/supabase/database.types'
import Spinner from './Spinner'

/** Display-ready product row, computed by the (server) products page. */
export interface ProductTableRow {
  id: string
  name: string
  margCode: string | null
  /** Marg's billing name, only when it differs from the website name. */
  margName: string | null
  thumb: string | null
  category: string | null
  priceText: string
  onSale: boolean
  priceMuted: boolean
  /** Marg stock quantity; null for hand-made products. */
  stockQty: number | null
  stockLabel: string
  stockClass: string
  popular: boolean
  newArrival: boolean
  published: boolean
  /** "Deleted in Marg" / "Missing in Marg", when applicable. */
  removed: string | null
}

type Category = Pick<Tables<'categories'>, 'id' | 'name'>
type Subcategory = Pick<Tables<'subcategories'>, 'id' | 'name' | 'emoji' | 'category_id'>

const control = 'rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'

/**
 * Products table with row selection and bulk actions (set category, publish,
 * unpublish). Bulk actions apply to the ticked rows, or — after "Select all
 * N matching" — to every product matching the current filters, which the
 * server re-evaluates from `filters`.
 */
export default function ProductTable({
  rows,
  total,
  filters,
  categories,
  subcategories,
  canWrite,
  emptyMessage,
}: {
  rows: ProductTableRow[]
  total: number
  filters: ProductListFilters
  categories: Category[]
  subcategories: Subcategory[]
  canWrite: boolean
  emptyMessage: React.ReactNode
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [allMatching, setAllMatching] = useState(false)
  const [op, setOp] = useState<BulkOperation | ''>('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [pending, setPending] = useState(false)

  // New rows (another page, other filters, or a refresh after a bulk action) start a fresh selection.
  useEffect(() => {
    setSelected(new Set())
    setAllMatching(false)
  }, [rows])

  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const someOnPage = rows.some((r) => selected.has(r.id))
  const selectionCount = allMatching ? total : selected.size
  const subsForCategory = subcategories.filter((s) => s.category_id === categoryId)

  function toggle(id: string) {
    setAllMatching(false)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllOnPage() {
    setAllMatching(false)
    setSelected(allOnPage ? new Set() : new Set(rows.map((r) => r.id)))
  }

  function clearSelection() {
    setSelected(new Set())
    setAllMatching(false)
  }

  async function apply() {
    if (!op) return void toast.error('Choose an action first.')
    if (op === 'set-category' && !categoryId) return void toast.error('Choose a category.')
    if (allMatching && !window.confirm(`Apply this to all ${total.toLocaleString('en-IN')} products in this view?`)) return

    setPending(true)
    try {
      const result = await bulkUpdateProducts({
        op,
        ...(allMatching ? { filters } : { ids: Array.from(selected) }),
        categoryId: op === 'set-category' ? categoryId : null,
        subcategoryId: op === 'set-category' && subcategoryId ? subcategoryId : null,
      })
      if (isActionError(result)) return void toast.error(result.error)
      if (result.skipped > 0) toast.warning(result.message)
      else toast.success(result.message)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk update failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <div className={`overflow-hidden rounded-2xl border border-gray-200 bg-white ${selectionCount > 0 ? 'mb-28' : ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
              <tr>
                {canWrite && (
                  <th className="w-10 py-3 pl-6">
                    <input
                      type="checkbox"
                      aria-label="Select all on this page"
                      checked={allOnPage}
                      ref={(el) => {
                        if (el) el.indeterminate = someOnPage && !allOnPage
                      }}
                      onChange={toggleAllOnPage}
                    />
                  </th>
                )}
                <th className="w-14 px-3 py-3 font-medium">Photo</th>
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Price</th>
                <th className="px-6 py-3 font-medium">Stock</th>
                <th className="px-6 py-3 font-medium">Flags</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className={`border-t border-gray-50 ${selected.has(p.id) || allMatching ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}>
                  {canWrite && (
                    <td className="py-3 pl-6">
                      <input
                        type="checkbox"
                        aria-label={`Select ${p.name}`}
                        checked={allMatching || selected.has(p.id)}
                        onChange={() => toggle(p.id)}
                      />
                    </td>
                  )}
                  <td className="px-3 py-2">
                    {p.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.thumb} alt="" loading="lazy" className="h-10 w-10 rounded-md border border-gray-100 object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-gray-300 text-[10px] text-gray-400">
                        No photo
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-medium text-gray-900">{p.name}</span>
                    {p.margCode && (
                      <span className="block text-xs text-gray-400">
                        Marg {p.margCode}
                        {p.margName ? ` · ${p.margName}` : ''}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-500">{p.category ?? '—'}</td>
                  <td className="px-6 py-3">
                    <span className={p.priceMuted ? 'text-gray-400' : p.onSale ? 'font-semibold text-green-600' : 'text-gray-700'}>
                      {p.priceText}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    {p.stockQty != null && <span className="mr-1 text-gray-700">{p.stockQty}</span>}
                    <span className={`text-xs font-medium ${p.stockClass}`}>{p.stockLabel}</span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1">
                      {p.popular && <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700">Popular</span>}
                      {p.newArrival && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">New</span>}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {p.published ? 'Published' : 'Draft'}
                    </span>
                    {p.removed && (
                      <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">{p.removed}</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Link href={`/admin/products/${p.id}`} className="font-medium text-blue-600 hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={canWrite ? 9 : 8} className="px-6 py-12 text-center text-gray-400">
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {canWrite && selectionCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-blue-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur md:left-60">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold text-blue-900">
              {allMatching ? `All ${total.toLocaleString('en-IN')} in this view` : `${selectionCount} selected`}
            </span>
            {allOnPage && !allMatching && total > rows.length && (
              <button type="button" onClick={() => setAllMatching(true)} className="font-medium text-blue-600 hover:underline">
                Select all {total.toLocaleString('en-IN')} matching
              </button>
            )}

            <select
              value={op}
              onChange={(e) => setOp(e.target.value as BulkOperation | '')}
              className={control}
              aria-label="Bulk action"
            >
              <option value="">Choose action…</option>
              <option value="set-category">Set category</option>
              <option value="publish">Publish</option>
              <option value="unpublish">Unpublish</option>
            </select>

            {op === 'set-category' && (
              <>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value)
                    setSubcategoryId('')
                  }}
                  className={control}
                  aria-label="Category"
                >
                  <option value="">Category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {subsForCategory.length > 0 && (
                  <select value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)} className={control} aria-label="Subcategory">
                    <option value="">No subcategory</option>
                    {subsForCategory.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.emoji ? `${s.emoji} ` : ''}
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}
            {op === 'publish' && (
              <span className="text-xs text-gray-500">Only products with a category and at least one photo are published.</span>
            )}

            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={clearSelection}
                disabled={pending}
                className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={apply}
                disabled={pending || !op}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-1.5 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending && <Spinner />}
                {pending ? 'Applying…' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
