import TeamMemberForm from '@/components/admin/TeamMemberForm'
import { Page, PageHeader } from '@/components/admin/ui'
import { createTeamMember } from '../../actions'

export default function PageTeamMemberFormNew() {
  return (
    <Page>
      <PageHeader back={{ href: '/admin/about', label: 'About Us' }} title="New team member" description="Shown in the team section of the About page." />
      <TeamMemberForm action={createTeamMember} />
    </Page>
  )
}
