'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminSupabase } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/supabase/auth'
import { deleteStorageObjectIfChanged, deleteStorageObjects } from '@/lib/supabase/storage'
import { slugify } from '@/lib/format'
import { str, int, bool } from '@/lib/admin/form'
import type { TablesInsert } from '@/lib/supabase/database.types'

function parseCategory(fd: FormData): TablesInsert<'categories'> {
  const name = str(fd, 'name') ?? 'Untitled'
  return {
    name,
    slug: str(fd, 'slug') || slugify(name),
    description: str(fd, 'description'),
    emoji: str(fd, 'emoji'),
    color: str(fd, 'color'),
    featured: bool(fd, 'featured'),
    display_order: int(fd, 'display_order'),
    seo_title: str(fd, 'seo_title'),
    seo_description: str(fd, 'seo_description'),
  }
}

function revalidateStorefront(slug?: string) {
  revalidatePath('/admin/categories')
  revalidatePath('/')
  revalidatePath('/categories')
  if (slug) revalidatePath(`/categories/${slug}`)
}

export async function createCategory(formData: FormData): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { data, error } = await supabase.from('categories').insert(parseCategory(formData)).select('id').single()
  if (error) return { error: error.message }
  revalidateStorefront()
  redirect(`/admin/categories/${data.id}`)
}

export async function updateCategory(id: string, formData: FormData): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const payload = parseCategory(formData)
  const { error } = await supabase.from('categories').update(payload).eq('id', id)
  if (error) return { error: error.message }
  revalidateStorefront(payload.slug)
  redirect(`/admin/categories/${id}`)
}

export async function deleteCategory(id: string): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { data: category } = await supabase.from('categories').select('image, banner_image').eq('id', id).maybeSingle()

  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) {
    // 23503 = Postgres foreign_key_violation — products still reference
    // this category (on delete restrict). Any other error is unexpected.
    if (error.code === '23503') {
      return { error: 'Cannot delete: this category still has products. Reassign them first.' }
    }
    return { error: error.message }
  }

  await deleteStorageObjects([category?.image, category?.banner_image])
  revalidateStorefront()
  redirect('/admin/categories')
}

/** Show/hide a category in the homepage rail, straight from the list. */
export async function setCategoryFeatured(id: string, featured: boolean): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { error } = await supabase.from('categories').update({ featured }).eq('id', id)
  if (error) return { error: error.message }
  revalidateStorefront()
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Save a new display order (`ids` top to bottom). Steps of 10 leave room to
 * slot a category in between by hand from its edit page.
 */
export async function reorderCategories(ids: string[]): Promise<{ error: string } | void> {
  await requireStaff('editor')
  if (!ids.length || ids.some((id) => !UUID.test(id)) || new Set(ids).size !== ids.length) {
    return { error: 'Invalid category order.' }
  }
  const supabase = createAdminSupabase()
  const results = await Promise.all(
    ids.map((id, i) => supabase.from('categories').update({ display_order: (i + 1) * 10 }).eq('id', id)),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }
  revalidateStorefront()
}

/** Set the category image or banner URL (called after a Storage upload). */
export async function updateCategoryImage(id: string, field: 'image' | 'banner_image', url: string | null): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { data: current } = await supabase.from('categories').select(field).eq('id', id).maybeSingle()

  const patch = field === 'image' ? { image: url } : { banner_image: url }
  const { error } = await supabase.from('categories').update(patch).eq('id', id)
  if (error) return { error: error.message }

  await deleteStorageObjectIfChanged(current?.[field], url)
  revalidatePath(`/admin/categories/${id}`)
  revalidateStorefront()
}

/* ----------------------------- Promotions ------------------------------ */
export async function createPromotion(categoryId: string, formData: FormData): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { error } = await supabase.from('category_promotions').insert({
    category_id: categoryId,
    title: str(formData, 'title') ?? 'Promotion',
    badge_text: str(formData, 'badge_text'),
    description: str(formData, 'description'),
    link: str(formData, 'link'),
    active: true,
    display_order: int(formData, 'display_order'),
  })
  if (error) return { error: error.message }
  revalidatePath(`/admin/categories/${categoryId}`)
  revalidateStorefront()
}

export async function deletePromotion(id: string, categoryId: string): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { error } = await supabase.from('category_promotions').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/admin/categories/${categoryId}`)
  revalidateStorefront()
}

export async function togglePromotion(id: string, categoryId: string, active: boolean): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { error } = await supabase.from('category_promotions').update({ active }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/admin/categories/${categoryId}`)
  revalidateStorefront()
}

/* --------------------------- Subcategories ----------------------------- */
export async function createSubcategory(categoryId: string, formData: FormData): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const name = str(formData, 'name') ?? 'Subcategory'
  const { error } = await supabase.from('subcategories').insert({
    category_id: categoryId,
    name,
    slug: slugify(name),
    emoji: str(formData, 'emoji'),
    display_order: int(formData, 'display_order'),
  })
  if (error) return { error: error.message }
  revalidatePath(`/admin/categories/${categoryId}`)
  revalidateStorefront()
}

export async function updateSubcategory(id: string, categoryId: string, formData: FormData): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const name = str(formData, 'name') ?? 'Subcategory'
  const { error } = await supabase.from('subcategories').update({
    name,
    slug: slugify(name),
    emoji: str(formData, 'emoji'),
    display_order: int(formData, 'display_order'),
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/admin/categories/${categoryId}`)
  revalidateStorefront()
}

export async function deleteSubcategory(id: string, categoryId: string): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { error } = await supabase.from('subcategories').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/admin/categories/${categoryId}`)
  revalidateStorefront()
}
