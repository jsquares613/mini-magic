import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import ProductForm from '@/components/admin/ProductForm'
import ImageManager from '@/components/admin/ImageManager'
import DeleteProductButton from '@/components/admin/DeleteProductButton'
import ActionForm from '@/components/admin/ActionForm'
import SubmitButton from '@/components/admin/SubmitButton'
import { addRelatedProduct, removeRelatedProduct, updateProduct } from '../actions'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()

  const { data: product } = await supabase.from('products').select('*').eq('id', params.id).maybeSingle()
  if (!product) notFound()

  const [{ data: categories }, { data: ageGroups }, { data: pivots }, { data: images }, { data: relatedPivots }, { data: otherProducts }] =
    await Promise.all([
      supabase.from('categories').select('id, name').order('display_order', { ascending: true }),
      supabase.from('age_groups').select('id, label').order('sort_order', { ascending: true }),
      supabase.from('product_age_groups').select('age_group_id').eq('product_id', product.id),
      supabase.from('product_images').select('*').eq('product_id', product.id).order('sort_order', { ascending: true }),
      // No embed: product_related has two FKs to products (product_id AND
      // related_product_id), which makes PostgREST embeds ambiguous. Fetch
      // the pivot rows, then look up names separately and join in JS.
      supabase
        .from('product_related')
        .select('id, related_product_id')
        .eq('product_id', product.id)
        .order('sort_order', { ascending: true }),
      supabase.from('products').select('id, name').neq('id', product.id).order('name', { ascending: true }),
    ])

  const relatedIds = (relatedPivots ?? []).map((r) => r.related_product_id)
  const { data: relatedProductRows } = relatedIds.length
    ? await supabase.from('products').select('id, name').in('id', relatedIds)
    : { data: [] as { id: string; name: string }[] }
  const relatedNameById = new Map((relatedProductRows ?? []).map((p) => [p.id, p.name]))
  const relatedList = (relatedPivots ?? []).map((r) => ({
    relationId: r.id,
    productId: r.related_product_id,
    name: relatedNameById.get(r.related_product_id) ?? 'Unknown product',
  }))

  const selectedAgeIds = (pivots ?? []).map((p) => p.age_group_id)
  const relatedIdSet = new Set(relatedIds)
  const addableProducts = (otherProducts ?? []).filter((p) => !relatedIdSet.has(p.id))
  const update = updateProduct.bind(null, product.id)
  const addRelated = addRelatedProduct.bind(null, product.id)

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/products" className="text-sm text-blue-600 hover:underline">
            ← Products
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">{product.name}</h1>
          <Link href={`/products/${product.slug}`} target="_blank" className="text-xs text-blue-600 hover:underline">
            View on storefront ↗
          </Link>
        </div>
        <DeleteProductButton id={product.id} />
      </div>

      <div className="mb-6 max-w-md">
        <ImageManager productId={product.id} images={images ?? []} />
      </div>

      <ProductForm
        action={update}
        product={product}
        categories={categories ?? []}
        ageGroups={ageGroups ?? []}
        selectedAgeIds={selectedAgeIds}
      />

      {/* Related products — curated "You may also like" picks. Optional: the
          storefront falls back to same-category products when empty. */}
      <section className="mt-8 max-w-2xl rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="mb-1 font-bold text-gray-900">Related Products</h2>
        <p className="mb-4 text-sm text-gray-500">
          Shown as &ldquo;You may also like&rdquo; on the product page. Leave empty to fall back to other products in the same category.
        </p>

        <div className="mb-6 space-y-2">
          {relatedList.map((r) => (
            <div key={r.relationId} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2">
              <span className="font-medium text-gray-900">{r.name}</span>
              <ActionForm action={removeRelatedProduct.bind(null, r.relationId, product.id)} successMessage="Related product removed">
                <SubmitButton pendingText="Removing…" variant="link" className="text-xs text-red-600">
                  Remove
                </SubmitButton>
              </ActionForm>
            </div>
          ))}
          {relatedList.length === 0 && <p className="text-sm text-gray-400">No related products curated yet.</p>}
        </div>

        {addableProducts.length > 0 && (
          <ActionForm action={addRelated} successMessage="Related product added" className="flex gap-3 border-t border-gray-100 pt-4">
            <select name="related_product_id" required className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="" disabled>
                Select a product to relate…
              </option>
              {addableProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <SubmitButton pendingText="Adding…">Add</SubmitButton>
          </ActionForm>
        )}
      </section>
    </div>
  )
}
