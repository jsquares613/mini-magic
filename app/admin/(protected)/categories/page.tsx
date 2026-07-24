import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'

export default async function AdminCategoriesPage() {
  const supabase = createServerSupabase()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, emoji, image, featured, display_order')
    .order('display_order', { ascending: true })

  // product counts per category
  const { data: products } = await supabase.from('products').select('category_id')
  const counts = new Map<string, number>()
  for (const p of products ?? []) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1)

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">{categories?.length ?? 0} categories</p>
        </div>
        <Link href="/admin/categories/new" className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
          + New Category
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-6 py-3 font-medium"></th>
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium">Slug</th>
              <th className="px-6 py-3 font-medium">Products</th>
              <th className="px-6 py-3 font-medium">Featured</th>
              <th className="px-6 py-3 font-medium">Order</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(categories ?? []).map((c) => (
              <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-6 py-3">
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt="" className="h-9 w-9 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-lg">{c.emoji}</span>
                  )}
                </td>
                <td className="px-6 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-6 py-3 text-gray-500">{c.slug}</td>
                <td className="px-6 py-3 text-gray-700">{counts.get(c.id) ?? 0}</td>
                <td className="px-6 py-3">{c.featured ? '⭐' : '—'}</td>
                <td className="px-6 py-3 text-gray-500">{c.display_order}</td>
                <td className="px-6 py-3 text-right">
                  <Link href={`/admin/categories/${c.id}`} className="font-medium text-blue-600 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {(!categories || categories.length === 0) && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                  No categories yet.
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
