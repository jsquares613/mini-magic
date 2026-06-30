'use client'

import { deleteCategory } from '@/app/admin/(protected)/categories/actions'
import ActionForm from './ActionForm'
import SubmitButton from './SubmitButton'

export default function DeleteCategoryButton({ id }: { id: string }) {
  return (
    <ActionForm
      action={deleteCategory.bind(null, id)}
      successMessage="Category deleted successfully"
      confirmMessage="Delete this category?"
    >
      <SubmitButton pendingText="Deleting…" variant="danger">
        Delete category
      </SubmitButton>
    </ActionForm>
  )
}
