import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { isVideo } from '@/lib/media'
import ActionForm from '@/components/admin/ActionForm'
import SubmitButton from '@/components/admin/SubmitButton'
import MediaUploadField from '@/components/admin/MediaUploadField'
import { Card, EmptyState, Field, FormActions, Page, PageHeader, buttonClass, iconButtonClass, ui } from '@/components/admin/ui'
import {
  ExternalLinkIcon,
  GlobeIcon,
  HeartIcon,
  ImagesIcon,
  PencilIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
  VideoIcon,
} from '@/components/admin/icons'
import { updatePlayAreaSettings, addGalleryImage, deleteGalleryImage, deleteFeature } from './actions'

export default async function PlayAreaAdminPage() {
  const supabase = createServerSupabase()
  const [{ data: playArea }, { data: gallery }, { data: features }] = await Promise.all([
    supabase.from('play_area').select('*').eq('id', 1).maybeSingle(),
    supabase.from('play_area_gallery').select('*').order('sort_order', { ascending: true }),
    supabase.from('play_area_features').select('*').order('sort_order', { ascending: true }),
  ])

  return (
    <Page className="space-y-6">
      <PageHeader
        title="Play Area"
        description="The Play Area page: hero, house rules, gallery and why parents trust you."
        actions={
          <a href="/play-area" target="_blank" rel="noreferrer" className={buttonClass('secondary')}>
            <ExternalLinkIcon className="h-4 w-4" />
            View page
          </a>
        }
      />

      {/* Hero, rules, SEO — one settings form */}
      <ActionForm action={updatePlayAreaSettings} successMessage="Play Area settings saved successfully">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card title="Hero" description="The banner at the top of the page." icon={ImagesIcon} tone="violet">
              <div className="space-y-5">
                <MediaUploadField
                  bucket="play-area"
                  name="hero_image"
                  label="Hero media"
                  defaultUrl={playArea?.hero_image ?? null}
                  hint="1280 × 440 px — image or MP4 video"
                />
                <Field label="Title" hint="Optional.">
                  <input name="hero_title" defaultValue={playArea?.hero_title ?? ''} className={ui.input} />
                </Field>
                <Field label="Description" hint="Optional.">
                  <textarea name="hero_description" rows={3} defaultValue={playArea?.hero_description ?? ''} className={ui.input} />
                </Field>
              </div>
            </Card>

            <Card title="House rules" description="One rule per line." icon={ShieldCheckIcon} tone="green">
              <textarea name="rules" rows={5} defaultValue={(playArea?.rules ?? []).join('\n')} aria-label="House rules" className={ui.input} />
            </Card>
          </div>

          <Card title="Search engines" description="Optional — how this page appears on Google." icon={GlobeIcon} tone="gray">
            <div className="space-y-5">
              <Field label="Meta title">
                <input name="seo_title" defaultValue={playArea?.seo_title ?? ''} className={ui.input} />
              </Field>
              <Field label="Meta description">
                <textarea name="seo_description" rows={4} defaultValue={playArea?.seo_description ?? ''} className={ui.input} />
              </Field>
            </div>
          </Card>
        </div>

        <FormActions>
          <SubmitButton pendingText="Saving…" size="lg">
            Save settings
          </SubmitButton>
        </FormActions>
      </ActionForm>

      {/* Gallery */}
      <Card
        title="Gallery"
        description="Play zones shown on the page — 16:9 images or MP4 videos."
        icon={ImagesIcon}
        tone="violet"
        footer={
          <ActionForm action={addGalleryImage} successMessage="Image added successfully" className="flex flex-wrap items-end gap-4 py-2">
            <MediaUploadField bucket="play-area" name="image_url" label="New media" hint="400 × 225 px (16:9)" />
            <Field label="Caption" className="min-w-[12rem] flex-1">
              <input name="alt_text" placeholder="e.g. Ball Pit" className={ui.input} />
            </Field>
            <SubmitButton pendingText="Adding…">
              <PlusIcon className="h-4 w-4" />
              Add to gallery
            </SubmitButton>
          </ActionForm>
        }
      >
        {gallery && gallery.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {gallery.map((img) => (
              <figure key={img.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {isVideo(img.image_url) ? (
                  <span className="flex aspect-video items-center justify-center text-slate-400">
                    <VideoIcon className="h-8 w-8" />
                  </span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img.image_url} alt={img.alt_text ?? ''} className="aspect-video w-full object-cover" />
                )}
                <figcaption className="truncate border-t border-slate-100 bg-white px-3 py-2 text-xs font-medium text-slate-700">
                  {img.alt_text || 'No caption'}
                </figcaption>
                <ActionForm action={deleteGalleryImage.bind(null, img.id)} successMessage="Image deleted successfully" confirmMessage="Delete this image?">
                  <SubmitButton
                    pendingText=""
                    variant="icon-danger"
                    className="absolute right-2 top-2 bg-white/90 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span className="sr-only">Delete image</span>
                  </SubmitButton>
                </ActionForm>
              </figure>
            ))}
          </div>
        ) : (
          <EmptyState icon={ImagesIcon} title="No gallery images yet" description="Add photos or videos of the play zones below." />
        )}
      </Card>

      {/* Features (Why Parents Trust Us) */}
      <Card
        title="Why parents trust us"
        description="Reasons shown on the Play Area page."
        icon={HeartIcon}
        tone="red"
        bodyClassName="p-0"
        actions={
          <Link href="/admin/play-area/features/new" className={buttonClass('primary', 'sm')}>
            <PlusIcon className="h-3.5 w-3.5" />
            Add feature
          </Link>
        }
      >
        {features && features.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {features.map((f) => (
              <li key={f.id} className={ui.row}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-lg">{f.icon || '✨'}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{f.title}</p>
                  {f.description && <p className="truncate text-xs text-slate-500">{f.description}</p>}
                </div>
                <Link href={`/admin/play-area/features/${f.id}`} className={iconButtonClass()} title="Edit">
                  <PencilIcon className="h-4 w-4" />
                  <span className="sr-only">Edit {f.title}</span>
                </Link>
                <ActionForm action={deleteFeature.bind(null, f.id)} successMessage="Feature deleted successfully" confirmMessage="Delete this feature?">
                  <SubmitButton pendingText="" variant="icon-danger">
                    <TrashIcon className="h-4 w-4" />
                    <span className="sr-only">Delete {f.title}</span>
                  </SubmitButton>
                </ActionForm>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={HeartIcon} title="No features yet" description="Add the reasons parents love your play area." />
        )}
      </Card>
    </Page>
  )
}
