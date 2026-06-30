import type { Tables } from '@/lib/supabase/database.types'
import ImageUploadField from '@/components/admin/ImageUploadField'
import ActionForm from './ActionForm'
import SubmitButton from './SubmitButton'

type Testimonial = Tables<'testimonials'>

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
const label = 'mb-1 block text-sm font-medium text-gray-700'

export default function TestimonialForm({
  action,
  testimonial,
}: {
  action: (formData: FormData) => void | Promise<void>
  testimonial?: Testimonial
}) {
  return (
    <ActionForm
      action={action}
      successMessage={testimonial ? 'Testimonial updated successfully' : 'Testimonial created successfully'}
      className="max-w-2xl space-y-5"
    >
      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Author name *</label>
            <input name="author_name" required defaultValue={testimonial?.author_name} className={input} />
          </div>
          <div>
            <label className={label}>Author role</label>
            <input
              name="author_role"
              placeholder="e.g. Parent of two"
              defaultValue={testimonial?.author_role ?? ''}
              className={input}
            />
          </div>
        </div>
        <div>
          <label className={label}>Quote *</label>
          <textarea name="quote" required rows={3} defaultValue={testimonial?.quote} className={input} />
        </div>
        <ImageUploadField bucket="about" name="image" label="Photo (optional)" defaultUrl={testimonial?.image ?? null} />
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={label}>Rating (1–5)</label>
            <input
              name="rating"
              type="number"
              min={1}
              max={5}
              defaultValue={testimonial?.rating ?? 5}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Display order</label>
            <input name="display_order" type="number" defaultValue={testimonial?.display_order ?? 0} className={input} />
          </div>
          <label className="mt-6 flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="active" defaultChecked={testimonial?.active ?? true} /> Active
          </label>
        </div>
      </section>

      <SubmitButton pendingText={testimonial ? 'Saving…' : 'Creating…'} className="px-6 py-3">
        {testimonial ? 'Save testimonial' : 'Create testimonial'}
      </SubmitButton>
    </ActionForm>
  )
}
