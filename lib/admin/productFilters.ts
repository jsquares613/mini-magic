/**
 * Admin product-list filters, shared by the list page (which rows to show) and
 * the bulk actions ("apply to all N products matching this view").
 *
 * Two independent axes that combine: the *view* (all / published / drafts)
 * and an optional *issue* ("needs attention": missing photo, out of stock…),
 * plus source, supplier and search. Every filter is a PostgREST condition
 * string, combined into one logic tree that applies identically to a select or
 * an update via `.or(tree)`.
 */

export const PRODUCT_VIEWS = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
] as const
export type ProductView = (typeof PRODUCT_VIEWS)[number]['key']

export const PRODUCT_ISSUES = [
  { key: 'ready', label: 'Ready to publish' },
  { key: 'new-stock', label: 'New stock' },
  { key: 'missing-photo', label: 'Missing photo' },
  { key: 'no-category', label: 'No category' },
  { key: 'out-of-stock', label: 'Out of stock' },
  { key: 'removed', label: 'Removed in Marg' },
] as const
export type ProductIssue = (typeof PRODUCT_ISSUES)[number]['key']

export const PRODUCT_SOURCES = [
  { key: '', label: 'All sources' },
  { key: 'marg', label: 'From Marg' },
  { key: 'manual', label: 'Added by hand' },
] as const
export type ProductSource = (typeof PRODUCT_SOURCES)[number]['key']

/** Which field the search box looks in (`noun` builds the box's placeholder). */
export const SEARCH_FIELDS = [
  { key: '', label: 'All fields', noun: 'name or Marg code' },
  { key: 'name', label: 'Product name', noun: 'product name' },
  { key: 'marg', label: 'Marg name', noun: 'Marg name' },
  { key: 'code', label: 'Marg code', noun: 'Marg code' },
] as const
export type SearchField = (typeof SEARCH_FIELDS)[number]['key']

/** How the search text has to match the field. */
export const SEARCH_MATCHES = [
  { key: '', label: 'Contains', description: 'Every word, anywhere, any order' },
  { key: 'start', label: 'Starts with', description: 'The field begins with the text' },
  { key: 'exact', label: 'Exact match', description: 'The whole field equals the text' },
] as const
export type SearchMatch = (typeof SEARCH_MATCHES)[number]['key']

export interface ProductListFilters {
  view: ProductView
  issue: ProductIssue | ''
  source: ProductSource
  supplier: string
  q: string
  /** Field the search applies to ('' = name, Marg name and Marg code). */
  by: SearchField
  /** How the search must match ('' = contains). */
  match: SearchMatch
}

const nounFor = (by: SearchField) => SEARCH_FIELDS.find((f) => f.key === by)?.noun ?? SEARCH_FIELDS[0].noun

/** Placeholder for the search box, e.g. "Product name starts with…". */
export function searchPlaceholder(by: SearchField, match: SearchMatch): string {
  const noun = nounFor(by)
  if (match === 'start') return `${noun[0].toUpperCase()}${noun.slice(1)} starts with…`
  if (match === 'exact') return `Exact ${noun}…`
  return `Search ${noun}`
}

/**
 * The search in words, around the quoted search text: "12 products [whose product
 * name starts with] “teddy” []" / "[matching] “pink teddy” [in Marg name]".
 */
export function describeSearch(by: SearchField, match: SearchMatch): [before: string, after: string] {
  const noun = nounFor(by)
  if (match === 'start') return [`whose ${noun} starts with`, '']
  if (match === 'exact') return [`whose ${noun} is exactly`, '']
  return ['matching', by ? `in ${noun}` : '']
}

/**
 * Where the search matched inside `text`, as sorted, merged [start, end) ranges —
 * the client-side mirror of the database conditions, for highlighting.
 */
export function matchRanges(text: string, q: string, match: SearchMatch, isCode = false): [number, number][] {
  const lower = text.toLowerCase()
  // Lower-casing can change length for a few non-Latin letters; then just don't highlight.
  if (!q || lower.length !== text.length) return []
  if (match === 'start' || match === 'exact') {
    const needle = (isCode ? q.replace(/ /g, '') : q).toLowerCase()
    const hit = match === 'exact' ? lower === needle : lower.startsWith(needle)
    return hit ? [[0, needle.length]] : []
  }
  const ranges: [number, number][] = []
  for (const word of searchWords(q)) {
    for (let i = lower.indexOf(word); i !== -1; i = lower.indexOf(word, i + word.length)) ranges.push([i, i + word.length])
  }
  ranges.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const [start, end] of ranges) {
    const last = merged[merged.length - 1]
    if (last && start <= last[1]) last[1] = Math.max(last[1], end)
    else merged.push([start, end])
  }
  return merged
}

/** What a product needs before it can be published (the DB also enforces the category). */
export const PUBLISHABLE_CONDITIONS = ['category_id.not.is.null', 'image_count.gt.0', 'marg_deleted_at.is.null']

const VIEW_CONDITIONS: Record<ProductView, string[]> = {
  all: [],
  published: ['is_published.is.true'],
  draft: ['is_published.is.false'],
}

