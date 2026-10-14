import Link from 'next/link'
import type { Tables } from '@/lib/supabase/database.types'
import ImageUploadField from '@/components/admin/ImageUploadField'
import ActionForm from './ActionForm'
import SubmitButton from './SubmitButton'
import { Card, Field, FormActions, Switch, buttonClass, ui } from './ui'
import { EyeIcon, MessageCircleIcon } from './icons'

type Testimonial = Tables<'testimonials'>

export default function TestimonialForm({
  action,
  testimonial,
}: {
  action: (formData: FormData) => unknown | Promise<unknown>
  testimonial?: Testimonial
}) {
  return (
    <ActionForm action={action} successMessage={testimonial ? 'Testimonial updated successfully' : 'Testimonial created successfully'}>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Testimonial" icon={MessageCircleIcon} tone="violet">
          <div className="space-y-5">
            <Field label="Quote" required>
              <textarea name="quote" required rows={4} defaultValue={testimonial?.quote} className={ui.input} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Author name" required>
                <input name="author_name" required defaultValue={testimonial?.author_name} className={ui.input} />
              </Field>
              <Field label="Author role">
                <input name="author_role" placeholder="e.g. Parent of two" defaultValue={testimonial?.author_role ?? ''} className={ui.input} />
              </Field>
            </div>
            <ImageUploadField
              bucket="about"
              name="image"
              label="Photo (optional)"
              defaultUrl={testimonial?.image ?? null}
              hint="400 × 400 px, square"
            />
          </div>
        </Card>

        <Card title="Visibility" icon={EyeIcon}>
          <div className="space-y-5">
            <Switch name="active" defaultChecked={testimonial?.active ?? true} label="Show on website" />
            <Field label="Rating" hint="1 to 5 stars.">
              <input name="rating" type="number" min={1} max={5} defaultValue={testimonial?.rating ?? 5} className={ui.input} />
            </Field>
            <Field label="Display order" hint="Lower numbers show first.">
              <input name="display_order" type="number" defaultValue={testimonial?.display_order ?? 0} className={ui.input} />
            </Field>
          </div>
        </Card>
      </div>

      <FormActions>
        <Link href="/admin/about" className={buttonClass('ghost')}>
          Cancel
        </Link>
        <SubmitButton pendingText={testimonial ? 'Saving…' : 'Creating…'} size="lg">
          {testimonial ? 'Save testimonial' : 'Create testimonial'}
        </SubmitButton>
      </FormActions>
    </ActionForm>
  )
}
