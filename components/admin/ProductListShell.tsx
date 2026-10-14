'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  PRODUCT_ISSUES,
  PRODUCT_SOURCES,
  PRODUCT_VIEWS,
  productListHref,
  type ProductIssue,
  type ProductListFilters,
  type ProductView,
} from '@/lib/admin/productFilters'
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ImageIcon,
  LayersIcon,
  PencilIcon,
  RefreshIcon,
  SearchIcon,
  ShapesIcon,
  TruckIcon,
  XCircleIcon,
  XIcon,
  type Icon,
} from './icons'
import Select from './Select'
import Spinner from './Spinner'
import { buttonClass, ui } from './ui'

type ListParams = Partial<ProductListFilters & { page: number }>

const SOURCE_ICON: Record<ProductListFilters['source'], React.ReactNode> = {
  '': <LayersIcon className="h-4 w-4 text-slate-400" />,
  marg: <RefreshIcon className="h-4 w-4 text-blue-600" />,
  manual: <PencilIcon className="h-4 w-4 text-amber-600" />,
}

/** "Needs attention" chips: icon + colours used while the count is non-zero. */
const ISSUE_STYLE: Record<ProductIssue, { icon: Icon; iconClass: string; countClass: string }> = {
  ready: { icon: CheckCircleIcon, iconClass: 'text-teal-600', countClass: 'bg-teal-50 text-teal-700' },
  'missing-photo': { icon: ImageIcon, iconClass: 'text-amber-600', countClass: 'bg-amber-50 text-amber-700' },
  'no-category': { icon: ShapesIcon, iconClass: 'text-amber-600', countClass: 'bg-amber-50 text-amber-700' },
  'out-of-stock': { icon: XCircleIcon, iconClass: 'text-rose-600', countClass: 'bg-rose-50 text-rose-700' },
  removed: { icon: AlertTriangleIcon, iconClass: 'text-rose-600', countClass: 'bg-rose-50 text-rose-700' },
}

const fmt = (n: number) => n.toLocaleString('en-IN')

/**
 * Filter bar + pagination for the products list: a view switch (all /
 * published / drafts), search, supplier and source, and "needs attention"
 * chips that combine with the view. Every change navigates inside a
 * transition, so the current table stays on screen (dimmed) until the next
 * one is ready.
 */
