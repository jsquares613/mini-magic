import Link from 'next/link'
import TeamMemberForm from '@/components/admin/TeamMemberForm'
import { createTeamMember } from '../../actions'

export default function NewTeamMemberPage() {
  return (
    <div className="p-4 md:p-8">
      <Link href="/admin/about" className="text-sm text-blue-600 hover:underline">
        ← About Us
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-gray-900">New Team Member</h1>
      <TeamMemberForm action={createTeamMember} />
    </div>
  )
}
