'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { requireStaff } from '@/lib/supabase/auth'
import { str, int, bool } from '@/lib/admin/form'
import type { Json } from '@/lib/supabase/database.types'
import type { AboutGalleryItem } from '@/types'

function revalidateAbout() {
  revalidatePath('/admin/about')
  revalidatePath('/about')
}

/* ------------------------------- Settings -------------------------------- */
export async function updateAboutContent(formData: FormData) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { error } = await supabase.from('about_page').upsert({
    id: 1,
    story: str(formData, 'story'),
    story_title: str(formData, 'story_title'),
    story_image: str(formData, 'story_image'),
    mission: str(formData, 'mission'),
    vision: str(formData, 'vision'),
    values_text: str(formData, 'values_text'),
    hero_title: str(formData, 'hero_title'),
    hero_description: str(formData, 'hero_description'),
    hero_image: str(formData, 'hero_image'),
    seo_title: str(formData, 'seo_title'),
    seo_description: str(formData, 'seo_description'),
  })
  if (error) throw new Error(error.message)
  revalidateAbout()
}

/* --------------------------------- Gallery -------------------------------- */
// `about_page.gallery` is a JSONB array of `{image, label}` (no child table, no
// per-item id) — add/remove read-modify-write the whole array. Index-based
// removal is fine for a single-admin-at-a-time tool; every other delete in
// this codebase is by UUID, this is the one deliberate exception.
async function readGallery(supabase: ReturnType<typeof createServerSupabase>): Promise<AboutGalleryItem[]> {
  const { data } = await supabase.from('about_page').select('gallery').eq('id', 1).maybeSingle()
  return Array.isArray(data?.gallery) ? (data.gallery as unknown as AboutGalleryItem[]) : []
}

export async function addGalleryItem(formData: FormData) {
  await requireStaff('editor')
  const image = str(formData, 'image')
  if (!image) return
  const supabase = createServerSupabase()
  const gallery = await readGallery(supabase)
  gallery.push({ image, label: str(formData, 'label') ?? '' })
  const { error } = await supabase.from('about_page').update({ gallery: gallery as unknown as Json }).eq('id', 1)
  if (error) throw new Error(error.message)
  revalidateAbout()
}

export async function removeGalleryItem(index: number) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const gallery = await readGallery(supabase)
  gallery.splice(index, 1)
  const { error } = await supabase.from('about_page').update({ gallery: gallery as unknown as Json }).eq('id', 1)
  if (error) throw new Error(error.message)
  revalidateAbout()
}

/* ------------------------------- Statistics ------------------------------- */
export async function addStatistic(formData: FormData) {
  await requireStaff('editor')
  const label = str(formData, 'label')
  if (!label) return
  const supabase = createServerSupabase()
  const { error } = await supabase.from('about_statistics').insert({
    label,
    value: Number(str(formData, 'value') ?? '0'),
    suffix: str(formData, 'suffix'),
    sort_order: int(formData, 'sort_order'),
  })
  if (error) throw new Error(error.message)
  revalidateAbout()
}

export async function deleteStatistic(id: string) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { error } = await supabase.from('about_statistics').delete().eq('id', id)
  if (error) throw new Error(error.message)
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

export async function createTeamMember(formData: FormData) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { error } = await supabase.from('team_members').insert(parseTeamMember(formData))
  if (error) throw new Error(error.message)
  revalidateAbout()
  redirect('/admin/about')
}

export async function updateTeamMember(id: string, formData: FormData) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { error } = await supabase.from('team_members').update(parseTeamMember(formData)).eq('id', id)
  if (error) throw new Error(error.message)
  revalidateAbout()
  redirect('/admin/about')
}

export async function deleteTeamMember(id: string) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { error } = await supabase.from('team_members').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidateAbout()
}

export async function toggleTeamMemberActive(id: string, active: boolean) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  await supabase.from('team_members').update({ active }).eq('id', id)
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

export async function createTestimonial(formData: FormData) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { error } = await supabase.from('testimonials').insert(parseTestimonial(formData))
  if (error) throw new Error(error.message)
  revalidateAbout()
  redirect('/admin/about')
}

export async function updateTestimonial(id: string, formData: FormData) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { error } = await supabase.from('testimonials').update(parseTestimonial(formData)).eq('id', id)
  if (error) throw new Error(error.message)
  revalidateAbout()
  redirect('/admin/about')
}

export async function deleteTestimonial(id: string) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  const { error } = await supabase.from('testimonials').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidateAbout()
}

export async function toggleTestimonialActive(id: string, active: boolean) {
  await requireStaff('editor')
  const supabase = createServerSupabase()
  await supabase.from('testimonials').update({ active }).eq('id', id)
  revalidateAbout()
}
