import Link from 'next/link'
import type { Tables } from '@/lib/supabase/database.types'
import ActionForm from './ActionForm'
import SubmitButton from './SubmitButton'
import { Card, Field, FormActions, Switch, buttonClass, ui } from './ui'
import { FileTextIcon, GlobeIcon } from './icons'

type Category = Tables<'categories'>

export default function CategoryForm({
  action,
  category,
}: {
  action: (formData: FormData) => unknown | Promise<unknown>
  category?: Category
}) {
  return (
    <ActionForm action={action} successMessage={category ? 'Category updated successfully' : 'Category created successfully'}>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Details" description="Name and appearance in menus and category pages." icon={FileTextIcon} className="lg:col-span-2">
          <div className="space-y-5">
            <Field label="Name" required>
              <input name="name" required defaultValue={category?.name} className={ui.input} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="URL slug" hint="Leave blank to generate it from the name.">
                <input name="slug" defaultValue={category?.slug} placeholder="auto from name" className={ui.input} />
              </Field>
              <Field label="Emoji" hint="Shown when there's no image.">
                <input name="emoji" defaultValue={category?.emoji ?? ''} placeholder="🧸" className={ui.input} />
              </Field>
            </div>
            <Field label="Description">
              <textarea name="description" rows={3} defaultValue={category?.description ?? ''} className={ui.input} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Colour" hint="Tailwind class, e.g. bg-yellow-100.">
                <input name="color" defaultValue={category?.color ?? ''} placeholder="bg-yellow-100" className={ui.input} />
              </Field>
              <Field label="Display order" hint="Lower numbers show first.">
                <input name="display_order" type="number" defaultValue={category?.display_order ?? 0} className={ui.input} />
              </Field>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <Switch name="featured" defaultChecked={category?.featured ?? false} label="Featured" description="Shows this category in the homepage rail." />
            </div>
          </div>
        </Card>

        <Card title="Search engines" description="Optional — how this category appears on Google." icon={GlobeIcon} tone="gray">
          <div className="space-y-5">
            <Field label="Meta title">
              <input name="seo_title" defaultValue={category?.seo_title ?? ''} className={ui.input} />
            </Field>
            <Field label="Meta description">
              <textarea name="seo_description" rows={4} defaultValue={category?.seo_description ?? ''} className={ui.input} />
            </Field>
          </div>
        </Card>
      </div>

      <FormActions note={category ? undefined : 'You can add images, subcategories and promotions after creating the category.'}>
        <Link href="/admin/categories" className={buttonClass('ghost')}>
          Cancel
        </Link>
        <SubmitButton pendingText={category ? 'Saving…' : 'Creating…'} size="lg">
          {category ? 'Save changes' : 'Create category'}
        </SubmitButton>
      </FormActions>
    </ActionForm>
  )
}
