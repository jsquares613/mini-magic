'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { bulkUpdateProducts, type BulkOperation } from '@/app/admin/(protected)/products/actions'
import { isActionError } from '@/lib/admin/actionResult'
import type { ProductListFilters } from '@/lib/admin/productFilters'
import type { Tables } from '@/lib/supabase/database.types'
import { AlertTriangleIcon, ExternalLinkIcon, ImageIcon, PencilIcon, SearchIcon, SparklesIcon, StarIcon } from './icons'
import Spinner from './Spinner'
import { Badge, EmptyState, buttonClass, iconButtonClass, ui, type Tone } from './ui'

/** Display-ready product row, computed by the (server) products page. */
export interface ProductTableRow {
  id: string
  slug: string
  name: string
  margCode: string | null
  /** Marg's billing name, only when it differs from the website name. */
  margName: string | null
  supplier: string | null
  thumb: string | null
  category: string | null
  priceText: string
  /** Regular price, shown struck through when a sale price applies. */
  originalPriceText: string | null
  priceMuted: boolean
  stock: { label: string; tone: Tone; title?: string }
  popular: boolean
  newArrival: boolean
  published: boolean
  /** Draft that meets every publishing requirement. */
  ready: boolean
  /** What's missing, e.g. ['photo', 'category']. */
  needs: string[]
  /** "Deleted in Marg" / "Missing in Marg", when applicable. */
  removed: string | null
}

type Category = Pick<Tables<'categories'>, 'id' | 'name'>
type Subcategory = Pick<Tables<'subcategories'>, 'id' | 'name' | 'emoji' | 'category_id'>

const control = ui.control
const checkbox = ui.checkbox

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
  empty,
}: {
  rows: ProductTableRow[]
  total: number
  filters: ProductListFilters
  categories: Category[]
  subcategories: Subcategory[]
  canWrite: boolean
  empty: { title: string; message: React.ReactNode }
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
  const columns = canWrite ? 7 : 6

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
      <div className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${selectionCount > 0 ? 'mb-28' : ''}`}>
        <div className="admin-scroll overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={`${ui.thead} text-left text-xs font-medium uppercase tracking-wide text-slate-500`}>
              <tr>
                {canWrite && (
                  <th className="w-12 py-3 pl-5 pr-2">
                    <input
                      type="checkbox"
                      aria-label="Select all on this page"
                      className={checkbox}
                      checked={allOnPage}
                      ref={(el) => {
                        if (el) el.indeterminate = someOnPage && !allOnPage
                      }}
                      onChange={toggleAllOnPage}
                    />
                  </th>
                )}
                <th className={`py-3 pr-4 font-medium ${canWrite ? 'pl-2' : 'pl-5'}`}>Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((p) => {
                const isSelected = allMatching || selected.has(p.id)
                return (
                  <tr key={p.id} className={`group transition-colors ${isSelected ? 'bg-blue-50/60' : 'hover:bg-slate-50/80'}`}>
                    {canWrite && (
                      <td className="py-3 pl-5 pr-2">
                        <input
                          type="checkbox"
                          aria-label={`Select ${p.name}`}
                          className={checkbox}
                          checked={isSelected}
                          onChange={() => toggle(p.id)}
                        />
                      </td>
                    )}

                    {/* Product: photo, name, flags, Marg details */}
                    <td className={`py-3 pr-4 ${canWrite ? 'pl-2' : 'pl-5'}`}>
                      <div className="flex items-center gap-3">
                        {p.thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.thumb}
                            alt=""
                            loading="lazy"
                            className="h-11 w-11 shrink-0 rounded-lg border border-slate-100 bg-slate-50 object-cover"
                          />
                        ) : (
                          <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-300"
                            title="No photo"
                          >
                            <ImageIcon className="h-5 w-5" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <Link href={`/admin/products/${p.id}`} className="font-medium text-slate-900 hover:text-blue-700 hover:underline">
                              {p.name}
                            </Link>
                            {p.popular && (
                              <Badge tone="amber" icon={StarIcon}>
                                Popular
                              </Badge>
                            )}
                            {p.newArrival && (
                              <Badge tone="blue" icon={SparklesIcon}>
                                New
                              </Badge>
                            )}
                          </div>
                          {(p.margCode || p.supplier) && (
                            <p className="mt-0.5 truncate text-xs text-slate-400">
                              {p.margCode && <span className="font-mono">#{p.margCode}</span>}
                              {p.margCode && p.supplier && ' · '}
                              {p.supplier}
                            </p>
                          )}
                          {p.margName && <p className="truncate text-xs text-slate-400">Marg name: {p.margName}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-600">{p.category ?? <span className="text-slate-300">—</span>}</td>

                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={
                          p.priceMuted ? 'text-slate-400' : p.originalPriceText ? 'font-semibold text-emerald-700' : 'font-medium text-slate-800'
                        }
                      >
                        {p.priceText}
                      </span>
                      {p.originalPriceText && <span className="ml-1.5 text-xs text-slate-400 line-through">{p.originalPriceText}</span>}
                    </td>

                    <td className="px-4 py-3">
                      <Badge tone={p.stock.tone} title={p.stock.title} dot>
                        {p.stock.label}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      {p.published ? (
                        <Badge dot tone="green">Published</Badge>
                      ) : p.ready ? (
                        <Badge dot tone="teal">Ready to publish</Badge>
                      ) : (
                        <Badge dot tone="gray">Draft</Badge>
                      )}
                      {p.needs.length > 0 && (
                        <p className="mt-1 whitespace-nowrap text-xs text-amber-600">
                          {p.published ? 'No ' : 'Needs '}
                          {p.needs.join(' · ')}
                        </p>
                      )}
                      {p.removed && (
                        <p className="mt-1 inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-rose-600">
                          <AlertTriangleIcon className="h-3.5 w-3.5" />
                          {p.removed}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {p.published && (
                          <a
                            href={`/products/${p.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            title="View on website"
                            className={iconButtonClass()}
                          >
                            <ExternalLinkIcon className="h-4 w-4" />
                            <span className="sr-only">View {p.name} on the website</span>
                          </a>
                        )}
                        <Link
                          href={`/admin/products/${p.id}`}
                          title="Edit"
                          className={iconButtonClass('default', 'hover:bg-blue-50 hover:text-blue-700')}
                        >
                          <PencilIcon className="h-4 w-4" />
                          <span className="sr-only">Edit {p.name}</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns} className="py-6">
                    <EmptyState icon={SearchIcon} title={empty.title} description={empty.message} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {canWrite && selectionCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:left-60 md:px-8">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 font-semibold text-slate-900">
              <span className="rounded-md bg-blue-900 px-2 py-0.5 text-xs font-bold tabular-nums text-white">
                {selectionCount.toLocaleString('en-IN')}
              </span>
              {allMatching ? 'products in this view' : 'selected'}
            </span>
            {allOnPage && !allMatching && total > rows.length && (
              <button type="button" onClick={() => setAllMatching(true)} className="font-medium text-blue-700 hover:underline">
                Select all {total.toLocaleString('en-IN')} matching
              </button>
            )}

            <span className="hidden h-6 w-px bg-slate-200 sm:block" aria-hidden="true" />

            <select value={op} onChange={(e) => setOp(e.target.value as BulkOperation | '')} className={control} aria-label="Bulk action">
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
              <span className="text-xs text-slate-500">Only products with a category and at least one photo are published.</span>
            )}

            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={clearSelection}
                disabled={pending}
                className={buttonClass('secondary')}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={apply}
                disabled={pending || !op}
                className={buttonClass()}
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
