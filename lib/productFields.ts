/**
 * Optional product fields an admin can switch off for the whole catalogue
 * (the small toggle beside each field on the product form). Stored in
 * site_settings under PRODUCT_FIELDS_SETTING as the list of switched-off keys,
 * so every field is on until someone turns it off.
 *
 * A switched-off field:
 *   - disappears from the product form (its saved values are left untouched),
 *   - is ignored when a product is saved,
 *   - is hidden on the storefront when `storefront` is true.
 *
 * Client-safe: no server imports.
 */
export const PRODUCT_FIELDS_SETTING = 'product_fields_hidden'

export const PRODUCT_FIELDS = {
  slug: { label: 'URL slug', storefront: false },
  sku: { label: 'SKU', storefront: false },
  short_description: { label: 'Short description', storefront: true },
  description: { label: 'Description', storefront: true },
  features: { label: 'Why kids love it', storefront: true },
  sale_price: { label: 'Sale price', storefront: true },
  price_display: { label: 'Price display', storefront: false },
  colors: { label: 'Colours', storefront: true },
  material: { label: 'Material', storefront: true },
  tags: { label: 'Tags', storefront: true },
  age_groups: { label: 'Age groups', storefront: true },
  seo: { label: 'Search engines', storefront: true },
  subcategory: { label: 'Subcategory', storefront: false },
  display_order: { label: 'Display order', storefront: false },
  popular: { label: 'Popular', storefront: false },
  new_arrival: { label: 'New arrival', storefront: false },
  promo_tag: { label: 'Promo tag', storefront: true },
} as const

export type ProductFieldKey = keyof typeof PRODUCT_FIELDS

export function isProductFieldKey(v: unknown): v is ProductFieldKey {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(PRODUCT_FIELDS, v)
}

/** The stored setting → a clean list of switched-off field keys. */
export function parseHiddenFields(raw: unknown): ProductFieldKey[] {
  return Array.isArray(raw) ? Array.from(new Set(raw.filter(isProductFieldKey))) : []
}
