import type { Tables } from '@/lib/supabase/database.types'
import ImageUploadField from '@/components/admin/ImageUploadField'
import ActionForm from './ActionForm'
import SubmitButton from './SubmitButton'

type TeamMember = Tables<'team_members'>

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
const label = 'mb-1 block text-sm font-medium text-gray-700'

export default function TeamMemberForm({
  action,
  member,
}: {
  action: (formData: FormData) => void | Promise<void>
  member?: TeamMember
}) {
  return (
    <ActionForm
      action={action}
      successMessage={member ? 'Team member updated successfully' : 'Team member created successfully'}
      className="max-w-2xl space-y-5"
    >
      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Name *</label>
            <input name="name" required defaultValue={member?.name} className={input} />
          </div>
          <div>
            <label className={label}>Designation</label>
            <input name="designation" defaultValue={member?.designation ?? ''} className={input} />
          </div>
        </div>
        <div>
          <label className={label}>Bio</label>
          <textarea name="bio" rows={3} defaultValue={member?.bio ?? ''} className={input} />
        </div>
        <ImageUploadField bucket="about" name="image" label="Photo" defaultUrl={member?.image ?? null} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Display order</label>
            <input name="display_order" type="number" defaultValue={member?.display_order ?? 0} className={input} />
          </div>
          <label className="mt-6 flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="active" defaultChecked={member?.active ?? true} /> Active
          </label>
        </div>
      </section>

      <SubmitButton pendingText={member ? 'Saving…' : 'Creating…'} className="px-6 py-3">
        {member ? 'Save team member' : 'Create team member'}
      </SubmitButton>
    </ActionForm>
  )
}
