import type { Tables } from '@/lib/supabase/database.types'
import ImageUploadField from '@/components/admin/ImageUploadField'
import ActionForm from './ActionForm'
import SubmitButton from './SubmitButton'
import { toDateTimeInputValue } from '@/lib/admin/form'

type Banner = Tables<'promotional_banners'>

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
const label = 'mb-1 block text-sm font-medium text-gray-700'

export default function BannerForm({
  action,
  banner,
}: {
  action: (formData: FormData) => void | Promise<void>
  banner?: Banner
}) {
  return (
    <ActionForm
      action={action}
      successMessage={banner ? 'Banner updated successfully' : 'Banner created successfully'}
      className="max-w-2xl space-y-5"
    >
      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
        <div>
          <label className={label}>Title *</label>
          <input name="title" required defaultValue={banner?.title} className={input} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Subtitle</label>
            <input name="subtitle" defaultValue={banner?.subtitle ?? ''} className={input} />
          </div>
          <div>
            <label className={label}>Badge (e.g. &ldquo;40% Off&rdquo;)</label>
            <input name="badge_text" defaultValue={banner?.badge_text ?? ''} className={input} />
          </div>
        </div>
        <div>
          <label className={label}>Link</label>
          <input name="link" defaultValue={banner?.link ?? ''} placeholder="/categories/toys" className={input} />
        </div>
        <ImageUploadField
          bucket="banners"
          name="image"
          label="Banner image"
          defaultUrl={banner?.image ?? null}
          aspectRatio={2}
          hint="1200 × 600px (2:1) — shown roughly square on mobile and wide on desktop; keep the subject/text centered so both crops work"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Display order</label>
            <input name="display_order" type="number" defaultValue={banner?.display_order ?? 0} className={input} />
          </div>
          <label className="mt-6 flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="active" defaultChecked={banner?.active ?? true} /> Active
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
        <div>
          <h3 className="font-bold text-gray-900">Scheduling</h3>
          <p className="text-sm text-gray-500">Optional — leave blank to show whenever &ldquo;Active&rdquo; is checked.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Starts at</label>
            <input
              name="starts_at"
              type="datetime-local"
              defaultValue={toDateTimeInputValue(banner?.starts_at ?? null)}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Ends at</label>
            <input
              name="ends_at"
              type="datetime-local"
              defaultValue={toDateTimeInputValue(banner?.ends_at ?? null)}
              className={input}
            />
          </div>
        </div>
      </section>

      <SubmitButton pendingText={banner ? 'Saving…' : 'Creating…'} className="px-6 py-3">
        {banner ? 'Save banner' : 'Create banner'}
      </SubmitButton>
    </ActionForm>
  )
}
