import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import CategoryForm from '@/components/admin/CategoryForm'
import CategoryImageField from '@/components/admin/CategoryImageField'
import DeleteCategoryButton from '@/components/admin/DeleteCategoryButton'
import ActionForm from '@/components/admin/ActionForm'
import SubmitButton from '@/components/admin/SubmitButton'
import { updateCategory, createPromotion, deletePromotion, togglePromotion } from '../actions'

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const { data: category } = await supabase.from('categories').select('*').eq('id', params.id).maybeSingle()
  if (!category) notFound()

  const { data: promotions } = await supabase
    .from('category_promotions')
    .select('*')
    .eq('category_id', category.id)
    .order('display_order', { ascending: true })

  const update = updateCategory.bind(null, category.id)
  const addPromo = createPromotion.bind(null, category.id)
  const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin/categories" className="text-sm text-blue-600 hover:underline">
            ← Categories
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            {category.emoji} {category.name}
          </h1>
        </div>
        <DeleteCategoryButton id={category.id} />
      </div>

      {/* Images */}
      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-bold text-gray-900">Images</h2>
        <div className="flex flex-wrap gap-6">
          <CategoryImageField
            categoryId={category.id}
            field="image"
            label="Card image"
            current={category.image}
            aspectRatio={1}
            hint="400 × 400px (square) — same on mobile & desktop"
          />
          <CategoryImageField
            categoryId={category.id}
            field="banner_image"
            label="Banner"
            current={category.banner_image}
            aspectRatio={16 / 9}
            hint="1280 × 720px (16:9)"
          />
        </div>
      </section>

      <CategoryForm action={update} category={category} />

      {/* Promotions */}
      <section className="mt-8 max-w-2xl rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 font-bold text-gray-900">Promotions (banners only — do not change product prices)</h2>

        <div className="mb-6 space-y-2">
          {(promotions ?? []).map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-2">
              <div className="min-w-0 flex-1 overflow-hidden">
                <span className="font-medium text-gray-900">{p.title}</span>{' '}
                {p.badge_text && <span className="text-sm text-red-500">{p.badge_text}</span>}
                {!p.active && <span className="ml-2 text-xs text-gray-400">(inactive)</span>}
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <ActionForm
                  action={togglePromotion.bind(null, p.id, category.id, !p.active)}
                  successMessage={p.active ? 'Promotion disabled' : 'Promotion enabled'}
                >
                  <SubmitButton pendingText="Working…" variant="link" className="text-xs text-blue-600">
                    {p.active ? 'Disable' : 'Enable'}
                  </SubmitButton>
                </ActionForm>
                <ActionForm
                  action={deletePromotion.bind(null, p.id, category.id)}
                  successMessage="Promotion deleted successfully"
                  confirmMessage="Delete this promotion?"
                >
                  <SubmitButton pendingText="Deleting…" variant="link" className="text-xs text-red-600">
                    Delete
                  </SubmitButton>
                </ActionForm>
              </div>
            </div>
          ))}
          {(!promotions || promotions.length === 0) && <p className="text-sm text-gray-400">No promotions yet.</p>}
        </div>

        <ActionForm action={addPromo} successMessage="Promotion created successfully" className="space-y-3 border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-700">Add promotion</p>
          <input name="title" required placeholder="Title (e.g. Toys Sale)" className={input} />
          <div className="grid grid-cols-2 gap-3">
            <input name="badge_text" placeholder="Badge (e.g. 40% Off)" className={input} />
            <input name="link" placeholder="Link (optional)" className={input} />
          </div>
          <input name="description" placeholder="Description (optional)" className={input} />
          <SubmitButton pendingText="Adding…">Add promotion</SubmitButton>
        </ActionForm>
      </section>
    </div>
  )
}
