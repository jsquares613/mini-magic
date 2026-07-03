import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import ActionForm from '@/components/admin/ActionForm'
import SubmitButton from '@/components/admin/SubmitButton'
import ImageUploadField from '@/components/admin/ImageUploadField'
import {
  updateAboutContent,
  addGalleryItem,
  removeGalleryItem,
  addStatistic,
  deleteStatistic,
  deleteTeamMember,
  toggleTeamMemberActive,
} from './actions'
import type { AboutGalleryItem } from '@/types'

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
const label = 'mb-1 block text-sm font-medium text-gray-700'

export default async function AboutAdminPage() {
  const supabase = createServerSupabase()
  const [{ data: about }, { data: statistics }, { data: team }] = await Promise.all([
    supabase.from('about_page').select('*').eq('id', 1).maybeSingle(),
    supabase.from('about_statistics').select('*').order('sort_order', { ascending: true }),
    supabase.from('team_members').select('*').order('display_order', { ascending: true }),
  ])

  const gallery = (about?.gallery as unknown as AboutGalleryItem[]) ?? []

  return (
    <div className="space-y-8 p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900">About Us</h1>

      {/* Story, Mission, Vision, Values, SEO */}
      <ActionForm action={updateAboutContent} successMessage="About page saved successfully">
        <div className="space-y-5">
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-1 font-bold text-gray-900">Hero Section</h2>
            <p className="mb-4 text-sm text-gray-500">
              Leave title blank to keep the default rotating hero from the codebase.
            </p>
            <div className="space-y-4">
              <div>
                <label className={label}>Title</label>
                <input name="hero_title" defaultValue={about?.hero_title ?? ''} className={input} />
              </div>
              <div>
                <label className={label}>Description</label>
                <textarea
                  name="hero_description"
                  rows={3}
                  defaultValue={about?.hero_description ?? ''}
                  className={input}
                />
              </div>
              <ImageUploadField bucket="about" name="hero_image" label="Hero image" defaultUrl={about?.hero_image ?? null} />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-1 font-bold text-gray-900">Our Story</h2>
            <p className="mb-4 text-sm text-gray-500">
              Leave title blank to keep the default heading; leave image blank to keep the default illustration.
            </p>
            <div className="space-y-4">
              <div>
                <label className={label}>Story title</label>
                <input
                  name="story_title"
                  placeholder="Born from a love of play"
                  defaultValue={about?.story_title ?? ''}
                  className={input}
                />
              </div>
              <div>
                <label className={label}>Story description</label>
                <textarea name="story" rows={4} defaultValue={about?.story ?? ''} className={input} />
              </div>
              <ImageUploadField bucket="about" name="story_image" label="Story image" defaultUrl={about?.story_image ?? null} />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-bold text-gray-900">What Drives Us</h2>
            <div className="space-y-4">
              <div>
                <label className={label}>Mission</label>
                <textarea name="mission" rows={2} defaultValue={about?.mission ?? ''} className={input} />
              </div>
              <div>
                <label className={label}>Vision</label>
                <textarea name="vision" rows={2} defaultValue={about?.vision ?? ''} className={input} />
              </div>
              <div>
                <label className={label}>Values</label>
                <textarea name="values_text" rows={2} defaultValue={about?.values_text ?? ''} className={input} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-bold text-gray-900">SEO</h2>
            <div className="space-y-4">
              <div>
                <label className={label}>Meta title</label>
                <input name="seo_title" defaultValue={about?.seo_title ?? ''} className={input} />
              </div>
              <div>
                <label className={label}>Meta description</label>
                <textarea name="seo_description" rows={2} defaultValue={about?.seo_description ?? ''} className={input} />
              </div>
            </div>
          </section>

          <SubmitButton pendingText="Saving…" className="px-6 py-3">
            Save settings
          </SubmitButton>
        </div>
      </ActionForm>

      {/* Statistics */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-bold text-gray-900">Statistics</h2>
        <div className="mb-4 space-y-2">
          {(statistics ?? []).map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-2">
              <span className="min-w-0 flex-1 truncate font-medium text-gray-900">
                {s.value}
                {s.suffix} — {s.label}
              </span>
              <ActionForm action={deleteStatistic.bind(null, s.id)} successMessage="Statistic deleted successfully">
                <SubmitButton pendingText="Deleting…" variant="link" className="text-sm text-red-600">
                  Delete
                </SubmitButton>
              </ActionForm>
            </div>
          ))}
          {(!statistics || statistics.length === 0) && <p className="text-sm text-gray-400">No statistics yet.</p>}
        </div>
        <ActionForm action={addStatistic} successMessage="Statistic added successfully" className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-4">
          <input name="label" required placeholder="Label (e.g. Happy Families)" className={input} />
          <input name="value" type="number" step="any" required placeholder="Value" className={input} />
          <input name="suffix" placeholder="Suffix (e.g. +)" className={input} />
          <SubmitButton pendingText="Adding…">Add</SubmitButton>
        </ActionForm>
      </section>

      {/* Team Members */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Team Members</h2>
          <Link href="/admin/about/team/new" className="rounded-lg bg-blue-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-800">
            + Add team member
          </Link>
        </div>
        <div className="space-y-2">
          {(team ?? []).map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-2">
              <div className="min-w-0 flex-1 overflow-hidden">
                <span className="font-medium text-gray-900">{m.name}</span>{' '}
                <span className="text-sm text-gray-500">{m.designation}</span>
                {!m.active && <span className="ml-2 text-xs text-gray-400">(inactive)</span>}
              </div>
              <div className="flex flex-shrink-0 gap-3">
                <ActionForm action={toggleTeamMemberActive.bind(null, m.id, !m.active)} successMessage={m.active ? 'Team member disabled' : 'Team member enabled'}>
                  <SubmitButton pendingText="Working…" variant="link" className="text-sm text-blue-600">
                    {m.active ? 'Disable' : 'Enable'}
                  </SubmitButton>
                </ActionForm>
                <Link href={`/admin/about/team/${m.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                  Edit
                </Link>
                <ActionForm action={deleteTeamMember.bind(null, m.id)} successMessage="Team member deleted successfully" confirmMessage="Delete this team member?">
                  <SubmitButton pendingText="Deleting…" variant="link" className="text-sm text-red-600">
                    Delete
                  </SubmitButton>
                </ActionForm>
              </div>
            </div>
          ))}
          {(!team || team.length === 0) && <p className="text-sm text-gray-400">No team members yet.</p>}
        </div>
      </section>

      {/* Gallery */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-bold text-gray-900">Gallery</h2>
        <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {gallery.map((item, index) => (
            <div key={`${item.image}-${index}`} className="group relative overflow-hidden rounded-lg border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt={item.label} className="aspect-square w-full object-cover" />
              <p className="truncate bg-white px-2 py-1 text-xs text-gray-600">{item.label}</p>
              <ActionForm action={removeGalleryItem.bind(null, index)} successMessage="Image removed successfully" confirmMessage="Remove this image?">
                <SubmitButton pendingText="Removing…" variant="link" className="absolute right-1 top-1 rounded-full bg-red-500 px-1.5 text-xs text-white">
                  ×
                </SubmitButton>
              </ActionForm>
            </div>
          ))}
          {gallery.length === 0 && <p className="text-sm text-gray-400">No images yet.</p>}
        </div>
        <ActionForm action={addGalleryItem} successMessage="Image added successfully" className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4">
          <ImageUploadField bucket="about" name="image" label="New image" />
          <div className="flex-1">
            <label className={label}>Label</label>
            <input name="label" placeholder="e.g. Plush Toys" className={input} />
          </div>
          <SubmitButton pendingText="Adding…">Add image</SubmitButton>
        </ActionForm>
      </section>
    </div>
  )
}