export default function ProductListShell({
  filters,
  viewCounts,
  issueCounts,
  suppliers,
  page,
  pageSize,
  total,
  children,
}: {
  filters: ProductListFilters
  viewCounts: Record<ProductView, number>
  issueCounts: Record<ProductIssue, number>
  suppliers: { supplier: string; product_count: number }[]
  page: number
  pageSize: number
  total: number
  children: React.ReactNode
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [q, setQ] = useState(filters.q)
  // The last search we navigated to — so a slow response doesn't overwrite
  // what the user has typed since, while back/forward still updates the box.
  const lastPushedQ = useRef(filters.q)

  const hrefFor = (params: ListParams) => productListHref({ ...filters, page, ...params })

  function navigate(params: ListParams, scroll = false) {
    if (params.q !== undefined) lastPushedQ.current = params.q
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

  const hasFilters = Boolean(filters.view !== 'all' || filters.issue || filters.q || filters.supplier || filters.source)
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <>
      {/* View switch + search & filters */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <nav aria-label="Show" className="inline-flex shrink-0 rounded-xl bg-slate-100 p-1 ring-1 ring-inset ring-slate-200/70">
          {PRODUCT_VIEWS.map((v) => {
            const on = filters.view === v.key
            return (
              <Link
                key={v.key}
                href={hrefFor({ view: v.key, page: 1 })}
                onClick={(e) => onLinkClick(e, { view: v.key, page: 1 })}
                aria-current={on ? 'page' : undefined}
                className={`inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-medium transition ${
                  on ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {v.label}
                <span className={`text-xs tabular-nums ${on ? 'text-slate-500' : 'text-slate-400'}`}>{fmt(viewCounts[v.key] ?? 0)}</span>
              </Link>
            )
          })}
        </nav>

        <div className="flex w-full flex-wrap items-center gap-2 lg:ml-auto lg:w-auto lg:flex-nowrap">
          <div className="relative w-full sm:w-64">
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
              className={`${ui.control} w-full pl-9 pr-9`}
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
          <Select
            aria-label="Supplier"
            className="w-full sm:w-56"
            value={filters.supplier}
            onChange={(v) => navigate({ supplier: v, page: 1 })}
            searchable
            options={[
              { value: '', label: 'All suppliers', icon: <TruckIcon className="h-4 w-4 text-slate-400" /> },
              ...suppliers.map((s) => ({ value: s.supplier, label: s.supplier, meta: fmt(s.product_count) })),
            ]}
          />
          <Select
            aria-label="Source"
            className="w-full sm:w-44"
            value={filters.source}
            onChange={(v) => navigate({ source: v as ProductListFilters['source'], page: 1 })}
            options={PRODUCT_SOURCES.map((s) => ({ value: s.key, label: s.label, icon: SOURCE_ICON[s.key] }))}
          />
        </div>
      </div>

      {/* Needs attention — combines with the view above */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Needs attention</span>
        {PRODUCT_ISSUES.map((issue) => {
          const on = filters.issue === issue.key
          const n = issueCounts[issue.key] ?? 0
          const style = ISSUE_STYLE[issue.key]
          const IssueIcon = style.icon
          return (
            <Link
              key={issue.key}
              href={hrefFor({ issue: on ? '' : issue.key, page: 1 })}
              onClick={(e) => onLinkClick(e, { issue: on ? '' : issue.key, page: 1 })}
              aria-current={on ? 'true' : undefined}
              title={on ? 'Remove this filter' : `Show only: ${issue.label.toLowerCase()}`}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full border pl-2.5 pr-2 text-sm font-medium transition ${
                on
                  ? 'border-blue-900 bg-blue-900 text-white shadow-sm hover:bg-blue-800'
                  : n > 0
                    ? 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50'
                    : 'border-dashed border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
              }`}
            >
              <IssueIcon className={`h-3.5 w-3.5 ${on ? 'text-white' : n > 0 ? style.iconClass : 'text-slate-300'}`} />
              {issue.label}
              <span
                className={`rounded-full px-1.5 py-px text-xs font-semibold tabular-nums ${
                  on ? 'bg-white/20 text-white' : n > 0 ? style.countClass : 'text-slate-400'
                }`}
              >
                {fmt(n)}
              </span>
              {on && <XIcon className="h-3.5 w-3.5 opacity-80" />}
            </Link>
          )
        })}
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQ('')
              navigate({ view: 'all', issue: '', q: '', supplier: '', source: '', page: 1 })
            }}
            className={buttonClass('ghost', 'sm', 'ml-auto')}
          >
            <XIcon className="h-3.5 w-3.5" />
            Reset filters
          </button>
        )}
      </div>

      <div className={`transition-opacity ${pending ? 'pointer-events-none opacity-60' : ''}`} aria-busy={pending}>
        {children}
      </div>

      {total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span>
            Showing <span className="font-medium text-slate-700">{fmt(from)}</span>–<span className="font-medium text-slate-700">{fmt(to)}</span> of{' '}
            <span className="font-medium text-slate-700">{fmt(total)}</span>
          </span>
          {pageCount > 1 && (
            <div className="flex items-center gap-2">
              <PageLink href={page > 1 ? hrefFor({ page: page - 1 }) : null} onClick={(e) => onLinkClick(e, { page: page - 1 }, true)}>
                <ChevronLeftIcon className="h-4 w-4" />
                Prev
              </PageLink>
              <span className="px-1 tabular-nums">
                Page {page} of {fmt(pageCount)}
              </span>
              <PageLink href={page < pageCount ? hrefFor({ page: page + 1 }) : null} onClick={(e) => onLinkClick(e, { page: page + 1 }, true)}>
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
