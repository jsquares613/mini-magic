/**
 * Presentation helpers shared across the storefront. Keeping these in one place
 * means the currency format (and locale) is defined once.
 */

/** Format a number as the storefront's price string, e.g. `₹170/-`. */
export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}/-`
}

/** Convert an arbitrary string to a URL-safe slug. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
