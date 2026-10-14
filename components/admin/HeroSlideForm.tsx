import Link from 'next/link'
import type { Tables } from '@/lib/supabase/database.types'
import MediaUploadField from '@/components/admin/MediaUploadField'
import ActionForm from './ActionForm'
import SubmitButton from './SubmitButton'
import { Card, Field, FormActions, Switch, buttonClass, ui } from './ui'
import { EyeIcon, FileTextIcon, ImagesIcon } from './icons'

type HeroSlide = Tables<'homepage_hero_slides'>

export default function HeroSlideForm({
  action,
  slide,
}: {
  action: (formData: FormData) => unknown | Promise<unknown>
  slide?: HeroSlide
}) {
  return (
    <ActionForm action={action} successMessage={slide ? 'Hero slide updated successfully' : 'Hero slide created successfully'}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Media" description="An image or MP4 video, 1280 × 440 px." icon={ImagesIcon} tone="violet">
            <MediaUploadField bucket="hero" name="image" label="Slide media" defaultUrl={slide?.image ?? null} hint="1280 × 440 px — image or MP4 video" />
          </Card>

          <Card title="Text & button" description="Optional — leave blank for an image-only slide." icon={FileTextIcon}>
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Title">
                  <input name="title" defaultValue={slide?.title ?? ''} className={ui.input} />
                </Field>
                <Field label="Subtitle / badge">
                  <input name="subtitle" defaultValue={slide?.subtitle ?? ''} className={ui.input} />
                </Field>
              </div>
              <Field label="Description">
                <textarea name="description" rows={3} defaultValue={slide?.description ?? ''} className={ui.input} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Button text">
                  <input name="button_text" defaultValue={slide?.button_text ?? ''} className={ui.input} />
                </Field>
                <Field label="Button link">
                  <input name="button_link" defaultValue={slide?.button_link ?? ''} placeholder="/categories" className={ui.input} />
                </Field>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Visibility" icon={EyeIcon}>
          <div className="space-y-5">
            <Switch name="active" defaultChecked={slide?.active ?? true} label="Show on homepage" />
            <Field label="Display order" hint="Lower numbers show first.">
              <input name="display_order" type="number" defaultValue={slide?.display_order ?? 0} className={ui.input} />
            </Field>
          </div>
        </Card>
      </div>

      <FormActions>
        <Link href="/admin/homepage" className={buttonClass('ghost')}>
          Cancel
        </Link>
        <SubmitButton pendingText={slide ? 'Saving…' : 'Creating…'} size="lg">
          {slide ? 'Save slide' : 'Create slide'}
        </SubmitButton>
      </FormActions>
    </ActionForm>
  )
}
