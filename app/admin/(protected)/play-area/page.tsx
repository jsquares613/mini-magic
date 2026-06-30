import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import ActionForm from '@/components/admin/ActionForm'
import SubmitButton from '@/components/admin/SubmitButton'
import ImageUploadField from '@/components/admin/ImageUploadField'
import {
  updatePlayAreaSettings,
  addGalleryImage,
  deleteGalleryImage,
  deleteFeature,
} from './actions'

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
const label = 'mb-1 block text-sm font-medium text-gray-700'

function pairListToText(value: unknown): string {
  const pairs = (value as { label: string; value: string }[]) ?? []
  return pairs.map((p) => `${p.label} | ${p.value}`).join('\n')
}

export default async function PlayAreaAdminPage() {
  const supabase = createServerSupabase()
  const [{ data: playArea }, { data: gallery }, { data: features }] = await Promise.all([
    supabase.from('play_area').select('*').eq('id', 1).maybeSingle(),
    supabase.from('play_area_gallery').select('*').order('sort_order', { ascending: true }),
    supabase.from('play_area_features').select('*').order('sort_order', { ascending: true }),
  ])

  return (
    <div className="space-y-8 p-4 md:p-8">
      <h1 className="text-2xl font-bold text-gray-900">Play Area</h1>

      {/* Hero, SEO, Timings, Pricing, Rules — one settings row */}
      <ActionForm action={updatePlayAreaSettings} successMessage="Play Area settings saved successfully">
        <div className="space-y-5">
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-bold text-gray-900">Hero Section</h2>
            <div className="space-y-4">
              <div>
                <label className={label}>Title</label>
                <input name="hero_title" defaultValue={playArea?.hero_title ?? ''} className={input} />
              </div>
              <div>
                <label className={label}>Description</label>
                <textarea
                  name="hero_description"
                  rows={3}
                  defaultValue={playArea?.hero_description ?? ''}
                  className={input}
                />
              </div>
              <ImageUploadField bucket="play-area" name="hero_image" label="Hero image" defaultUrl={playArea?.hero_image ?? null} />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-1 font-bold text-gray-900">Timings &amp; Pricing</h2>
            <p className="mb-4 text-sm text-gray-500">One per line, format: Label | Value — e.g. "Mon–Fri | 10am – 8pm"</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Timings</label>
                <textarea name="timings" rows={4} defaultValue={pairListToText(playArea?.timings)} className={input} />
              </div>
              <div>
                <label className={label}>Pricing</label>
                <textarea name="pricing" rows={4} defaultValue={pairListToText(playArea?.pricing)} className={input} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-1 font-bold text-gray-900">House Rules</h2>
            <p className="mb-4 text-sm text-gray-500">One rule per line.</p>
            <textarea name="rules" rows={4} defaultValue={(playArea?.rules ?? []).join('\n')} className={input} />
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-bold text-gray-900">SEO</h2>
            <div className="space-y-4">
              <div>
                <label className={label}>Meta title</label>
                <input name="seo_title" defaultValue={playArea?.seo_title ?? ''} className={input} />
              </div>
              <div>
                <label className={label}>Meta description</label>
                <textarea name="seo_description" rows={2} defaultValue={playArea?.seo_description ?? ''} className={input} />
              </div>
            </div>
          </section>

          <SubmitButton pendingText="Saving…" className="px-6 py-3">
            Save settings
          </SubmitButton>
        </div>
      </ActionForm>

      {/* Gallery */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-bold text-gray-900">Gallery (Play Zones)</h2>
        <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {(gallery ?? []).map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-lg border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.image_url} alt={img.alt_text ?? ''} className="aspect-square w-full object-cover" />
              <p className="truncate bg-white px-2 py-1 text-xs text-gray-600">{img.alt_text}</p>
              <ActionForm action={deleteGalleryImage.bind(null, img.id)} successMessage="Image deleted successfully" confirmMessage="Delete this image?">
                <SubmitButton pendingText="Deleting…" variant="link" className="absolute right-1 top-1 rounded-full bg-red-500 px-1.5 text-xs text-white">
                  ×
                </SubmitButton>
              </ActionForm>
            </div>
          ))}
          {(!gallery || gallery.length === 0) && <p className="text-sm text-gray-400">No images yet.</p>}
        </div>
        <ActionForm action={addGalleryImage} successMessage="Image added successfully" className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4">
          <ImageUploadField bucket="play-area" name="image_url" label="New image" />
          <div className="flex-1">
            <label className={label}>Alt text</label>
            <input name="alt_text" placeholder="e.g. Ball Pit" className={input} />
          </div>
          <SubmitButton pendingText="Adding…">Add image</SubmitButton>
        </ActionForm>
      </section>

      {/* Features (Why Parents Trust Us) */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Why Parents Trust Us</h2>
          <Link href="/admin/play-area/features/new" className="rounded-lg bg-blue-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-800">
            + Add feature
          </Link>
        </div>
        <div className="space-y-2">
          {(features ?? []).map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-2">
              <div className="min-w-0 flex-1 overflow-hidden">
                <span className="mr-1">{f.icon}</span>
                <span className="font-medium text-gray-900">{f.title}</span>{' '}
                <span className="text-sm text-gray-500">{f.description}</span>
              </div>
              <div className="flex flex-shrink-0 gap-3">
                <Link href={`/admin/play-area/features/${f.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                  Edit
                </Link>
                <ActionForm action={deleteFeature.bind(null, f.id)} successMessage="Feature deleted successfully" confirmMessage="Delete this feature?">
                  <SubmitButton pendingText="Deleting…" variant="link" className="text-sm text-red-600">
                    Delete
                  </SubmitButton>
                </ActionForm>
              </div>
            </div>
          ))}
          {(!features || features.length === 0) && <p className="text-sm text-gray-400">No features yet.</p>}
        </div>
      </section>
    </div>
  )
}
