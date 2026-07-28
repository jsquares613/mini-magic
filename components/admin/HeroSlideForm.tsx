import type { Tables } from '@/lib/supabase/database.types'
import ImageUploadField from '@/components/admin/ImageUploadField'
import ActionForm from './ActionForm'
import SubmitButton from './SubmitButton'

type HeroSlide = Tables<'homepage_hero_slides'>

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
const label = 'mb-1 block text-sm font-medium text-gray-700'

export default function HeroSlideForm({
  action,
  slide,
}: {
  action: (formData: FormData) => void | Promise<void>
  slide?: HeroSlide
}) {
  return (
    <ActionForm
      action={action}
      successMessage={slide ? 'Hero slide updated successfully' : 'Hero slide created successfully'}
      className="max-w-2xl space-y-5"
    >
      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
        <div>
          <label className={label}>Title *</label>
          <input name="title" required defaultValue={slide?.title} className={input} />
        </div>
        <div>
          <label className={label}>Subtitle / badge</label>
          <input name="subtitle" defaultValue={slide?.subtitle ?? ''} className={input} />
        </div>
        <div>
          <label className={label}>Description</label>
          <textarea name="description" rows={3} defaultValue={slide?.description ?? ''} className={input} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Button text</label>
            <input name="button_text" defaultValue={slide?.button_text ?? ''} className={input} />
          </div>
          <div>
            <label className={label}>Button link</label>
            <input name="button_link" defaultValue={slide?.button_link ?? ''} placeholder="/categories" className={input} />
          </div>
        </div>
        <ImageUploadField
          bucket="hero"
          name="image"
          label="Slide image"
          defaultUrl={slide?.image ?? null}
          hint="1600 × 600px (wide banner) — fills edge-to-edge on both mobile and desktop; crops a little tighter on mobile, so keep the subject centered"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Display order</label>
            <input name="display_order" type="number" defaultValue={slide?.display_order ?? 0} className={input} />
          </div>
          <label className="mt-6 flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="active" defaultChecked={slide?.active ?? true} /> Active
          </label>
        </div>
      </section>

      <SubmitButton pendingText={slide ? 'Saving…' : 'Creating…'} className="px-6 py-3">
        {slide ? 'Save slide' : 'Create slide'}
      </SubmitButton>
    </ActionForm>
  )
}
