import type { StockStatus } from '@/types'
import type { Tables } from '@/lib/supabase/database.types'

/** At or below this many pieces a Marg-linked product shows as "Low Stock". */
export const LOW_STOCK_THRESHOLD = 3

type StockFields = Pick<Tables<'products'>, 'marg_code' | 'marg_stock' | 'available' | 'stock_status_override'>

/**
 * The stock status customers see. Staff override wins; otherwise Marg-linked
 * products derive it from the synced quantity, and hand-made products from
 * the manual `available` flag.
 */
export function stockStatusOf(row: StockFields): StockStatus {
  if (row.stock_status_override) return row.stock_status_override
  if (row.marg_code == null) return row.available ? 'in-stock' : 'out-of-stock'
  const qty = row.marg_stock ?? 0
  if (qty <= 0) return 'out-of-stock'
  if (qty <= LOW_STOCK_THRESHOLD) return 'low-stock'
  return 'in-stock'
}
