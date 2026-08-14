'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminSupabase } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/supabase/auth'
import { deleteStorageObjectIfChanged, deleteStorageObjects } from '@/lib/supabase/storage'
import { str, int, bool } from '@/lib/admin/form'
import type { Json } from '@/lib/supabase/database.types'
import type { AboutGalleryItem } from '@/types'

function revalidateAbout() {
  revalidatePath('/admin/about')
  revalidatePath('/about')
}

/* ------------------------------- Settings -------------------------------- */
export async function updateAboutContent(formData: FormData): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { data: current } = await supabase
    .from('about_page')
    .select('story_image, hero_image')
    .eq('id', 1)
    .maybeSingle()

  const storyImage = str(formData, 'story_image')
  const heroImage = str(formData, 'hero_image')
  const { error } = await supabase.from('about_page').upsert({
    id: 1,
    story: str(formData, 'story'),
    story_title: str(formData, 'story_title'),
    story_image: storyImage,
    mission: str(formData, 'mission'),
    vision: str(formData, 'vision'),
    values_text: str(formData, 'values_text'),
    hero_title: str(formData, 'hero_title'),
    hero_description: str(formData, 'hero_description'),
    hero_image: heroImage,
    seo_title: str(formData, 'seo_title'),
    seo_description: str(formData, 'seo_description'),
  })
  if (error) return { error: error.message }

  await deleteStorageObjectIfChanged(current?.story_image, storyImage)
  await deleteStorageObjectIfChanged(current?.hero_image, heroImage)
  revalidateAbout()
}

/* --------------------------------- Gallery -------------------------------- */
// `about_page.gallery` is a JSONB array of `{image, label}` (no child table, no
// per-item id) — add/remove read-modify-write the whole array. Index-based
// removal is fine for a single-admin-at-a-time tool; every other delete in
// this codebase is by UUID, this is the one deliberate exception.
async function readGallery(supabase: ReturnType<typeof createAdminSupabase>): Promise<AboutGalleryItem[]> {
  const { data } = await supabase.from('about_page').select('gallery').eq('id', 1).maybeSingle()
  return Array.isArray(data?.gallery) ? (data.gallery as unknown as AboutGalleryItem[]) : []
}

export async function addGalleryItem(formData: FormData): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const image = str(formData, 'image')
  if (!image) return
  const supabase = createAdminSupabase()
  const gallery = await readGallery(supabase)
  gallery.push({ image, label: str(formData, 'label') ?? '' })
  const { error } = await supabase.from('about_page').update({ gallery: gallery as unknown as Json }).eq('id', 1)
  if (error) return { error: error.message }
  revalidateAbout()
}

export async function removeGalleryItem(index: number): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const gallery = await readGallery(supabase)
  const [removed] = gallery.splice(index, 1)
  const { error } = await supabase.from('about_page').update({ gallery: gallery as unknown as Json }).eq('id', 1)
  if (error) return { error: error.message }

  await deleteStorageObjects([removed?.image])
  revalidateAbout()
}

/* ------------------------------- Statistics ------------------------------- */
export async function addStatistic(formData: FormData): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const label = str(formData, 'label')
  if (!label) return
  const supabase = createAdminSupabase()
  const { error } = await supabase.from('about_statistics').insert({
    label,
    value: Number(str(formData, 'value') ?? '0'),
    suffix: str(formData, 'suffix'),
    sort_order: int(formData, 'sort_order'),
  })
  if (error) return { error: error.message }
  revalidateAbout()
}

export async function deleteStatistic(id: string): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { error } = await supabase.from('about_statistics').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidateAbout()
}

/* ------------------------------ Team members ------------------------------ */
function parseTeamMember(fd: FormData) {
  return {
    name: str(fd, 'name') ?? 'Untitled',
    designation: str(fd, 'designation'),
    bio: str(fd, 'bio'),
    image: str(fd, 'image'),
    display_order: int(fd, 'display_order'),
    active: bool(fd, 'active'),
  }
}

export async function createTeamMember(formData: FormData): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { error } = await supabase.from('team_members').insert(parseTeamMember(formData))
  if (error) return { error: error.message }
  revalidateAbout()
  redirect('/admin/about')
}

export async function updateTeamMember(id: string, formData: FormData): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { data: current } = await supabase.from('team_members').select('image').eq('id', id).maybeSingle()

  const payload = parseTeamMember(formData)
  const { error } = await supabase.from('team_members').update(payload).eq('id', id)
  if (error) return { error: error.message }

  await deleteStorageObjectIfChanged(current?.image, payload.image)
  revalidateAbout()
  redirect('/admin/about')
}

export async function deleteTeamMember(id: string): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { data: member } = await supabase.from('team_members').select('image').eq('id', id).maybeSingle()

  const { error } = await supabase.from('team_members').delete().eq('id', id)
  if (error) return { error: error.message }

  await deleteStorageObjects([member?.image])
  revalidateAbout()
}

export async function toggleTeamMemberActive(id: string, active: boolean): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { error } = await supabase.from('team_members').update({ active }).eq('id', id)
  if (error) return { error: error.message }
  revalidateAbout()
}

/* ------------------------------- Testimonials ------------------------------ */
function parseTestimonial(fd: FormData) {
  return {
    author_name: str(fd, 'author_name') ?? 'Anonymous',
    author_role: str(fd, 'author_role'),
    quote: str(fd, 'quote') ?? '',
    rating: int(fd, 'rating', 5),
    image: str(fd, 'image'),
    display_order: int(fd, 'display_order'),
    active: bool(fd, 'active'),
  }
}

export async function createTestimonial(formData: FormData): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { error } = await supabase.from('testimonials').insert(parseTestimonial(formData))
  if (error) return { error: error.message }
  revalidateAbout()
  redirect('/admin/about')
}

export async function updateTestimonial(id: string, formData: FormData): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { data: current } = await supabase.from('testimonials').select('image').eq('id', id).maybeSingle()

  const payload = parseTestimonial(formData)
  const { error } = await supabase.from('testimonials').update(payload).eq('id', id)
  if (error) return { error: error.message }

  await deleteStorageObjectIfChanged(current?.image, payload.image)
  revalidateAbout()
  redirect('/admin/about')
}

export async function deleteTestimonial(id: string): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { data: testimonial } = await supabase.from('testimonials').select('image').eq('id', id).maybeSingle()

  const { error } = await supabase.from('testimonials').delete().eq('id', id)
  if (error) return { error: error.message }

  await deleteStorageObjects([testimonial?.image])
  revalidateAbout()
}

export async function toggleTestimonialActive(id: string, active: boolean): Promise<{ error: string } | void> {
  await requireStaff('editor')
  const supabase = createAdminSupabase()
  const { error } = await supabase.from('testimonials').update({ active }).eq('id', id)
  if (error) return { error: error.message }
  revalidateAbout()
}
