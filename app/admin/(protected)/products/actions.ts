'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/supabase/auth'
import { deleteStorageObjects } from '@/lib/supabase/storage'
import { slugify } from '@/lib/format'
import type { TablesInsert } from '@/lib/supabase/database.types'

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

function parseProduct(fd: FormData): TablesInsert<'products'> {
  const name = str(fd, 'name') ?? 'Untitled'
  return {
    name,
    slug: str(fd, 'slug') || slugify(name),
    sku: str(fd, 'sku'),
    short_description: str(fd, 'short_description'),
    description: str(fd, 'description'),
    category_id: str(fd, 'category_id') ?? '',
    price: num(fd, 'price'),
    sale_price: num(fd, 'sale_price'),
    price_display: (str(fd, 'price_display') as 'show' | 'hide' | 'enquire') ?? 'show',
    material: str(fd, 'material'),
    color: str(fd, 'color'),
    available: bool(fd, 'available'),
    tags: commaList(fd, 'tags'),
    features: lineList(fd, 'features'),
    popular: bool(fd, 'popular'),
    new_arrival: bool(fd, 'new_arrival'),
    display_order: num(fd, 'display_order') ?? 0,
    seo_title: str(fd, 'seo_title'),
    seo_description: str(fd, 'seo_description'),
  }
}

async function syncAgeGroups(productId: string, ageGroupIds: string[]) {
  const supabase = createServerSupabase()
  await supabase.from('product_age_groups').delete().eq('product_id', productId)
  if (ageGroupIds.length) {
    await supabase
      .from('product_age_groups')
      .insert(ageGroupIds.map((age_group_id) => ({ product_id: productId, age_group_id })))
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
 *  upload any images staged on the create form before navigating away. */
export async function createProduct(formData: FormData): Promise<string> {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const payload = parseProduct(formData)

  const { data, error } = await supabase.from('products').insert(payload).select('id').single()
  if (error) throw new Error(error.message)

  await syncAgeGroups(data.id, formData.getAll('age_group_ids').map(String))
  revalidateStorefront(payload.slug)
  return data.id
}

export async function updateProduct(id: string, formData: FormData) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const payload = parseProduct(formData)

  const { error } = await supabase.from('products').update(payload).eq('id', id)
  if (error) throw new Error(error.message)

  await syncAgeGroups(id, formData.getAll('age_group_ids').map(String))
  revalidateStorefront(payload.slug)
  redirect(`/admin/products/${id}`)
}

export async function deleteProduct(id: string) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { data: images } = await supabase.from('product_images').select('image_url').eq('product_id', id)

  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await deleteStorageObjects((images ?? []).map((i) => i.image_url))
  revalidateStorefront()
  redirect('/admin/products')
}

/* ------------------------------- Images --------------------------------- */
export async function addProductImage(productId: string, imageUrl: string, altText: string | null) {
  await requireStaff('editor')
  const supabase = createServerSupabase()

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
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/products/${productId}`)
  revalidateStorefront()
}

export async function deleteProductImage(imageId: string, productId: string) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { data: image } = await supabase.from('product_images').select('image_url').eq('id', imageId).maybeSingle()

  const { error } = await supabase.from('product_images').delete().eq('id', imageId)
  if (error) throw new Error(error.message)

  await deleteStorageObjects([image?.image_url])
  revalidatePath(`/admin/products/${productId}`)
  revalidateStorefront()
}

export async function setPrimaryImage(imageId: string, productId: string) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  // Unset all, then set the chosen one (partial unique index allows one primary).
  await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId)
  const { error } = await supabase.from('product_images').update({ is_primary: true }).eq('id', imageId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/products/${productId}`)
  revalidateStorefront()
}

/* --------------------------- Related products ---------------------------- */
export async function addRelatedProduct(productId: string, formData: FormData) {
  await requireStaff('editor')
  const relatedProductId = str(formData, 'related_product_id')
  if (!relatedProductId) return

  const supabase = createServerSupabase()
  const { count } = await supabase
    .from('product_related')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId)

  const { error } = await supabase
    .from('product_related')
    .insert({ product_id: productId, related_product_id: relatedProductId, sort_order: count ?? 0 })
  // unique(product_id, related_product_id) — adding the same product twice is a no-op, not an error.
  if (error && error.code !== '23505') throw new Error(error.message)

  revalidatePath(`/admin/products/${productId}`)
  revalidateStorefront()
}

export async function removeRelatedProduct(relationId: string, productId: string) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { error } = await supabase.from('product_related').delete().eq('id', relationId)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/products/${productId}`)
  revalidateStorefront()
}
