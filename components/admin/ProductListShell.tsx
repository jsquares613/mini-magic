'use client'

import { Fragment, useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { PRODUCT_SOURCES, PRODUCT_TABS, type ProductListFilters, type ProductTab } from '@/lib/admin/productFilters'
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, XIcon } from './icons'
import Spinner from './Spinner'
import { buttonClass, ui } from './ui'

type ListParams = Partial<Record<keyof ProductListFilters | 'page', string | number>>

/** Tabs after the first three are "needs attention" views — counts there get a colour when non-zero. */
const COUNT_TONE: Partial<Record<ProductTab, string>> = {
  ready: 'bg-teal-50 text-teal-700',
  'missing-photo': 'bg-amber-50 text-amber-700',
  'no-category': 'bg-amber-50 text-amber-700',
  'out-of-stock': 'bg-rose-50 text-rose-700',
  removed: 'bg-rose-50 text-rose-700',
}

const control = ui.control

/**
 * Status tabs (with counts), search/supplier/source filters and pagination
 * for the products list. Every change navigates inside a transition, so the
 * current table stays on screen (dimmed) until the next one is ready.
 */
export default function ProductListShell({
  filters,
  tabCounts,
  suppliers,
  page,
  pageSize,
  total,
  children,
}: {
  filters: ProductListFilters
  tabCounts: Record<ProductTab, number>
  suppliers: { supplier: string; product_count: number }[]
  page: number
  pageSize: number
  total: number
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  const [q, setQ] = useState(filters.q)
  // The last search we navigated to — so a slow response doesn't overwrite
  // what the user has typed since, while back/forward still updates the box.
  const lastPushedQ = useRef(filters.q)

  function hrefFor(params: ListParams) {
    const merged: ListParams = { ...filters, page, ...params }
    const search = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) {
      if (v === '' || v == null || (k === 'status' && v === 'all') || (k === 'page' && Number(v) === 1)) continue
      search.set(k, String(v))
    }
    const qs = search.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  function navigate(params: ListParams, scroll = false) {
    if (params.q !== undefined) lastPushedQ.current = String(params.q)
    startTransition(() => router.push(hrefFor(params), { scroll }))
  }

  /** Plain clicks navigate in-page (with pending state); modified clicks keep normal link behaviour. */
  function onLinkClick(e: React.MouseEvent<HTMLAnchorElement>, params: ListParams, scroll = false) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(params, scroll)
  }

  useEffect(() => {
    if (filters.q !== lastPushedQ.current) {
      lastPushedQ.current = filters.q
      setQ(filters.q)
    }
  }, [filters.q])

  // Search as you type (debounced).
  useEffect(() => {
    const next = q.trim()
    if (next === lastPushedQ.current) return
    const timer = setTimeout(() => navigate({ q: next, page: 1 }), 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const hasFilters = Boolean(filters.q || filters.supplier || filters.source)
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <>
      {/* Status tabs */}
      <div className="admin-scroll mb-5 overflow-x-auto border-b border-slate-200">
        <nav className="-mb-px flex min-w-max" aria-label="Product status">
          {PRODUCT_TABS.map((t, i) => {
            const active = filters.status === t.key
            const n = tabCounts[t.key] ?? 0
            const tone = active ? 'bg-blue-900 text-white' : n > 0 && COUNT_TONE[t.key] ? COUNT_TONE[t.key] : 'bg-slate-100 text-slate-600'
            return (
              <Fragment key={t.key}>
                {i === 3 && <span className="mx-2 my-3 w-px bg-slate-200" aria-hidden="true" />}
                <Link
                  href={hrefFor({ status: t.key, page: 1 })}
                  onClick={(e) => onLinkClick(e, { status: t.key, page: 1 })}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                    active ? 'border-blue-900 text-blue-900' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${tone}`}>{n.toLocaleString('en-IN')}</span>
                </Link>
              </Fragment>
            )
          })}
        </nav>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate({ q: q.trim(), page: 1 })
            }}
            placeholder="Search name or Marg code"
            aria-label="Search products"
            enterKeyHint="search"
            className={`${control} w-full pl-9 pr-9`}
          />
          {pending ? (
            <Spinner className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          ) : (
            q && (
              <button
                type="button"
                onClick={() => {
                  setQ('')
                  navigate({ q: '', page: 1 })
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Clear search"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )
          )}
        </div>
        <select
          value={filters.supplier}
          onChange={(e) => navigate({ supplier: e.target.value, page: 1 })}
          aria-label="Supplier"
          className={`${control} max-w-full sm:max-w-[15rem]`}
        >
          <option value="">All suppliers</option>
          {suppliers.map((s) => (
            <option key={s.supplier} value={s.supplier}>
              {s.supplier} ({s.product_count.toLocaleString('en-IN')})
            </option>
          ))}
        </select>
        <select
          value={filters.source}
          onChange={(e) => navigate({ source: e.target.value, page: 1 })}
          aria-label="Source"
          className={control}
        >
          {PRODUCT_SOURCES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQ('')
              navigate({ q: '', supplier: '', source: '', page: 1 })
            }}
            className={buttonClass('ghost')}
          >
            <XIcon className="h-4 w-4" />
            Clear filters
          </button>
        )}
      </div>

      <div className={`transition-opacity ${pending ? 'pointer-events-none opacity-60' : ''}`} aria-busy={pending}>
        {children}
      </div>

      {total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span>
            Showing <span className="font-medium text-slate-700">{from.toLocaleString('en-IN')}</span>–
            <span className="font-medium text-slate-700">{to.toLocaleString('en-IN')}</span> of{' '}
            <span className="font-medium text-slate-700">{total.toLocaleString('en-IN')}</span>
          </span>
          {pageCount > 1 && (
            <div className="flex items-center gap-2">
              <PageLink
                href={page > 1 ? hrefFor({ page: page - 1 }) : null}
                onClick={(e) => onLinkClick(e, { page: page - 1 }, true)}
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Prev
              </PageLink>
              <span className="px-1 tabular-nums">
                Page {page} of {pageCount.toLocaleString('en-IN')}
              </span>
              <PageLink
                href={page < pageCount ? hrefFor({ page: page + 1 }) : null}
                onClick={(e) => onLinkClick(e, { page: page + 1 }, true)}
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </PageLink>
            </div>
          )}
        </div>
      )}
    </>
  )
}

function PageLink({
  href,
  onClick,
  children,
}: {
  href: string | null
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void
  children: React.ReactNode
}) {
  const cls = buttonClass('secondary', 'sm', 'h-9')
  if (!href) {
    return (
      <span className={`${cls} cursor-not-allowed opacity-50`} aria-disabled="true">
        {children}
      </span>
    )
  }
  return (
    <Link href={href} onClick={onClick} className={cls}>
      {children}
    </Link>
  )
}
