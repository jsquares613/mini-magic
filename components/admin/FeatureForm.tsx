import type { Tables } from '@/lib/supabase/database.types'
import ActionForm from './ActionForm'
import SubmitButton from './SubmitButton'

type PlayAreaFeature = Tables<'play_area_features'>

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
const label = 'mb-1 block text-sm font-medium text-gray-700'

export default function FeatureForm({
  action,
  feature,
}: {
  action: (formData: FormData) => void | Promise<void>
  feature?: PlayAreaFeature
}) {
  return (
    <ActionForm
      action={action}
      successMessage={feature ? 'Feature updated successfully' : 'Feature created successfully'}
      className="max-w-2xl space-y-5"
    >
      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
        <div>
          <label className={label}>Icon</label>
          <input name="icon" placeholder="e.g. 🛡️" defaultValue={feature?.icon ?? ''} className={input} />
        </div>
        <div>
          <label className={label}>Title *</label>
          <input name="title" required defaultValue={feature?.title} className={input} />
        </div>
        <div>
          <label className={label}>Description</label>
          <textarea name="description" rows={3} defaultValue={feature?.description ?? ''} className={input} />
        </div>
        <div>
          <label className={label}>Display order</label>
          <input name="sort_order" type="number" defaultValue={feature?.sort_order ?? 0} className={input} />
        </div>
      </section>

      <SubmitButton pendingText={feature ? 'Saving…' : 'Creating…'} className="px-6 py-3">
        {feature ? 'Save feature' : 'Create feature'}
      </SubmitButton>
    </ActionForm>
  )
}
