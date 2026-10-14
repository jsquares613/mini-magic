/**
 * Admin product-list filters, shared by the list page (which rows to show) and
 * the bulk actions ("apply to all N products matching this view").
 *
 * Every filter is a PostgREST condition string, combined into one logic tree
 * that applies identically to a select or an update via `.or(tree)`.
 */

export const PRODUCT_TABS = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
  { key: 'ready', label: 'Ready to publish' },
  { key: 'missing-photo', label: 'Missing photo' },
  { key: 'no-category', label: 'No category' },
  { key: 'out-of-stock', label: 'Out of stock' },
  { key: 'removed', label: 'Removed in Marg' },
] as const
export type ProductTab = (typeof PRODUCT_TABS)[number]['key']

export const PRODUCT_SOURCES = [
  { key: '', label: 'All sources' },
  { key: 'marg', label: 'From Marg' },
  { key: 'manual', label: 'Added by hand' },
] as const
export type ProductSource = (typeof PRODUCT_SOURCES)[number]['key']

export interface ProductListFilters {
  status: ProductTab
  source: ProductSource
  supplier: string
  q: string
}

/** What a product needs before it can be published (the DB also enforces the category). */
export const PUBLISHABLE_CONDITIONS = ['category_id.not.is.null', 'image_count.gt.0', 'marg_deleted_at.is.null']

const TAB_CONDITIONS: Record<ProductTab, string[]> = {
  all: [],
  published: ['is_published.is.true'],
  draft: ['is_published.is.false'],
  ready: ['is_published.is.false', ...PUBLISHABLE_CONDITIONS],
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

export function parseProductListFilters(input: Record<string, unknown>): ProductListFilters {
  const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const status = PRODUCT_TABS.find((t) => t.key === input.status)?.key ?? 'all'
  const source = PRODUCT_SOURCES.find((t) => t.key === input.source)?.key ?? ''
  return {
    status,
    source,
    supplier: s(input.supplier).slice(0, 100),
    // `%` and `*` are LIKE wildcards — keep the search plain text.
    q: s(input.q).replace(/[%*]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100),
  }
}

/** The filters as AND-ed conditions, plus any `extra` ones. */
export function productFilterConditions(f: ProductListFilters, extra: string[] = []): string[] {
  const conditions = [...TAB_CONDITIONS[f.status], ...SOURCE_CONDITIONS[f.source], ...extra]
  if (f.supplier) conditions.push(`marg_company.eq.${quote(f.supplier)}`)
  if (f.q) {
    const like = quote(`%${f.q}%`)
    conditions.push(`or(name.ilike.${like},marg_name.ilike.${like},marg_code.ilike.${like})`)
  }
  return conditions
}

/** A logic tree for `.or()`: an OR of one AND group is just that group. Null = no filter. */
export function toLogicTree(conditions: string[]): string | null {
  return conditions.length ? `and(${conditions.join(',')})` : null
}
