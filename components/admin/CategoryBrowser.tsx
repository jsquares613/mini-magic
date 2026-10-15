'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { reorderCategories, setCategoryFeatured } from '@/app/admin/(protected)/categories/actions'
import { isActionError } from '@/lib/admin/actionResult'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  GripIcon,
  ImageIcon,
  LayoutGridIcon,
  ListIcon,
  PencilIcon,
  SearchIcon,
  ShapesIcon,
  StarIcon,
  XIcon,
} from './icons'
import AdminImage from './AdminImage'
import Spinner from './Spinner'
import { Badge, Card, EmptyState, iconButtonClass, ui } from './ui'

export interface CategoryItem {
  id: string
  name: string
  slug: string
  emoji: string | null
  /** Original card image URL (resized on display by AdminImage). */
  image: string | null
  hasBanner: boolean
  featured: boolean
  products: number
  live: number
  subcategories: number
  promotions: number
}

type Filter = 'all' | 'featured' | 'no-image' | 'empty'
type Layout = 'grid' | 'list'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'featured', label: 'Featured' },
  { key: 'no-image', label: 'No image' },
  { key: 'empty', label: 'Empty' },
]

const LAYOUT_KEY = 'admin.categories.layout'
const fmt = (n: number) => n.toLocaleString('en-IN')

const matches = (c: CategoryItem, f: Filter) =>
  f === 'all' || (f === 'featured' && c.featured) || (f === 'no-image' && !c.image) || (f === 'empty' && c.products === 0)

/**
 * Categories admin list: search, quick filters, grid or list layout,
 * one-click "featured" toggle and drag-to-reorder (list view). Changes are
 * applied optimistically and rolled back if saving fails.
 */
