import Link from 'next/link'
import type { Tables } from '@/lib/supabase/database.types'
import ImageUploadField from '@/components/admin/ImageUploadField'
import ActionForm from './ActionForm'
import SubmitButton from './SubmitButton'
import { Card, Field, FormActions, Switch, buttonClass, ui } from './ui'
import { EyeIcon, UserIcon } from './icons'

type TeamMember = Tables<'team_members'>

export default function TeamMemberForm({
  action,
  member,
}: {
  action: (formData: FormData) => unknown | Promise<unknown>
  member?: TeamMember
}) {
  return (
    <ActionForm action={action} successMessage={member ? 'Team member updated successfully' : 'Team member created successfully'}>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Profile" icon={UserIcon} tone="teal">
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name" required>
                <input name="name" required defaultValue={member?.name} className={ui.input} />
              </Field>
              <Field label="Designation">
                <input name="designation" defaultValue={member?.designation ?? ''} placeholder="e.g. Founder" className={ui.input} />
              </Field>
            </div>
            <Field label="Bio">
              <textarea name="bio" rows={4} defaultValue={member?.bio ?? ''} className={ui.input} />
            </Field>
            <ImageUploadField
              bucket="about"
              name="image"
              label="Photo"
              defaultUrl={member?.image ?? null}
              hint="600 × 600 px, square"
            />
          </div>
        </Card>

        <Card title="Visibility" icon={EyeIcon}>
          <div className="space-y-5">
            <Switch name="active" defaultChecked={member?.active ?? true} label="Show on About page" />
            <Field label="Display order" hint="Lower numbers show first.">
              <input name="display_order" type="number" defaultValue={member?.display_order ?? 0} className={ui.input} />
            </Field>
          </div>
        </Card>
      </div>

      <FormActions>
        <Link href="/admin/about" className={buttonClass('ghost')}>
          Cancel
        </Link>
        <SubmitButton pendingText={member ? 'Saving…' : 'Creating…'} size="lg">
          {member ? 'Save team member' : 'Create team member'}
        </SubmitButton>
      </FormActions>
    </ActionForm>
  )
}
