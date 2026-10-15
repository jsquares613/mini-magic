import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import CategoryForm from '@/components/admin/CategoryForm'
import CategoryImageField from '@/components/admin/CategoryImageField'
import DeleteCategoryButton from '@/components/admin/DeleteCategoryButton'
import ActionForm from '@/components/admin/ActionForm'
import SubmitButton from '@/components/admin/SubmitButton'
import { Badge, Card, Page, PageHeader, buttonClass, ui } from '@/components/admin/ui'
import {
  CheckIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  ImagesIcon,
  MegaphoneIcon,
  PlusIcon,
  ShapesIcon,
  StarIcon,
  TrashIcon,
} from '@/components/admin/icons'
import {
  updateCategory,
  createPromotion,
  deletePromotion,
  togglePromotion,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from '../actions'

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  // All keyed off the id in the URL — one parallel batch.
  const [{ data: category }, { data: promotions }, { data: subcategories }] = await Promise.all([
    supabase.from('categories').select('*').eq('id', params.id).maybeSingle(),
    supabase.from('category_promotions').select('*').eq('category_id', params.id).order('display_order', { ascending: true }),
    supabase.from('subcategories').select('*').eq('category_id', params.id).order('display_order', { ascending: true }),
  ])
  if (!category) notFound()

  const update = updateCategory.bind(null, category.id)
  const addPromo = createPromotion.bind(null, category.id)
  const addSub = createSubcategory.bind(null, category.id)
  const emojiInput = `${ui.control} w-14 shrink-0 text-center`

  return (
    <Page>
      <PageHeader
        back={{ href: '/admin/categories', label: 'Categories' }}
        title={
          <>
            {category.emoji && <span className="mr-2">{category.emoji}</span>}
            {category.name}
          </>
        }
        meta={
          category.featured ? (
            <Badge tone="amber" icon={StarIcon}>
              Featured
            </Badge>
          ) : undefined
        }
        description={`/categories/${category.slug}`}
        actions={
          <>
            <a href={`/categories/${category.slug}`} target="_blank" rel="noreferrer" className={buttonClass('secondary')}>
              <ExternalLinkIcon className="h-4 w-4" />
              View on website
            </a>
            <DeleteCategoryButton id={category.id} />
          </>
        }
      />

      <Card className="mb-6" title="Images" description="Changes save as soon as you upload." icon={ImagesIcon} tone="violet">
        <div className="flex flex-wrap gap-8">
          <CategoryImageField
            categoryId={category.id}
            field="image"
            label="Card image"
            current={category.image}
            aspectRatio={1}
            hint="400 × 400 px, square"
          />
          <CategoryImageField
            categoryId={category.id}
            field="banner_image"
            label="Banner"
            current={category.banner_image}
            aspectRatio={16 / 9}
            hint="1280 × 720 px, 16:9"
          />
        </div>
      </Card>

      <CategoryForm action={update} category={category} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Subcategories */}
        <Card
          title="Subcategories"
          description="Optional filters inside this category."
          icon={ShapesIcon}
          tone="teal"
          bodyClassName="p-0"
          footer={
            <ActionForm action={addSub} successMessage="Subcategory added" className="flex gap-2 py-1">
              <input name="emoji" placeholder="🏷️" aria-label="Emoji" className={emojiInput} />
              <input name="name" required placeholder="New subcategory name" aria-label="Subcategory name" className={`${ui.input} min-w-0 flex-1`} />
              <SubmitButton pendingText="Adding…">
                <PlusIcon className="h-4 w-4" />
                Add
              </SubmitButton>
            </ActionForm>
          }
        >
          {subcategories && subcategories.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {subcategories.map((sub) => (
                <li key={sub.id} className="flex items-center gap-2 px-6 py-3">
                  <ActionForm
                    action={updateSubcategory.bind(null, sub.id, category.id)}
                    successMessage="Subcategory updated"
                    className="flex min-w-0 flex-1 items-center gap-2"
                  >
                    <input name="emoji" defaultValue={sub.emoji ?? ''} placeholder="🏷️" aria-label="Emoji" className={emojiInput} />
                    <input name="name" required defaultValue={sub.name} aria-label="Subcategory name" className={`${ui.input} min-w-0 flex-1`} />
                    <input type="hidden" name="display_order" value={sub.display_order} />
                    <SubmitButton pendingText="" variant="icon">
                      <CheckIcon className="h-4 w-4" />
                      <span className="sr-only">Save {sub.name}</span>
                    </SubmitButton>
                  </ActionForm>
                  <ActionForm
                    action={deleteSubcategory.bind(null, sub.id, category.id)}
                    successMessage="Subcategory deleted"
                    confirmMessage="Delete this subcategory?"
                  >
                    <SubmitButton pendingText="" variant="icon-danger">
                      <TrashIcon className="h-4 w-4" />
                      <span className="sr-only">Delete {sub.name}</span>
                    </SubmitButton>
                  </ActionForm>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-6 py-5 text-sm text-slate-500">No subcategories yet.</p>
          )}
        </Card>

        {/* Promotions */}
        <Card
          title="Promotions"
          description="Banners on the category page — they don't change product prices."
          icon={MegaphoneIcon}
          tone="red"
          bodyClassName="p-0"
          footer={
            <ActionForm action={addPromo} successMessage="Promotion created successfully" className="space-y-2 py-1">
              <input name="title" required placeholder="Title, e.g. Toys Sale" aria-label="Promotion title" className={ui.input} />
              <div className="grid gap-2 sm:grid-cols-2">
                <input name="badge_text" placeholder="Badge, e.g. 40% Off" aria-label="Badge" className={ui.input} />
                <input name="link" placeholder="Link (optional)" aria-label="Link" className={ui.input} />
              </div>
              <div className="flex gap-2">
                <input name="description" placeholder="Description (optional)" aria-label="Description" className={`${ui.input} min-w-0 flex-1`} />
                <SubmitButton pendingText="Adding…">
                  <PlusIcon className="h-4 w-4" />
                  Add
                </SubmitButton>
              </div>
            </ActionForm>
          }
        >
          {promotions && promotions.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {promotions.map((p) => (
                <li key={p.id} className={ui.row}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium text-slate-900">{p.title}</span>
                      {p.badge_text && <Badge tone="red">{p.badge_text}</Badge>}
                      {!p.active && <Badge tone="gray">Hidden</Badge>}
                    </div>
                    {p.description && <p className="mt-0.5 truncate text-xs text-slate-500">{p.description}</p>}
                  </div>
                  <ActionForm
                    action={togglePromotion.bind(null, p.id, category.id, !p.active)}
                    successMessage={p.active ? 'Promotion hidden' : 'Promotion shown'}
                  >
                    <SubmitButton pendingText="" variant="icon">
                      {p.active ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      <span className="sr-only">{p.active ? 'Hide' : 'Show'} {p.title}</span>
                    </SubmitButton>
                  </ActionForm>
                  <ActionForm
                    action={deletePromotion.bind(null, p.id, category.id)}
                    successMessage="Promotion deleted successfully"
                    confirmMessage="Delete this promotion?"
                  >
                    <SubmitButton pendingText="" variant="icon-danger">
                      <TrashIcon className="h-4 w-4" />
                      <span className="sr-only">Delete {p.title}</span>
                    </SubmitButton>
                  </ActionForm>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-6 py-5 text-sm text-slate-500">No promotions yet.</p>
          )}
        </Card>
      </div>
    </Page>
  )
}