export default function CategoryBrowser({ categories, canWrite }: { categories: CategoryItem[]; canWrite: boolean }) {
  const router = useRouter()
  const [items, setItems] = useState(categories)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [layout, setLayout] = useState<Layout>('grid')
  const [toggling, setToggling] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  // Fresh server data (after a save/refresh) replaces the local copy.
  useEffect(() => setItems(categories), [categories])

  // Remember the chosen layout in this browser.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LAYOUT_KEY)
      if (saved === 'grid' || saved === 'list') setLayout(saved)
    } catch {
      /* storage unavailable — keep the default */
    }
  }, [])

  function chooseLayout(next: Layout) {
    setLayout(next)
    try {
      window.localStorage.setItem(LAYOUT_KEY, next)
    } catch {
      /* ignore */
    }
  }

  const q = query.trim().toLowerCase()
  const visible = items.filter((c) => matches(c, filter) && (!q || c.name.toLowerCase().includes(q) || c.slug.includes(q)))
  const canReorder = canWrite && filter === 'all' && !q && !saving

  async function toggleFeatured(c: CategoryItem) {
    if (!canWrite || toggling) return
    const next = !c.featured
    setToggling(c.id)
    setItems((list) => list.map((x) => (x.id === c.id ? { ...x, featured: next } : x)))
    try {
      const res = await setCategoryFeatured(c.id, next)
      if (isActionError(res)) throw new Error(res.error)
      toast.success(next ? `${c.name} is now featured on the homepage` : `${c.name} removed from the homepage`)
      router.refresh()
    } catch (err) {
      setItems((list) => list.map((x) => (x.id === c.id ? { ...x, featured: !next } : x)))
      toast.error(err instanceof Error ? err.message : 'Could not update the category')
    } finally {
      setToggling(null)
    }
  }

  async function saveOrder(next: CategoryItem[], previous: CategoryItem[]) {
    setSaving(true)
    try {
      const res = await reorderCategories(next.map((c) => c.id))
      if (isActionError(res)) throw new Error(res.error)
      toast.success('Order saved')
      router.refresh()
    } catch (err) {
      setItems(previous)
      toast.error(err instanceof Error ? err.message : 'Could not save the order')
    } finally {
      setSaving(false)
    }
  }

  function move(id: string, delta: -1 | 1) {
    const from = items.findIndex((c) => c.id === id)
    const to = from + delta
    if (from < 0 || to < 0 || to >= items.length) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    const previous = items
    setItems(next)
    void saveOrder(next, previous)
  }

  /* Drag & drop (list view): the grip is draggable, rows are drop targets.
     Rows stay put while dragging (a line marks the drop spot) and the new
     order is applied on drop — moving DOM nodes mid-drag can cancel it. */
  function onDragStart(e: React.DragEvent, id: string) {
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
    const row = (e.currentTarget as HTMLElement).closest('tr')
    if (row) e.dataTransfer.setDragImage(row, 24, 24)
  }

  function onDragOver(e: React.DragEvent, id: string) {
    if (!dragId) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (overId !== id) setOverId(id)
  }

  function onDrop(e: React.DragEvent, id: string) {
    e.preventDefault()
    const from = items.findIndex((c) => c.id === dragId)
    const to = items.findIndex((c) => c.id === id)
    setDragId(null)
    setOverId(null)
    if (from < 0 || to < 0 || from === to) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    const previous = items
    setItems(next)
    void saveOrder(next, previous)
  }

  function onDragEnd() {
    setDragId(null)
    setOverId(null)
  }

  const dragFrom = dragId ? items.findIndex((c) => c.id === dragId) : -1

  return (
    <>
      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories"
            aria-label="Search categories"
            className={`${ui.control} w-full pl-9 pr-9`}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Clear search"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const on = filter === f.key
            const n = items.filter((c) => matches(c, f.key)).length
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={on}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition ${
                  on
                    ? 'border-blue-900 bg-blue-900 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 shadow-sm hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {f.label}
                <span className={`text-xs tabular-nums ${on ? 'text-white/80' : 'text-slate-400'}`}>{fmt(n)}</span>
              </button>
            )
          })}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {saving && (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Spinner className="h-3.5 w-3.5" />
              Saving order…
            </span>
          )}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 ring-1 ring-inset ring-slate-200/70" role="group" aria-label="Layout">
            {(
              [
                { key: 'grid', icon: LayoutGridIcon, label: 'Grid' },
                { key: 'list', icon: ListIcon, label: 'List' },
              ] as const
            ).map(({ key, icon: LayoutIcon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => chooseLayout(key)}
                aria-pressed={layout === key}
                title={`${label} view`}
                className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition ${
                  layout === key ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutIcon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={ShapesIcon}
            title={items.length === 0 ? 'No categories yet' : 'No categories match'}
            description={items.length === 0 ? 'Create your first category to start organising products.' : 'Try another search or filter.'}
          />
        </Card>
      ) : layout === 'grid' ? (
        /* ------------------------------ Grid ------------------------------ */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {visible.map((c) => (
            <div
              key={c.id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <Link prefetch={false} href={`/admin/categories/${c.id}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
                  {c.image ? (
                    <AdminImage src={c.image} width={360} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                  ) : (
                    <span className="flex h-full flex-col items-center justify-center gap-2">
                      <span className="text-4xl">{c.emoji || '🗂️'}</span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                        <ImageIcon className="h-3.5 w-3.5" />
                        No image yet
                      </span>
                    </span>
                  )}
                  {c.featured && (
                    <span className="absolute left-3 top-3">
                      <Badge tone="amber" icon={StarIcon}>
                        Featured
                      </Badge>
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{c.name}</p>
                      <p className="truncate text-xs text-slate-500">/{c.slug}</p>
                    </div>
                    {c.products === 0 && <Badge tone="gray">Empty</Badge>}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span>
                      <span className="font-semibold tabular-nums text-slate-800">{fmt(c.products)}</span> products
                    </span>
                    {c.products > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="tabular-nums">{fmt(c.live)}</span> live
                      </span>
                    )}
                    {c.subcategories > 0 && <span>{fmt(c.subcategories)} subcategories</span>}
                    {c.promotions > 0 && (
                      <span className="text-rose-600">
                        {fmt(c.promotions)} promotion{c.promotions === 1 ? '' : 's'}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              {/* Quick actions */}
              <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => toggleFeatured(c)}
                    disabled={toggling === c.id}
                    className={iconButtonClass('default', 'bg-white/90 shadow-sm backdrop-blur hover:bg-white')}
                    title={c.featured ? 'Remove from homepage' : 'Feature on homepage'}
                    aria-label={c.featured ? `Unfeature ${c.name}` : `Feature ${c.name}`}
                  >
                    {toggling === c.id ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <StarIcon className={`h-4 w-4 ${c.featured ? 'text-amber-500' : ''}`} fill={c.featured ? 'currentColor' : 'none'} />
                    )}
                  </button>
                )}
                <a
                  href={`/categories/${c.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className={iconButtonClass('default', 'bg-white/90 shadow-sm backdrop-blur hover:bg-white')}
                  title="View on website"
                  aria-label={`View ${c.name} on the website`}
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ------------------------------ List ------------------------------ */
        <Card bodyClassName="p-0">
          <div className="admin-scroll overflow-x-auto">
            <table className="w-full text-sm" onDrop={(e) => e.preventDefault()}>
              <thead className={ui.thead}>
                <tr>
                  {canWrite && (
                    <th className={`${ui.th} w-24`}>
                      <span className="sr-only">Order</span>
                    </th>
                  )}
                  <th className={ui.th}>Category</th>
                  <th className={`${ui.th} text-right`}>Products</th>
                  <th className={`${ui.th} text-right`}>Subcategories</th>
                  <th className={ui.th}>Media</th>
                  <th className={ui.th}>Featured</th>
                  <th className={ui.th}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((c, i) => (
                  <tr
                    key={c.id}
                    onDragOver={(e) => onDragOver(e, c.id)}
                    onDrop={(e) => onDrop(e, c.id)}
                    className={`transition ${
                      dragId === c.id
                        ? 'bg-blue-50/70 opacity-60'
                        : overId === c.id && dragId
                          ? i > dragFrom
                            ? 'bg-blue-50/40 shadow-[inset_0_-2px_0_0_#1e3a8a]'
                            : 'bg-blue-50/40 shadow-[inset_0_2px_0_0_#1e3a8a]'
                          : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {canWrite && (
                      <td className="py-3 pl-4 pr-2">
                        <div className="flex items-center gap-0.5">
                          <span
                            draggable={canReorder}
                            onDragStart={(e) => onDragStart(e, c.id)}
                            onDragEnd={onDragEnd}
                            className={`flex h-8 w-6 items-center justify-center rounded text-slate-300 ${
                              canReorder ? 'cursor-grab hover:text-slate-500 active:cursor-grabbing' : 'cursor-not-allowed'
                            }`}
                            title={canReorder ? 'Drag to reorder' : 'Clear search and filters to reorder'}
                            aria-hidden="true"
                          >
                            <GripIcon className="h-4 w-4" />
                          </span>
                          <button
                            type="button"
                            onClick={() => move(c.id, -1)}
                            disabled={!canReorder || i === 0}
                            className={iconButtonClass('default', 'h-7 w-7 disabled:opacity-30')}
                            aria-label={`Move ${c.name} up`}
                          >
                            <ChevronUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => move(c.id, 1)}
                            disabled={!canReorder || i === visible.length - 1}
                            className={iconButtonClass('default', 'h-7 w-7 disabled:opacity-30')}
                            aria-label={`Move ${c.name} down`}
                          >
                            <ChevronDownIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                    <td className={ui.td}>
                      <div className="flex items-center gap-3">
                        {c.image ? (
                          <AdminImage src={c.image} width={40} className="h-10 w-10 shrink-0 rounded-lg border border-slate-100 object-cover" />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg">{c.emoji || '🗂️'}</span>
                        )}
                        <div className="min-w-0">
                          <Link prefetch={false} href={`/admin/categories/${c.id}`} className="font-medium text-slate-900 hover:text-blue-700 hover:underline">
                            {c.name}
                          </Link>
                          <p className="truncate text-xs text-slate-500">/{c.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`${ui.td} text-right`}>
                      <span className="font-semibold tabular-nums text-slate-900">{fmt(c.products)}</span>
                      <span className="block text-xs text-slate-500">{c.products > 0 ? `${fmt(c.live)} live` : 'Empty'}</span>
                    </td>
                    <td className={`${ui.td} text-right tabular-nums text-slate-600`}>{c.subcategories > 0 ? fmt(c.subcategories) : '—'}</td>
                    <td className={ui.td}>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone={c.image ? 'green' : 'gray'} dot>
                          Image
                        </Badge>
                        <Badge tone={c.hasBanner ? 'green' : 'gray'} dot>
                          Banner
                        </Badge>
                      </div>
                    </td>
                    <td className={ui.td}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={c.featured}
                        aria-label={`Feature ${c.name} on the homepage`}
                        onClick={() => toggleFeatured(c)}
                        disabled={!canWrite || toggling === c.id}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 ${
                          c.featured ? 'bg-blue-900' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 transition ${
                            c.featured ? 'translate-x-5' : ''
                          }`}
                        />
                      </button>
                    </td>
                    <td className={ui.td}>
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/categories/${c.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className={iconButtonClass()}
                          title="View on website"
                          aria-label={`View ${c.name} on the website`}
                        >
                          <ExternalLinkIcon className="h-4 w-4" />
                        </a>
                        <Link
                          prefetch={false}
                          href={`/admin/categories/${c.id}`}
                          className={iconButtonClass('default', 'hover:bg-blue-50 hover:text-blue-700')}
                          title="Edit"
                          aria-label={`Edit ${c.name}`}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {canWrite && (
            <p className="border-t border-slate-100 bg-slate-50/60 px-6 py-3 text-xs text-slate-500">
              {canReorder
                ? 'Drag the handle or use the arrows to change the order categories appear in on the website.'
                : 'Clear the search and filters to reorder categories.'}
            </p>
          )}
        </Card>
      )}
    </>
  )
}
