'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/supabase/auth'
import { deleteStorageObjectIfChanged, deleteStorageObjects } from '@/lib/supabase/storage'
import { str, int, lineList } from '@/lib/admin/form'

function revalidatePlayArea() {
  revalidatePath('/admin/play-area')
  revalidatePath('/play-area')
}

/* ------------------------------- Settings -------------------------------- */
export async function updatePlayAreaSettings(formData: FormData) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { data: current } = await supabase.from('play_area').select('hero_image').eq('id', 1).maybeSingle()

  const heroImage = str(formData, 'hero_image')
  const { error } = await supabase
    .from('play_area')
    .upsert({
      id: 1,
      hero_title: str(formData, 'hero_title'),
      hero_description: str(formData, 'hero_description'),
      hero_image: heroImage,
      rules: lineList(formData, 'rules'),
      seo_title: str(formData, 'seo_title'),
      seo_description: str(formData, 'seo_description'),
    })
  if (error) throw new Error(error.message)

  await deleteStorageObjectIfChanged(current?.hero_image, heroImage)
  revalidatePlayArea()
}

/* -------------------------------- Gallery --------------------------------- */
export async function addGalleryImage(formData: FormData) {
  await requireStaff('editor')
  const imageUrl = str(formData, 'image_url')
  if (!imageUrl) return
  const supabase = createServerSupabase()
  const { count } = await supabase.from('play_area_gallery').select('*', { count: 'exact', head: true })
  const { error } = await supabase
    .from('play_area_gallery')
    .insert({ image_url: imageUrl, alt_text: str(formData, 'alt_text'), sort_order: count ?? 0 })
  if (error) throw new Error(error.message)
  revalidatePlayArea()
}

export async function deleteGalleryImage(id: string) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { data: image } = await supabase.from('play_area_gallery').select('image_url').eq('id', id).maybeSingle()

  const { error } = await supabase.from('play_area_gallery').delete().eq('id', id)
  if (error) throw new Error(error.message)

  await deleteStorageObjects([image?.image_url])
  revalidatePlayArea()
}

/* -------------------------------- Features -------------------------------- */
function parseFeature(fd: FormData) {
  return {
    icon: str(fd, 'icon'),
    title: str(fd, 'title') ?? 'Untitled',
    description: str(fd, 'description'),
    sort_order: int(fd, 'sort_order'),
  }
}

export async function createFeature(formData: FormData) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { error } = await supabase.from('play_area_features').insert(parseFeature(formData))
  if (error) throw new Error(error.message)
  revalidatePlayArea()
  redirect('/admin/play-area')
}

export async function updateFeature(id: string, formData: FormData) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { error } = await supabase.from('play_area_features').update(parseFeature(formData)).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePlayArea()
  redirect('/admin/play-area')
}

export async function deleteFeature(id: string) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { error } = await supabase.from('play_area_features').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePlayArea()
}
