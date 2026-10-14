import Link from 'next/link'
import type { Tables } from '@/lib/supabase/database.types'
import ActionForm from './ActionForm'
import SubmitButton from './SubmitButton'
import { Card, Field, FormActions, buttonClass, ui } from './ui'
import { HeartIcon } from './icons'

type PlayAreaFeature = Tables<'play_area_features'>

export default function FeatureForm({
  action,
  feature,
}: {
  action: (formData: FormData) => unknown | Promise<unknown>
  feature?: PlayAreaFeature
}) {
  return (
    <ActionForm action={action} successMessage={feature ? 'Feature updated successfully' : 'Feature created successfully'}>
      <Card className="max-w-3xl" title="Feature" description="Shown under “Why parents trust us” on the Play Area page." icon={HeartIcon} tone="red">
        <div className="space-y-5">
          <Field label="Title" required>
            <input name="title" required defaultValue={feature?.title} className={ui.input} />
          </Field>
          <Field label="Description">
            <textarea name="description" rows={3} defaultValue={feature?.description ?? ''} className={ui.input} />
          </Field>
          <Field label="Display order" hint="Lower numbers show first." className="sm:max-w-xs">
            <input name="sort_order" type="number" defaultValue={feature?.sort_order ?? 0} className={ui.input} />
          </Field>
        </div>
      </Card>

      <FormActions>
        <Link href="/admin/play-area" className={buttonClass('ghost')}>
          Cancel
        </Link>
        <SubmitButton pendingText={feature ? 'Saving…' : 'Creating…'} size="lg">
          {feature ? 'Save feature' : 'Create feature'}
        </SubmitButton>
      </FormActions>
    </ActionForm>
  )
}