const ISSUE_CONDITIONS: Record<ProductIssue, string[]> = {
  ready: ['is_published.is.false', ...PUBLISHABLE_CONDITIONS],
  // New items (lib/newArrivals.ts) never published yet: they reach New Arrivals once they are.
  'new-stock': ['new_since.not.is.null', 'first_published_at.is.null', 'marg_deleted_at.is.null'],
  'missing-photo': ['image_count.eq.0'],
  'no-category': ['category_id.is.null'],
  // What customers see: a staff override wins, else Marg stock / the manual flag (lib/stock.ts).
  'out-of-stock': [
    'or(stock_status_override.eq.out-of-stock,and(stock_status_override.is.null,or(marg_stock.lte.0,and(marg_code.is.null,available.is.false))))',
  ],
  removed: ['or(marg_deleted_at.not.is.null,marg_missing_since.not.is.null)'],
}

const SOURCE_CONDITIONS: Record<ProductSource, string[]> = {
  '': [],
  marg: ['marg_code.not.is.null'],
  manual: ['marg_code.is.null'],
}

/** Double-quotes a logic-tree value, so supplier names with , . ( ) work. */
const quote = (v: string) => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`

/**
 * Search words, each matched on its own (max 6; repeats dropped). Punctuation at a
 * word's edges is trimmed ("bear," → "bear"); inside it is kept ("3.5", "12-inch").
 */
function searchWords(q: string): string[] {
  const words = q
    .toLowerCase()
    .split(' ')
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter(Boolean)
  return Array.from(new Set(words)).slice(0, 6)
}

/** `_` and `\` are special in LIKE patterns (`%` and `*` never reach here), so they are escaped. */
const escapeLike = (v: string) => v.replace(/[\\_]/g, '\\$&')

/** Columns each search-by option looks in. */
const SEARCH_COLUMNS: Record<SearchField, string[]> = {
  '': ['name', 'marg_name', 'marg_code'],
  name: ['name'],
  marg: ['marg_name'],
  code: ['marg_code'],
}

export function parseProductListFilters(input: Record<string, unknown>): ProductListFilters {
  const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  // Older links used a single `status` param for both axes — still honoured.
  const legacy = s(input.status)
  return {
    view: PRODUCT_VIEWS.find((t) => t.key === (s(input.view) || legacy))?.key ?? 'all',
    issue: PRODUCT_ISSUES.find((t) => t.key === (s(input.issue) || legacy))?.key ?? '',
    source: PRODUCT_SOURCES.find((t) => t.key === input.source)?.key ?? '',
    supplier: s(input.supplier).slice(0, 100),
    // `%` and `*` are LIKE wildcards — keep the search plain text.
    q: s(input.q).replace(/[%*]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100),
    by: SEARCH_FIELDS.find((f) => f.key === input.by)?.key ?? '',
    match: SEARCH_MATCHES.find((m) => m.key === input.match)?.key ?? '',
  }
}

/** The filters as AND-ed conditions, plus any `extra` ones. Missing fields mean "no filter". */
export function productFilterConditions(f: Partial<ProductListFilters>, extra: string[] = []): string[] {
  const conditions = [
    ...VIEW_CONDITIONS[f.view ?? 'all'],
    ...(f.issue ? ISSUE_CONDITIONS[f.issue] : []),
    ...SOURCE_CONDITIONS[f.source ?? ''],
    ...extra,
  ]
  if (f.supplier) conditions.push(`marg_company.eq.${quote(f.supplier)}`)
  if (f.q) {
    const columns = SEARCH_COLUMNS[f.by ?? '']
    // The pattern must match at least one of the chosen columns (case-insensitive).
    const inAnyColumn = (pattern: string) => {
      const matches = columns.map((c) => `${c}.ilike.${quote(pattern)}`)
      return matches.length === 1 ? matches[0] : `or(${matches.join(',')})`
    }
    // Codes never contain spaces, so "12 34" is read as "1234".
    const text = escapeLike(f.by === 'code' ? f.q.replace(/ /g, '') : f.q)
    if (f.match === 'start') conditions.push(inAnyColumn(`${text}%`))
    else if (f.match === 'exact') conditions.push(inAnyColumn(text))
    // Contains: every word must appear, in any order — "pink teddy" finds "TEDDY BEAR PINK 30CM".
    else for (const word of searchWords(f.q)) conditions.push(inAnyColumn(`%${escapeLike(word)}%`))
  }
  return conditions
}

/** A logic tree for `.or()`: an OR of one AND group is just that group. Null = no filter. */
export function toLogicTree(conditions: string[]): string | null {
  return conditions.length ? `and(${conditions.join(',')})` : null
}

/** URL for the products list with these filters (defaults omitted). */
export function productListHref(f: Partial<ProductListFilters> & { page?: number }): string {
  const params = new URLSearchParams()
  if (f.view && f.view !== 'all') params.set('view', f.view)
  if (f.issue) params.set('issue', f.issue)
  if (f.source) params.set('source', f.source)
  if (f.supplier) params.set('supplier', f.supplier)
  if (f.q) params.set('q', f.q)
  if (f.by) params.set('by', f.by)
  if (f.match) params.set('match', f.match)
  if (f.page && f.page > 1) params.set('page', String(f.page))
  const qs = params.toString()
  return qs ? `/admin/products?${qs}` : '/admin/products'
}
