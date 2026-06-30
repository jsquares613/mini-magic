import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import TeamMemberForm from '@/components/admin/TeamMemberForm'
import { updateTeamMember } from '../../actions'

export default async function EditTeamMemberPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const { data: member } = await supabase.from('team_members').select('*').eq('id', params.id).maybeSingle()
  if (!member) notFound()

  return (
    <div className="p-4 md:p-8">
      <Link href="/admin/about" className="text-sm text-blue-600 hover:underline">
        ← About Us
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-gray-900">Edit Team Member</h1>
      <TeamMemberForm action={updateTeamMember.bind(null, member.id)} member={member} />
    </div>
  )
}
