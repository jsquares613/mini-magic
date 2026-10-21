'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  PRODUCT_ISSUES,
  PRODUCT_SOURCES,
  PRODUCT_VIEWS,
  SEARCH_FIELDS,
  SEARCH_MATCHES,
  describeSearch,
  productListHref,
  searchPlaceholder,
  type ProductIssue,
  type ProductListFilters,
  type ProductView,
  type SearchField,
  type SearchMatch,
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
  SparklesIcon,
  TruckIcon,
  XCircleIcon,
  XIcon,
  type Icon,
} from './icons'
import Select from './Select'
import Spinner from './Spinner'
import { buttonClass } from './ui'

type ListParams = Partial<ProductListFilters & { page: number }>
type SearchOptions = Pick<ProductListFilters, 'by' | 'match'>

const SOURCE_ICON: Record<ProductListFilters['source'], React.ReactNode> = {
  '': <LayersIcon className="h-4 w-4 text-slate-400" />,
  marg: <RefreshIcon className="h-4 w-4 text-blue-600" />,
  manual: <PencilIcon className="h-4 w-4 text-amber-600" />,
}

/** "Needs attention" chips: icon + colours used while the count is non-zero. */
const ISSUE_STYLE: Record<ProductIssue, { icon: Icon; iconClass: string; countClass: string }> = {
  ready: { icon: CheckCircleIcon, iconClass: 'text-teal-600', countClass: 'bg-teal-50 text-teal-700' },
  'new-stock': { icon: SparklesIcon, iconClass: 'text-blue-600', countClass: 'bg-blue-50 text-blue-700' },
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
  // The last search we navigated to. Lets back/forward update the box without an
  // older, slower result overwriting what the user has typed since.
  const lastPushedQ = useRef(filters.q)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Current values for the URL-sync effect below (it only re-runs when the URL changes).
  const typed = useRef(q)
  typed.current = q
  const busy = useRef(pending)
  busy.current = pending
  // Search options (field + match type). A ref too, so a debounced search that fires
  // right after a change uses the new options rather than those from when the timer started.
  const [options, setOptions] = useState<SearchOptions>({ by: filters.by, match: filters.match })
  const optionsRef = useRef(options)
  optionsRef.current = options

  const hrefFor = (params: ListParams) => productListHref({ ...filters, ...optionsRef.current, page, ...params })

  function cancelSearchTimer() {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = null
  }

  /** `replace` keeps history clean while a search is refined, so Back leaves the search. */
  function navigate(params: ListParams, scroll = false, replace = false) {
    if (params.q !== undefined) {
      lastPushedQ.current = params.q
      cancelSearchTimer()
    }
    const href = hrefFor(params)
    startTransition(() => (replace ? router.replace(href, { scroll }) : router.push(href, { scroll })))
  }

  /** Run the search now (debounce, Enter, clear). Starting a search adds a history entry; refining it doesn't. */
  function search(value: string) {
    const next = value.trim()
    if (next === lastPushedQ.current) return cancelSearchTimer()
    navigate({ q: next, page: 1 }, false, lastPushedQ.current !== '')
  }

  /** New field or match type: re-run whatever is in the box; an empty box just remembers it. */
  function changeOptions(patch: Partial<SearchOptions>) {
    const next = { ...optionsRef.current, ...patch }
    setOptions(next)
    optionsRef.current = next
    const text = q.trim()
    if (text || lastPushedQ.current) navigate({ q: text, page: 1 }, false, lastPushedQ.current !== '')
  }

  // Back/forward to a search made with other options.
  useEffect(() => setOptions({ by: filters.by, match: filters.match }), [filters.by, filters.match])

  function clearSearch() {
    setQ('')
    search('')
    inputRef.current?.focus()
  }

  // "/" anywhere on the page (outside a text field) jumps to the search box.
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return
      const t = e.target instanceof HTMLElement ? e.target : null
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return
      e.preventDefault()
      inputRef.current?.focus()
      inputRef.current?.select()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const phrase = describeSearch(filters.by, filters.match)
  const otherFilters = Boolean(filters.view !== 'all' || filters.issue || filters.supplier || filters.source)
  const suggestion = 'rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800 transition hover:border-blue-300 hover:bg-blue-100'

  /** Plain clicks navigate in-page (with pending state); modified clicks keep normal link behaviour. */
  function onLinkClick(e: React.MouseEvent<HTMLAnchorElement>, params: ListParams, scroll = false) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(params, scroll)
  }

  // The URL's search changed without us (back/forward, a link): show it in the box —
  // unless the user is mid-search, in which case this is an older result landing.
  useEffect(() => {
    if (filters.q === lastPushedQ.current) return
    if (busy.current || typed.current.trim() !== lastPushedQ.current) return
    lastPushedQ.current = filters.q
    setQ(filters.q)
  }, [filters.q])

  // Search as you type (debounced).
  useEffect(() => {
    if (q.trim() === lastPushedQ.current) return
    searchTimer.current = setTimeout(() => search(q), 350)
    return cancelSearchTimer
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
                prefetch={false}
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

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap lg:ml-auto">
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

      {/* Search bar: the text, plus where it looks and how it must match */}
      <div
        role="search"
        className={`${filters.q ? 'mb-2' : 'mb-4'} flex flex-col rounded-xl border border-slate-300 bg-white shadow-sm transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 hover:border-slate-400 focus-within:hover:border-blue-500 sm:flex-row sm:items-center`}
      >
        <div className="relative flex min-w-0 flex-1 items-center">
          <SearchIcon className="pointer-events-none absolute left-3.5 h-[18px] w-[18px] text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') search(q)
              if (e.key === 'Escape' && q) {
                setQ('')
                search('')
              }
            }}
            placeholder={searchPlaceholder(options.by, options.match)}
            aria-label="Search products"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            className="h-11 w-full min-w-0 rounded-xl bg-transparent pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <span className="absolute right-2.5 flex items-center">
            {pending ? (
              <Spinner className="h-4 w-4 text-slate-400" />
            ) : q ? (
              <button
                type="button"
                onClick={clearSearch}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Clear search"
                title="Clear (Esc)"
              >
                <XIcon className="h-4 w-4" />
              </button>
            ) : (
              !focused && (
                <kbd
                  className="hidden h-5 items-center rounded border border-slate-200 bg-slate-50 px-1.5 font-sans text-[11px] font-medium text-slate-400 sm:inline-flex"
                  title="Press / to search"
                >
                  /
                </kbd>
              )
            )}
          </span>
        </div>
        <div className="flex items-center gap-1 border-t border-slate-200 p-1 sm:border-l sm:border-t-0">
          <Select
            variant="ghost"
            inlineLabel="In"
            aria-label="Search in"
            className="min-w-0 flex-1 sm:w-44 sm:flex-none"
            value={options.by}
            onChange={(v) => changeOptions({ by: v as SearchField })}
            searchable={false}
            options={SEARCH_FIELDS.map((f) => ({ value: f.key, label: f.label }))}
          />
          <span className="h-5 w-px shrink-0 bg-slate-200" aria-hidden="true" />
          <Select
            variant="ghost"
            inlineLabel="Match"
            aria-label="Match"
            className="min-w-0 flex-1 sm:w-44 sm:flex-none"
            value={options.match}
            onChange={(v) => changeOptions({ match: v as SearchMatch })}
            searchable={false}
            options={SEARCH_MATCHES.map((m) => ({ value: m.key, label: m.label, description: m.description }))}
          />
        </div>
      </div>

      {/* What the search found — and quick ways out when it found nothing */}
      <div className={`text-sm text-slate-500 ${filters.q ? 'mb-4' : ''}`} aria-live="polite">
        {filters.q && (
          <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 transition-opacity ${pending ? 'opacity-60' : ''}`}>
            <span>
              <span className="font-semibold tabular-nums text-slate-900">{fmt(total)}</span> {total === 1 ? 'product' : 'products'}{' '}
              {phrase[0]} “<span className="font-medium text-slate-900">{filters.q}</span>”{phrase[1] && ` ${phrase[1]}`}
              {otherFilters && ' · with the filters above'}
            </span>
            {total === 0 && filters.match !== '' && (
              <button type="button" className={suggestion} onClick={() => changeOptions({ match: '' })}>
                Try “Contains”
              </button>
            )}
            {total === 0 && filters.by !== '' && (
              <button type="button" className={suggestion} onClick={() => changeOptions({ by: '' })}>
                Search all fields
              </button>
            )}
            {total === 0 && otherFilters && (
              <button type="button" className={suggestion} onClick={() => navigate({ view: 'all', issue: '', supplier: '', source: '', page: 1 })}>
                Search all products
              </button>
            )}
            <button type="button" onClick={clearSearch} className="font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline">
              Clear search
            </button>
          </div>
        )}
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
              prefetch={false}
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
              setOptions({ by: '', match: '' })
              optionsRef.current = { by: '', match: '' }
              navigate({ view: 'all', issue: '', q: '', by: '', match: '', supplier: '', source: '', page: 1 })
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
    <Link prefetch={false} href={href} onClick={onClick} className={cls}>
      {children}
    </Link>
  )
}
