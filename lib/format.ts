/**
 * Presentation helpers shared across the storefront. Keeping these in one place
 * means the currency format (and locale) is defined once.
 */

/** Format a number as the storefront's price string, e.g. `₹170/-`. */
export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}/-`
}

/** "just now", "5 min ago", "3 h ago", else a short date — for "last synced" style labels. */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/** Convert an arbitrary string to a URL-safe slug. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
