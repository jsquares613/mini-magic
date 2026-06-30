'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/supabase/auth'
import { str, int, bool, lineList, pairList } from '@/lib/admin/form'

function revalidatePlayArea() {
  revalidatePath('/admin/play-area')
  revalidatePath('/play-area')
}

/* ------------------------------- Settings -------------------------------- */
export async function updatePlayAreaSettings(formData: FormData) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('play_area')
    .upsert({
      id: 1,
      hero_title: str(formData, 'hero_title'),
      hero_description: str(formData, 'hero_description'),
      hero_image: str(formData, 'hero_image'),
      timings: pairList(formData, 'timings'),
      pricing: pairList(formData, 'pricing'),
      rules: lineList(formData, 'rules'),
      seo_title: str(formData, 'seo_title'),
      seo_description: str(formData, 'seo_description'),
    })
  if (error) throw new Error(error.message)
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
  const { error } = await supabase.from('play_area_gallery').delete().eq('id', id)
  if (error) throw new Error(error.message)
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
