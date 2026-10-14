import CategoryForm from '@/components/admin/CategoryForm'
import { Page, PageHeader } from '@/components/admin/ui'
import { createCategory } from '../actions'

export default function NewCategoryPage() {
  return (
    <Page>
      <PageHeader
        back={{ href: '/admin/categories', label: 'Categories' }}
        title="New category"
        description="Save the category first, then add its image, banner, subcategories and promotions."
      />
      <CategoryForm action={createCategory} />
    </Page>
  )
}
