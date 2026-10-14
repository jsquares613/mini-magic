'use client'

import { deleteCategory } from '@/app/admin/(protected)/categories/actions'
import ActionForm from './ActionForm'
import SubmitButton from './SubmitButton'
import { TrashIcon } from './icons'

export default function DeleteCategoryButton({ id }: { id: string }) {
  return (
    <ActionForm
      action={deleteCategory.bind(null, id)}
      successMessage="Category deleted successfully"
      confirmMessage="Delete this category?"
    >
      <SubmitButton pendingText="Deleting…" variant="danger">
        <TrashIcon className="h-4 w-4" />
        Delete
      </SubmitButton>
    </ActionForm>
  )
}
