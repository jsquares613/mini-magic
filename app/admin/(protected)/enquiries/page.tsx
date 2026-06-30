import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'

const STATUSES = ['all', 'new', 'contacted', 'in_progress', 'converted', 'lost'] as const

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-red-100 text-red-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-gray-100 text-gray-500',
}

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string }
}) {
  const supabase = createServerSupabase()
  let query = supabase.from('enquiries').select('*').order('created_at', { ascending: false })
  if (searchParams.status && searchParams.status !== 'all') query = query.eq('status', searchParams.status as never)
  if (searchParams.type) query = query.eq('enquiry_type', searchParams.type as never)
  const { data: enquiries } = await query

  const activeStatus = searchParams.status ?? 'all'

  return (
    <div className="p-4 md:p-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Enquiries</h1>
      <p className="mb-6 text-sm text-gray-500">{enquiries?.length ?? 0} leads</p>

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={s === 'all' ? '/admin/enquiries' : `/admin/enquiries?status=${s}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              activeStatus === s ? 'bg-blue-900 text-white' : 'border border-gray-200 bg-white text-gray-600'
            }`}
          >
            {s.replace('_', ' ')}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Type</th>
              <th className="px-6 py-3 font-medium">Subject</th>
              <th className="px-6 py-3 font-medium">Channel</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {(enquiries ?? []).map((e) => (
              <tr key={e.id} className="cursor-pointer border-t border-gray-50 hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">
                  <Link href={`/admin/enquiries/${e.id}`} className="hover:underline">
                    {e.name}
                  </Link>
                  <div className="text-xs text-gray-400">{e.phone}</div>
                </td>
                <td className="px-6 py-3 text-gray-500">{e.enquiry_type}</td>
                <td className="px-6 py-3 text-gray-500">{e.subject ?? '—'}</td>
                <td className="px-6 py-3 text-gray-500">{e.channel}</td>
                <td className="px-6 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[e.status] ?? 'bg-gray-100'}`}>
                    {e.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-400">{new Date(e.created_at).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
            {(!enquiries || enquiries.length === 0) && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  No enquiries{activeStatus !== 'all' ? ` with status “${activeStatus}”` : ''}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
