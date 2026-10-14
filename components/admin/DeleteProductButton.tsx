'use client'

import { deleteProduct } from '@/app/admin/(protected)/products/actions'
import ActionForm from './ActionForm'
import SubmitButton from './SubmitButton'
import { TrashIcon } from './icons'

export default function DeleteProductButton({ id }: { id: string }) {
  return (
    <ActionForm
      action={deleteProduct.bind(null, id)}
      successMessage="Product deleted successfully"
      confirmMessage="Delete this product? This cannot be undone."
    >
      <SubmitButton pendingText="Deleting…" variant="danger">
        <TrashIcon className="h-4 w-4" />
        Delete
      </SubmitButton>
    </ActionForm>
  )
}
