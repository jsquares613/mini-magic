import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { isVideo } from '@/lib/media'
import ActionForm from '@/components/admin/ActionForm'
import SubmitButton from '@/components/admin/SubmitButton'
import MediaUploadField from '@/components/admin/MediaUploadField'
import AdminImage from '@/components/admin/AdminImage'
import { Avatar, Badge, Card, EmptyState, Field, FormActions, Page, PageHeader, buttonClass, iconButtonClass, ui } from '@/components/admin/ui'
import {
  BarChartIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  FileTextIcon,
  GlobeIcon,
  HeartIcon,
  ImagesIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
  VideoIcon,
} from '@/components/admin/icons'
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

export default async function AboutAdminPage() {
  const supabase = createServerSupabase()
  const [{ data: about }, { data: statistics }, { data: team }] = await Promise.all([
    supabase.from('about_page').select('*').eq('id', 1).maybeSingle(),
    supabase.from('about_statistics').select('*').order('sort_order', { ascending: true }),
    supabase.from('team_members').select('*').order('display_order', { ascending: true }),
  ])

  const gallery = (about?.gallery as unknown as AboutGalleryItem[]) ?? []

  return (
    <Page className="space-y-6">
      <PageHeader
        title="About Us"
        description="Your story, numbers, team and gallery on the About page."
        actions={
          <a href="/about" target="_blank" rel="noreferrer" className={buttonClass('secondary')}>
            <ExternalLinkIcon className="h-4 w-4" />
            View page
          </a>
        }
      />

      {/* Story, Mission, Vision, Values, SEO */}
      <ActionForm action={updateAboutContent} successMessage="About page saved successfully">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card title="Hero" description="The banner at the top of the page." icon={ImagesIcon} tone="violet">
              <div className="space-y-5">
                <MediaUploadField
                  bucket="about"
                  name="hero_image"
                  label="Hero media"
                  defaultUrl={about?.hero_image ?? null}
                  hint="1280 × 440 px — image or MP4 video"
                />
                <Field label="Title" hint="Optional.">
                  <input name="hero_title" defaultValue={about?.hero_title ?? ''} className={ui.input} />
                </Field>
                <Field label="Description" hint="Optional.">
                  <textarea name="hero_description" rows={3} defaultValue={about?.hero_description ?? ''} className={ui.input} />
                </Field>
              </div>
            </Card>

            <Card
              title="Our story"
              description="Leave the title or image blank to keep the default heading and illustration."
              icon={FileTextIcon}
            >
              <div className="space-y-5">
                <Field label="Story title">
                  <input name="story_title" placeholder="Born from a love of play" defaultValue={about?.story_title ?? ''} className={ui.input} />
                </Field>
                <Field label="Story">
                  <textarea name="story" rows={5} defaultValue={about?.story ?? ''} className={ui.input} />
                </Field>
                <MediaUploadField
                  bucket="about"
                  name="story_image"
                  label="Story image"
                  defaultUrl={about?.story_image ?? null}
                  hint="640 × 480 px (4:3) — beside the story on desktop, full-width on mobile"
                />
              </div>
            </Card>

            <Card title="What drives us" icon={HeartIcon} tone="red">
              <div className="space-y-5">
                <Field label="Mission">
                  <textarea name="mission" rows={2} defaultValue={about?.mission ?? ''} className={ui.input} />
                </Field>
                <Field label="Vision">
                  <textarea name="vision" rows={2} defaultValue={about?.vision ?? ''} className={ui.input} />
                </Field>
                <Field label="Values">
                  <textarea name="values_text" rows={2} defaultValue={about?.values_text ?? ''} className={ui.input} />
                </Field>
              </div>
            </Card>
          </div>

          <Card title="Search engines" description="Optional — how this page appears on Google." icon={GlobeIcon} tone="gray">
            <div className="space-y-5">
              <Field label="Meta title">
                <input name="seo_title" defaultValue={about?.seo_title ?? ''} className={ui.input} />
              </Field>
              <Field label="Meta description">
                <textarea name="seo_description" rows={4} defaultValue={about?.seo_description ?? ''} className={ui.input} />
              </Field>
            </div>
          </Card>
        </div>

        <FormActions>
          <SubmitButton pendingText="Saving…" size="lg">
            Save changes
          </SubmitButton>
        </FormActions>
      </ActionForm>

      {/* Statistics */}
      <Card
        title="Statistics"
        description="Big numbers such as “5,000+ happy families”."
        icon={BarChartIcon}
        tone="blue"
        footer={
          <ActionForm action={addStatistic} successMessage="Statistic added successfully" className="grid gap-2 py-1 sm:grid-cols-[1fr_8rem_6rem_auto]">
            <input name="label" required placeholder="Label, e.g. Happy Families" aria-label="Label" className={ui.input} />
            <input name="value" type="number" step="any" required placeholder="Value" aria-label="Value" className={ui.input} />
            <input name="suffix" placeholder="Suffix" aria-label="Suffix" className={ui.input} />
            <SubmitButton pendingText="Adding…">
              <PlusIcon className="h-4 w-4" />
              Add
            </SubmitButton>
          </ActionForm>
        }
      >
        {statistics && statistics.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {statistics.map((s) => (
              <div key={s.id} className="group relative rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                <p className="text-2xl font-semibold tabular-nums text-slate-900">
                  {s.value.toLocaleString('en-IN')}
                  {s.suffix}
                </p>
                <p className="truncate text-sm text-slate-500">{s.label}</p>
                <ActionForm action={deleteStatistic.bind(null, s.id)} successMessage="Statistic deleted successfully">
                  <SubmitButton pendingText="" variant="icon-danger" className="absolute right-2 top-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    <TrashIcon className="h-4 w-4" />
                    <span className="sr-only">Delete {s.label}</span>
                  </SubmitButton>
                </ActionForm>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No statistics yet.</p>
        )}
      </Card>

      {/* Team Members */}
      <Card
        title="Team"
        description="People shown in the team section."
        icon={UsersIcon}
        tone="teal"
        bodyClassName="p-0"
        actions={
          <Link href="/admin/about/team/new" className={buttonClass('primary', 'sm')}>
            <PlusIcon className="h-3.5 w-3.5" />
            Add member
          </Link>
        }
      >
        {team && team.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {team.map((m) => (
              <li key={m.id} className={ui.row}>
                {m.image ? (
                  <AdminImage src={m.image} width={40} className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-slate-200" />
                ) : (
                  <Avatar name={m.name} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-slate-900">{m.name}</span>
                    {!m.active && <Badge tone="gray">Hidden</Badge>}
                  </div>
                  {m.designation && <p className="truncate text-xs text-slate-500">{m.designation}</p>}
                </div>
                <ActionForm
                  action={toggleTeamMemberActive.bind(null, m.id, !m.active)}
                  successMessage={m.active ? 'Team member hidden' : 'Team member shown'}
                >
                  <SubmitButton pendingText="" variant="icon">
                    {m.active ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    <span className="sr-only">{m.active ? 'Hide' : 'Show'} {m.name}</span>
                  </SubmitButton>
                </ActionForm>
                <Link prefetch={false} href={`/admin/about/team/${m.id}`} className={iconButtonClass()} title="Edit">
                  <PencilIcon className="h-4 w-4" />
                  <span className="sr-only">Edit {m.name}</span>
                </Link>
                <ActionForm action={deleteTeamMember.bind(null, m.id)} successMessage="Team member deleted successfully" confirmMessage="Delete this team member?">
                  <SubmitButton pendingText="" variant="icon-danger">
                    <TrashIcon className="h-4 w-4" />
                    <span className="sr-only">Delete {m.name}</span>
                  </SubmitButton>
                </ActionForm>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={UsersIcon} title="No team members yet" description="Introduce the people behind Minimagic." />
        )}
      </Card>

      {/* Gallery */}
      <Card
        title="Gallery"
        description="Square images or MP4 videos."
        icon={ImagesIcon}
        tone="violet"
        footer={
          <ActionForm action={addGalleryItem} successMessage="Image added successfully" className="flex flex-wrap items-end gap-4 py-2">
            <MediaUploadField bucket="about" name="image" label="New media" hint="400 × 400 px (square)" />
            <Field label="Label" className="min-w-[12rem] flex-1">
              <input name="label" placeholder="e.g. Plush Toys" className={ui.input} />
            </Field>
            <SubmitButton pendingText="Adding…">
              <PlusIcon className="h-4 w-4" />
              Add to gallery
            </SubmitButton>
          </ActionForm>
        }
      >
        {gallery.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            {gallery.map((item, index) => (
              <figure key={`${item.image}-${index}`} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {isVideo(item.image) ? (
                  <span className="flex aspect-square items-center justify-center text-slate-400">
                    <VideoIcon className="h-8 w-8" />
                  </span>
                ) : (
                  <AdminImage src={item.image} alt={item.label} width={220} className="aspect-square w-full object-cover" />
                )}
                <figcaption className="truncate border-t border-slate-100 bg-white px-3 py-2 text-xs font-medium text-slate-700">
                  {item.label || 'No label'}
                </figcaption>
                <ActionForm action={removeGalleryItem.bind(null, index)} successMessage="Image removed successfully" confirmMessage="Remove this image?">
                  <SubmitButton
                    pendingText=""
                    variant="icon-danger"
                    className="absolute right-2 top-2 bg-white/90 shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span className="sr-only">Remove image</span>
                  </SubmitButton>
                </ActionForm>
              </figure>
            ))}
          </div>
        ) : (
          <EmptyState icon={ImagesIcon} title="No gallery images yet" description="Add photos or videos below." />
        )}
      </Card>
    </Page>
  )
}
