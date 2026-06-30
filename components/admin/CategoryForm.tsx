import type { Tables } from '@/lib/supabase/database.types'
import ActionForm from './ActionForm'
import SubmitButton from './SubmitButton'

type Category = Tables<'categories'>

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
const label = 'mb-1 block text-sm font-medium text-gray-700'

export default function CategoryForm({
  action,
  category,
}: {
  action: (formData: FormData) => void | Promise<void>
  category?: Category
}) {
  return (
    <ActionForm
      action={action}
      successMessage={category ? 'Category updated successfully' : 'Category created successfully'}
      className="max-w-2xl space-y-5"
    >
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="space-y-4">
          <div>
            <label className={label}>Name *</label>
            <input name="name" required defaultValue={category?.name} className={input} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Slug</label>
              <input name="slug" defaultValue={category?.slug} placeholder="auto from name" className={input} />
            </div>
            <div>
              <label className={label}>Emoji</label>
              <input name="emoji" defaultValue={category?.emoji ?? ''} placeholder="🧸" className={input} />
            </div>
          </div>
          <div>
            <label className={label}>Description</label>
            <textarea name="description" rows={3} defaultValue={category?.description ?? ''} className={input} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Color (Tailwind class)</label>
              <input name="color" defaultValue={category?.color ?? ''} placeholder="bg-yellow-100" className={input} />
            </div>
            <div>
              <label className={label}>Display order</label>
              <input name="display_order" type="number" defaultValue={category?.display_order ?? 0} className={input} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="featured" defaultChecked={category?.featured ?? false} /> Featured (shows on homepage rail)
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-bold text-gray-900">SEO</h2>
        <div className="space-y-4">
          <div>
            <label className={label}>Meta title</label>
            <input name="seo_title" defaultValue={category?.seo_title ?? ''} className={input} />
          </div>
          <div>
            <label className={label}>Meta description</label>
            <textarea name="seo_description" rows={2} defaultValue={category?.seo_description ?? ''} className={input} />
          </div>
        </div>
      </section>

      <SubmitButton pendingText={category ? 'Saving…' : 'Creating…'} className="px-6 py-3">
        {category ? 'Save changes' : 'Create category'}
      </SubmitButton>
    </ActionForm>
  )
}
