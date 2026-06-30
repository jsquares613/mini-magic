import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'

async function count(table: 'products' | 'categories' | 'enquiries', filter?: (q: any) => any) {
  const supabase = createServerSupabase()
  let q = supabase.from(table).select('*', { count: 'exact', head: true })
  if (filter) q = filter(q)
  const { count } = await q
  return count ?? 0
}

export default async function DashboardPage() {
  const supabase = createServerSupabase()

  const [products, categories, enquiriesTotal, enquiriesNew] = await Promise.all([
    count('products'),
    count('categories'),
    count('enquiries'),
    count('enquiries', (q) => q.eq('status', 'new')),
  ])

  const { data: recent } = await supabase
    .from('enquiries')
    .select('id, name, enquiry_type, status, subject, created_at')
    .order('created_at', { ascending: false })
    .limit(6)

  const stats = [
    { label: 'Products', value: products, href: '/admin/products', accent: 'text-blue-900' },
    { label: 'Categories', value: categories, href: '/admin/categories', accent: 'text-orange-500' },
    { label: 'Total Enquiries', value: enquiriesTotal, href: '/admin/enquiries', accent: 'text-green-600' },
    { label: 'New Leads', value: enquiriesNew, href: '/admin/enquiries?status=new', accent: 'text-red-500' },
  ]

  return (
    <div className="p-4 md:p-8">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mb-8 text-sm text-gray-500">Overview of your store</p>

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:shadow-md"
          >
            <p className={`text-3xl font-bold ${s.accent}`}>{s.value}</p>
            <p className="mt-1 text-sm text-gray-500">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="font-bold text-gray-900">Recent Enquiries</h2>
          <Link href="/admin/enquiries" className="text-sm font-medium text-blue-600 hover:underline">
            View all →
          </Link>
        </div>
        {recent && recent.length > 0 ? (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Subject</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((e) => (
                <tr key={e.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{e.name}</td>
                  <td className="px-6 py-3 text-gray-500">{e.enquiry_type}</td>
                  <td className="px-6 py-3 text-gray-500">{e.subject ?? '—'}</td>
                  <td className="px-6 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {e.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-400">{new Date(e.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : (
          <p className="px-6 py-10 text-center text-sm text-gray-400">No enquiries yet.</p>
        )}
      </div>
    </div>
  )
}
