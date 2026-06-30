import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/format'

export default async function AdminProductsPage() {
  const supabase = createServerSupabase()
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*').order('display_order', { ascending: true }),
    supabase.from('categories').select('id, name'),
  ])

  const catName = new Map((categories ?? []).map((c) => [c.id, c.name]))

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">{products?.length ?? 0} products</p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          + New Product
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium">Price</th>
              <th className="px-6 py-3 font-medium">Flags</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((p) => (
              <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-6 py-3 text-gray-500">{catName.get(p.category_id) ?? '—'}</td>
                <td className="px-6 py-3 text-gray-700">
                  {p.price_display === 'show' && p.price != null ? (
                    <>
                      {p.sale_price != null ? (
                        <span className="font-semibold text-green-600">{formatPrice(p.sale_price)}</span>
                      ) : (
                        formatPrice(p.price)
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">{p.price_display}</span>
                  )}
                </td>
                <td className="px-6 py-3">
                  <div className="flex gap-1">
                    {p.popular && <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700">Popular</span>}
                    {p.new_arrival && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">New</span>}
                  </div>
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {p.available ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <Link href={`/admin/products/${p.id}`} className="font-medium text-blue-600 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  No products yet. Create your first one.
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
