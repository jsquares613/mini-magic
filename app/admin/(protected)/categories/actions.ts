'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
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

export async function createCategory(formData: FormData) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { data, error } = await supabase.from('categories').insert(parseCategory(formData)).select('id').single()
  if (error) throw new Error(error.message)
  revalidateStorefront()
  redirect(`/admin/categories/${data.id}`)
}

export async function updateCategory(id: string, formData: FormData) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const payload = parseCategory(formData)
  const { error } = await supabase.from('categories').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  revalidateStorefront(payload.slug)
  redirect(`/admin/categories/${id}`)
}

export async function deleteCategory(id: string) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { data: category } = await supabase.from('categories').select('image, banner_image').eq('id', id).maybeSingle()

  const { error } = await supabase.from('categories').delete().eq('id', id)
  // FK on products is ON DELETE RESTRICT — surface a friendly message.
  if (error) throw new Error('Cannot delete: this category still has products. Reassign them first.')

  await deleteStorageObjects([category?.image, category?.banner_image])
  revalidateStorefront()
  redirect('/admin/categories')
}

/** Set the category image or banner URL (called after a Storage upload). */
export async function updateCategoryImage(id: string, field: 'image' | 'banner_image', url: string | null) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { data: current } = await supabase.from('categories').select(field).eq('id', id).maybeSingle()

  const patch = field === 'image' ? { image: url } : { banner_image: url }
  const { error } = await supabase.from('categories').update(patch).eq('id', id)
  if (error) throw new Error(error.message)

  await deleteStorageObjectIfChanged(current?.[field], url)
  revalidatePath(`/admin/categories/${id}`)
  revalidateStorefront()
}

/* ----------------------------- Promotions ------------------------------ */
export async function createPromotion(categoryId: string, formData: FormData) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { error } = await supabase.from('category_promotions').insert({
    category_id: categoryId,
    title: str(formData, 'title') ?? 'Promotion',
    badge_text: str(formData, 'badge_text'),
    description: str(formData, 'description'),
    link: str(formData, 'link'),
    active: true,
    display_order: int(formData, 'display_order'),
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/categories/${categoryId}`)
  revalidateStorefront()
}

export async function deletePromotion(id: string, categoryId: string) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  await supabase.from('category_promotions').delete().eq('id', id)
  revalidatePath(`/admin/categories/${categoryId}`)
  revalidateStorefront()
}

export async function togglePromotion(id: string, categoryId: string, active: boolean) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  await supabase.from('category_promotions').update({ active }).eq('id', id)
  revalidatePath(`/admin/categories/${categoryId}`)
  revalidateStorefront()
}
