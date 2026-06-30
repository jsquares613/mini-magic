import Link from 'next/link'
import CategoryForm from '@/components/admin/CategoryForm'
import { createCategory } from '../actions'

export default function NewCategoryPage() {
  return (
    <div className="p-4 md:p-8">
      <Link href="/admin/categories" className="text-sm text-blue-600 hover:underline">
        ← Categories
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-gray-900">New Category</h1>
      <CategoryForm action={createCategory} />
      <p className="mt-4 max-w-2xl text-sm text-gray-500">
        Save the category first, then re-open it to upload an image/banner and add promotions.
      </p>
    </div>
  )
}
