import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import TeamMemberForm from '@/components/admin/TeamMemberForm'
import { Page, PageHeader } from '@/components/admin/ui'
import { updateTeamMember } from '../../actions'

export default async function PageTeamMemberFormEdit({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const { data: member } = await supabase.from('team_members').select('*').eq('id', params.id).maybeSingle()
  if (!member) notFound()

  return (
    <Page>
      <PageHeader back={{ href: '/admin/about', label: 'About Us' }} title="Edit team member" description="Shown in the team section of the About page." />
      <TeamMemberForm action={updateTeamMember.bind(null, member.id)} member={member} />
    </Page>
  )
}
