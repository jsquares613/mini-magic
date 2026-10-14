import { createServerSupabase } from '@/lib/supabase/server'
import ProductForm from '@/components/admin/ProductForm'
import { Page, PageHeader } from '@/components/admin/ui'
import { createProduct } from '../actions'

export default async function NewProductPage() {
  const supabase = createServerSupabase()
  const [{ data: categories }, { data: ageGroups }, { data: subcategories }] = await Promise.all([
    supabase.from('categories').select('id, name').order('display_order', { ascending: true }),
    supabase.from('age_groups').select('id, label').order('sort_order', { ascending: true }),
    supabase.from('subcategories').select('id, name, emoji, category_id').order('display_order', { ascending: true }),
  ])

  return (
    <Page>
      <PageHeader
        back={{ href: '/admin/products', label: 'Products' }}
        title="New product"
        description="Add a product by hand. Products from Marg are created automatically by the sync."
      />
      <ProductForm
        action={createProduct}
        categories={categories ?? []}
        ageGroups={ageGroups ?? []}
        subcategories={subcategories ?? []}
      />
    </Page>
  )
}
