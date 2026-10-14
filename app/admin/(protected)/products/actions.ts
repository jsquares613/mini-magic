'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminSupabase } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/supabase/auth'
import { deleteStorageObjects } from '@/lib/supabase/storage'
import { slugify } from '@/lib/format'
import { isActionError, type ActionResult } from '@/lib/admin/actionResult'
import type { Tables, TablesInsert } from '@/lib/supabase/database.types'
import {
  PUBLISHABLE_CONDITIONS,
  parseProductListFilters,
  productFilterConditions,
  toLogicTree,
  type ProductListFilters,
} from '@/lib/admin/productFilters'

/* --------------------------- FormData helpers --------------------------- */
function str(fd: FormData, k: string): string | null {
  const v = fd.get(k)
  return typeof v === 'string' && v.trim() ? v.trim() : null
}
function num(fd: FormData, k: string): number | null {
  const v = str(fd, k)
  return v == null ? null : Number(v)
}
function bool(fd: FormData, k: string): boolean {
  return fd.get(k) === 'on' || fd.get(k) === 'true'
}
function commaList(fd: FormData, k: string): string[] {
  return (str(fd, k) ?? '').split(',').map((s) => s.trim()).filter(Boolean)
}
function lineList(fd: FormData, k: string): string[] {
  return (str(fd, k) ?? '').split('\n').map((s) => s.trim()).filter(Boolean)
}

const STOCK_OVERRIDES = ['in-stock', 'low-stock', 'out-of-stock', 'pre-order'] as const
type StockOverride = (typeof STOCK_OVERRIDES)[number]

function stockOverride(fd: FormData): StockOverride | null {
  const v = str(fd, 'stock_status_override')
  return STOCK_OVERRIDES.includes(v as StockOverride) ? (v as StockOverride) : null
}

function parseProduct(fd: FormData): TablesInsert<'products'> {
  const name = str(fd, 'name') ?? 'Untitled'
  return {
    name,
    slug: str(fd, 'slug') || slugify(name),
    sku: str(fd, 'sku'),
    short_description: str(fd, 'short_description'),
    description: str(fd, 'description'),
    category_id: str(fd, 'category_id'),
    subcategory_id: str(fd, 'subcategory_id'),
    price: num(fd, 'price'),
    sale_price: num(fd, 'sale_price'),
    price_display: (str(fd, 'price_display') as 'show' | 'hide' | 'enquire') ?? 'show',
    material: str(fd, 'material'),
    color: str(fd, 'color'),
    available: bool(fd, 'available'),
    stock_status_override: stockOverride(fd),
    is_published: bool(fd, 'is_published'),
    tags: commaList(fd, 'tags'),
    features: lineList(fd, 'features'),
    popular: bool(fd, 'popular'),
    new_arrival: bool(fd, 'new_arrival'),
    promo_tag: str(fd, 'promo_tag'),
    display_order: num(fd, 'display_order') ?? 0,
    seo_title: str(fd, 'seo_title'),
    seo_description: str(fd, 'seo_description'),
  }
}

const PUBLISH_NEEDS_CATEGORY = { error: 'Choose a category before publishing this product.' }
const SALE_ABOVE_PRICE = { error: 'Sale price can’t be higher than the price.' }

/** Mirrors products_sale_price_chk, with a readable message instead of a constraint error. */
function saleAbovePrice(p: TablesInsert<'products'>): boolean {
  return p.sale_price != null && p.price != null && p.sale_price > p.price
}

/**
 * Marg-owned fields the admin has changed. A field differing from Marg's value
 * is "overridden" and the sync stops touching it; setting it back to Marg's
 * value hands it back to the sync.
 */
function margOverrides(
  current: Pick<Tables<'products'>, 'marg_name' | 'marg_mrp' | 'overridden_fields'>,
  payload: TablesInsert<'products'>,
): string[] {
  const overrides = new Set(current.overridden_fields)
  const track = (field: string, differs: boolean) => (differs ? overrides.add(field) : overrides.delete(field))
  track('name', payload.name !== current.marg_name)
  track('price', (payload.price ?? null) !== (current.marg_mrp == null ? null : Number(current.marg_mrp)))
  return Array.from(overrides)
}

async function syncAgeGroups(productId: string, ageGroupIds: string[]): Promise<{ error: string } | void> {
  const supabase = createAdminSupabase()
  const del = await supabase.from('product_age_groups').delete().eq('product_id', productId)
  if (del.error) return { error: del.error.message }
  if (ageGroupIds.length) {
    const ins = await supabase
      .from('product_age_groups')
      .insert(ageGroupIds.map((age_group_id) => ({ product_id: productId, age_group_id })))
    if (ins.error) return { error: ins.error.message }
  }
}

