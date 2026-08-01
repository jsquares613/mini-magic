'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/supabase/auth'
import { deleteStorageObjectIfChanged, deleteStorageObjects } from '@/lib/supabase/storage'
import { str, int, bool, dateTime } from '@/lib/admin/form'

function revalidateHome() {
  revalidatePath('/admin/homepage')
  revalidatePath('/')
}

/* ------------------------------ Hero slides ----------------------------- */
function parseHero(fd: FormData) {
  return {
    title: str(fd, 'title') ?? '',
    subtitle: str(fd, 'subtitle'),
    description: str(fd, 'description'),
    image: str(fd, 'image'),
    button_text: str(fd, 'button_text'),
    button_link: str(fd, 'button_link'),
    display_order: int(fd, 'display_order'),
    active: bool(fd, 'active'),
  }
}

export async function createHeroSlide(formData: FormData) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { error } = await supabase.from('homepage_hero_slides').insert(parseHero(formData))
  if (error) throw new Error(error.message)
  revalidateHome()
  redirect('/admin/homepage')
}

export async function updateHeroSlide(id: string, formData: FormData) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { data: current } = await supabase.from('homepage_hero_slides').select('image').eq('id', id).maybeSingle()

  const payload = parseHero(formData)
  const { error } = await supabase.from('homepage_hero_slides').update(payload).eq('id', id)
  if (error) throw new Error(error.message)

  await deleteStorageObjectIfChanged(current?.image, payload.image)
  revalidateHome()
  redirect('/admin/homepage')
}

export async function deleteHeroSlide(id: string) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { data: slide } = await supabase.from('homepage_hero_slides').select('image').eq('id', id).maybeSingle()

  await supabase.from('homepage_hero_slides').delete().eq('id', id)

  await deleteStorageObjects([slide?.image])
  revalidateHome()
}

/* --------------------------- Featured products -------------------------- */
export async function addFeaturedProduct(formData: FormData) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const productId = str(formData, 'product_id')
  if (!productId) return
  const { count } = await supabase.from('homepage_featured_products').select('*', { count: 'exact', head: true })
  await supabase
    .from('homepage_featured_products')
    .insert({ product_id: productId, sort_order: count ?? 0 })
  revalidateHome()
}

export async function removeFeaturedProduct(id: string) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  await supabase.from('homepage_featured_products').delete().eq('id', id)
  revalidateHome()
}

/* --------------------------- Promotional banners ------------------------ */
function parseBanner(fd: FormData) {
  return {
    title: str(fd, 'title') ?? 'Untitled',
    subtitle: str(fd, 'subtitle'),
    badge_text: str(fd, 'badge_text'),
    image: str(fd, 'image'),
    link: str(fd, 'link'),
    display_order: int(fd, 'display_order'),
    active: bool(fd, 'active'),
    starts_at: dateTime(fd, 'starts_at'),
    ends_at: dateTime(fd, 'ends_at'),
  }
}

export async function createBanner(formData: FormData) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { error } = await supabase.from('promotional_banners').insert(parseBanner(formData))
  if (error) throw new Error(error.message)
  revalidateHome()
  redirect('/admin/homepage')
}

export async function updateBanner(id: string, formData: FormData) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { data: current } = await supabase.from('promotional_banners').select('image').eq('id', id).maybeSingle()

  const payload = parseBanner(formData)
  const { error } = await supabase.from('promotional_banners').update(payload).eq('id', id)
  if (error) throw new Error(error.message)

  await deleteStorageObjectIfChanged(current?.image, payload.image)
  revalidateHome()
  redirect('/admin/homepage')
}

export async function deleteBanner(id: string) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { data: banner } = await supabase.from('promotional_banners').select('image').eq('id', id).maybeSingle()

  await supabase.from('promotional_banners').delete().eq('id', id)

  await deleteStorageObjects([banner?.image])
  revalidateHome()
}

export async function toggleBanner(id: string, active: boolean) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  await supabase.from('promotional_banners').update({ active }).eq('id', id)
  revalidateHome()
}
