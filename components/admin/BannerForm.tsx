import Link from 'next/link'
import type { Tables } from '@/lib/supabase/database.types'
import MediaUploadField from '@/components/admin/MediaUploadField'
import ActionForm from './ActionForm'
import SubmitButton from './SubmitButton'
import { Card, Field, FormActions, Switch, buttonClass, ui } from './ui'
import { CalendarIcon, EyeIcon, MegaphoneIcon } from './icons'
import { toDateTimeInputValue } from '@/lib/admin/form'

type Banner = Tables<'promotional_banners'>

export default function BannerForm({
  action,
  banner,
}: {
  action: (formData: FormData) => unknown | Promise<unknown>
  banner?: Banner
}) {
  return (
    <ActionForm action={action} successMessage={banner ? 'Banner updated successfully' : 'Banner created successfully'}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Banner" description="What the offer block says and where it links." icon={MegaphoneIcon} tone="red">
            <div className="space-y-5">
              <Field label="Title" required>
                <input name="title" required defaultValue={banner?.title} className={ui.input} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Subtitle">
                  <input name="subtitle" defaultValue={banner?.subtitle ?? ''} className={ui.input} />
                </Field>
                <Field label="Badge" hint="e.g. “40% Off”">
                  <input name="badge_text" defaultValue={banner?.badge_text ?? ''} className={ui.input} />
                </Field>
              </div>
              <Field label="Link">
                <input name="link" defaultValue={banner?.link ?? ''} placeholder="/categories/toys" className={ui.input} />
              </Field>
              <MediaUploadField
                bucket="banners"
                name="image"
                label="Banner media"
                defaultUrl={banner?.image ?? null}
                aspectRatio={2}
                hint="640 × 220 px — image or MP4 video"
              />
            </div>
          </Card>

          <Card title="Schedule" description="Optional — leave blank to show it whenever it's switched on." icon={CalendarIcon} tone="blue">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Starts">
                <input name="starts_at" type="datetime-local" defaultValue={toDateTimeInputValue(banner?.starts_at ?? null)} className={ui.input} />
              </Field>
              <Field label="Ends">
                <input name="ends_at" type="datetime-local" defaultValue={toDateTimeInputValue(banner?.ends_at ?? null)} className={ui.input} />
              </Field>
            </div>
          </Card>
        </div>

        <Card title="Visibility" icon={EyeIcon}>
          <div className="space-y-5">
            <Switch name="active" defaultChecked={banner?.active ?? true} label="Show on homepage" />
            <Field label="Display order" hint="Lower numbers show first.">
              <input name="display_order" type="number" defaultValue={banner?.display_order ?? 0} className={ui.input} />
            </Field>
          </div>
        </Card>
      </div>

      <FormActions>
        <Link href="/admin/homepage" className={buttonClass('ghost')}>
          Cancel
        </Link>
        <SubmitButton pendingText={banner ? 'Saving…' : 'Creating…'} size="lg">
          {banner ? 'Save banner' : 'Create banner'}
        </SubmitButton>
      </FormActions>
    </ActionForm>
  )
}
