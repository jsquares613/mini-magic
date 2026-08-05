import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import ProductForm from '@/components/admin/ProductForm'
import { createProduct } from '../actions'

export default async function NewProductPage() {
  const supabase = createServerSupabase()
  const [{ data: categories }, { data: ageGroups }, { data: subcategories }] = await Promise.all([
    supabase.from('categories').select('id, name').order('display_order', { ascending: true }),
    supabase.from('age_groups').select('id, label').order('sort_order', { ascending: true }),
    supabase.from('subcategories').select('id, name, emoji, category_id').order('display_order', { ascending: true }),
  ])

  return (
    <div className="p-4 md:p-8">
      <Link href="/admin/products" className="text-sm text-blue-600 hover:underline">
        ← Products
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-gray-900">New Product</h1>
      <ProductForm
        action={createProduct}
        categories={categories ?? []}
        ageGroups={ageGroups ?? []}
        subcategories={subcategories ?? []}
      />
    </div>
  )
}