function revalidateStorefront(slug?: string) {
  revalidatePath('/admin/products')
  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath('/offers')
  revalidatePath('/categories')
  if (slug) revalidatePath(`/products/${slug}`)
}

/* ------------------------------- Actions -------------------------------- */
/** Returns the new product's id (rather than redirecting) so the caller can
 *  upload any images staged on the create form before navigating away.
 *  Always creates a draft: publishing needs a photo, and photos can only be
 *  attached once the row exists — ProductForm publishes after uploading. */
export async function createProduct(formData: FormData): Promise<ActionResult<string>> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const payload = { ...parseProduct(formData), is_published: false }
  if (saleAbovePrice(payload)) return SALE_ABOVE_PRICE

  const { data, error } = await supabase.from('products').insert(payload).select('id').single()
  if (error) return { error: error.message }

  const syncResult = await syncAgeGroups(data.id, formData.getAll('age_group_ids').map(String))
  if (isActionError(syncResult)) return syncResult

  revalidateStorefront(payload.slug)
  return data.id
}

export async function updateProduct(id: string, formData: FormData): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const payload = parseProduct(formData)
  if (payload.is_published && !payload.category_id) return PUBLISH_NEEDS_CATEGORY
  if (saleAbovePrice(payload)) return SALE_ABOVE_PRICE

  const { data: current, error: readError } = await supabase
    .from('products')
    .select('marg_code, marg_name, marg_mrp, overridden_fields, is_published, image_count, marg_deleted_at')
    .eq('id', id)
    .maybeSingle()
  if (readError) return { error: readError.message }
  if (!current) return { error: 'Product not found.' }

  // Checked when publishing, so older published products without photos can still be edited.
  if (payload.is_published && !current.is_published) {
    if (current.image_count === 0) return { error: 'Add at least one photo before publishing this product.' }
    if (current.marg_deleted_at) return { error: 'This item was deleted in Marg, so it can’t be published.' }
  }

  if (current.marg_code) {
    // Stock comes from Marg; the form only offers a status override.
    delete payload.available
    payload.overridden_fields = margOverrides(current, payload)
  } else {
    payload.stock_status_override = null
  }

  const { error } = await supabase.from('products').update(payload).eq('id', id)
  if (error) return { error: error.message }

  const syncResult = await syncAgeGroups(id, formData.getAll('age_group_ids').map(String))
  if (isActionError(syncResult)) return syncResult

  revalidateStorefront(payload.slug)
  redirect(`/admin/products/${id}`)
}

/* ----------------------------- Bulk actions ----------------------------- */
export type BulkOperation = 'set-category' | 'publish' | 'unpublish'

export interface BulkProductUpdate {
  op: BulkOperation
  /** Explicit selection (rows ticked on one page of the list)… */
  ids?: string[]
  /** …or every product matching the list's current filters. */
  filters?: ProductListFilters
  categoryId?: string | null
  subcategoryId?: string | null
}

export interface BulkProductResult {
  message: string
  changed: number
  /** Products in scope the operation couldn't apply to (e.g. not publishable yet). */
  skipped: number
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_SELECTED_IDS = 500
const nProducts = (n: number) => `${n.toLocaleString('en-IN')} product${n === 1 ? '' : 's'}`

export async function bulkUpdateProducts(input: BulkProductUpdate): Promise<ActionResult<BulkProductResult>> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()

  let scope: string[]
  if (input.filters) {
    scope = productFilterConditions(parseProductListFilters({ ...input.filters }))
  } else {
    const ids = (input.ids ?? []).filter((id) => UUID.test(id))
    if (ids.length === 0) return { error: 'Select at least one product.' }
    if (ids.length > MAX_SELECTED_IDS) return { error: `Select at most ${MAX_SELECTED_IDS} products at a time.` }
    scope = [`id.in.(${ids.join(',')})`]
  }
  // Always a WHERE clause — "all products" is an explicit tautology, never a bare UPDATE.
  const where = (...extra: string[]) => toLogicTree([...scope, ...extra]) ?? 'and(id.not.is.null)'

  let result: BulkProductResult

  if (input.op === 'publish') {
    const { count: candidates, error: countError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .or(where('is_published.is.false'))
    if (countError) return { error: countError.message }

    const { count, error } = await supabase
      .from('products')
      .update({ is_published: true }, { count: 'exact' })
      .or(where('is_published.is.false', ...PUBLISHABLE_CONDITIONS))
    if (error) return { error: error.message }

    const changed = count ?? 0
    const skipped = Math.max(0, (candidates ?? 0) - changed)
    result = {
      changed,
      skipped,
      message:
        `Published ${nProducts(changed)}.` +
        (skipped ? ` ${nProducts(skipped)} skipped — publishing needs a category and at least one photo.` : ''),
    }
  } else if (input.op === 'unpublish') {
    const { count, error } = await supabase
      .from('products')
      .update({ is_published: false }, { count: 'exact' })
      .or(where('is_published.is.true'))
    if (error) return { error: error.message }
    result = { changed: count ?? 0, skipped: 0, message: `Unpublished ${nProducts(count ?? 0)}.` }
  } else if (input.op === 'set-category') {
    const categoryId = input.categoryId ?? ''
    if (!UUID.test(categoryId)) return { error: 'Choose a category.' }
    const { data: category } = await supabase.from('categories').select('id, name').eq('id', categoryId).maybeSingle()
    if (!category) return { error: 'That category no longer exists.' }

    let subcategoryId: string | null = null
    if (input.subcategoryId) {
      const { data: sub } = UUID.test(input.subcategoryId)
        ? await supabase.from('subcategories').select('id').eq('id', input.subcategoryId).eq('category_id', categoryId).maybeSingle()
        : { data: null }
      if (!sub) return { error: 'That subcategory doesn’t belong to the chosen category.' }
      subcategoryId = sub.id
    }

    // A subcategory belongs to one category, so moving a product clears it.
    // Products already in the category keep theirs unless one was chosen.
    const { count, error } = subcategoryId
      ? await supabase
          .from('products')
          .update({ category_id: categoryId, subcategory_id: subcategoryId }, { count: 'exact' })
          .or(where())
      : await supabase
          .from('products')
          .update({ category_id: categoryId, subcategory_id: null }, { count: 'exact' })
          .or(where(`or(category_id.is.null,category_id.neq.${categoryId})`))
    if (error) return { error: error.message }
    result = { changed: count ?? 0, skipped: 0, message: `Moved ${nProducts(count ?? 0)} to ${category.name}.` }
  } else {
    return { error: 'Unknown bulk action.' }
  }

  revalidatePath('/', 'layout')
  return result
}

export async function deleteProduct(id: string): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { data: images } = await supabase.from('product_images').select('image_url').eq('product_id', id)

  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) return { error: error.message }

  await deleteStorageObjects((images ?? []).map((i) => i.image_url))
  revalidateStorefront()
  redirect('/admin/products')
}

/* ------------------------------- Images --------------------------------- */
export async function addProductImage(productId: string, imageUrl: string, altText: string | null): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()

  // First image becomes primary automatically.
  const { count } = await supabase
    .from('product_images')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId)

  const { error } = await supabase.from('product_images').insert({
    product_id: productId,
    image_url: imageUrl,
    alt_text: altText,
    is_primary: (count ?? 0) === 0,
    sort_order: count ?? 0,
  })
  if (error) return { error: error.message }
  revalidatePath(`/admin/products/${productId}`)
  revalidateStorefront()
}

export async function deleteProductImage(imageId: string, productId: string): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()

  const { data: product } = await supabase.from('products').select('is_published, image_count').eq('id', productId).maybeSingle()
  if (product?.is_published && product.image_count <= 1) {
    return { error: 'A published product needs at least one photo. Add another photo first, or unpublish the product.' }
  }

  const { data: image } = await supabase.from('product_images').select('image_url').eq('id', imageId).maybeSingle()

  const { error } = await supabase.from('product_images').delete().eq('id', imageId)
  if (error) return { error: error.message }

  await deleteStorageObjects([image?.image_url])
  revalidatePath(`/admin/products/${productId}`)
  revalidateStorefront()
}

export async function setPrimaryImage(imageId: string, productId: string): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  // Unset all, then set the chosen one (partial unique index allows one primary).
  const unset = await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId)
  if (unset.error) return { error: unset.error.message }
  const { error } = await supabase.from('product_images').update({ is_primary: true }).eq('id', imageId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/products/${productId}`)
  revalidateStorefront()
}

/* --------------------------- Related products ---------------------------- */
export async function addRelatedProduct(productId: string, formData: FormData): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const relatedProductId = str(formData, 'related_product_id')
  if (!relatedProductId) return

  const supabase = createAdminSupabase()
  const { count } = await supabase
    .from('product_related')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId)

  const { error } = await supabase
    .from('product_related')
    .insert({ product_id: productId, related_product_id: relatedProductId, sort_order: count ?? 0 })
  // unique(product_id, related_product_id) — adding the same product twice is a no-op, not an error.
  if (error && error.code !== '23505') return { error: error.message }

  revalidatePath(`/admin/products/${productId}`)
  revalidateStorefront()
}

export async function removeRelatedProduct(relationId: string, productId: string): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { error } = await supabase.from('product_related').delete().eq('id', relationId)
  if (error) return { error: error.message }
  revalidatePath(`/admin/products/${productId}`)
  revalidateStorefront()
}
