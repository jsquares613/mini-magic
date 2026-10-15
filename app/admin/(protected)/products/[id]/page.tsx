import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { formatPrice, timeAgo } from '@/lib/format'
import ProductForm from '@/components/admin/ProductForm'
import ImageManager from '@/components/admin/ImageManager'
import DeleteProductButton from '@/components/admin/DeleteProductButton'
import ActionForm from '@/components/admin/ActionForm'
import SubmitButton from '@/components/admin/SubmitButton'
import ProductPicker from '@/components/admin/ProductPicker'
import { Badge, Card, Page, PageHeader, buttonClass, ui } from '@/components/admin/ui'
import { AlertTriangleIcon, ExternalLinkIcon, PackageIcon, PlusIcon, RefreshIcon, TrashIcon } from '@/components/admin/icons'
import { addRelatedProduct, removeRelatedProduct, updateProduct } from '../actions'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const id = params.id

  // Everything keys off the id in the URL, so it runs as one parallel batch.
  const [
    { data: product },
    { data: categories },
    { data: ageGroups },
    { data: subcategories },
    { data: pivots },
    { data: images },
    { data: relatedPivots },
  ] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).maybeSingle(),
    supabase.from('categories').select('id, name').order('display_order', { ascending: true }),
    supabase.from('age_groups').select('id, label').order('sort_order', { ascending: true }),
    supabase.from('subcategories').select('id, name, emoji, category_id').order('display_order', { ascending: true }),
    supabase.from('product_age_groups').select('age_group_id').eq('product_id', id),
    supabase.from('product_images').select('*').eq('product_id', id).order('sort_order', { ascending: true }),
    // No embed: product_related has two FKs to products (product_id AND
    // related_product_id), which makes PostgREST embeds ambiguous. Fetch
    // the pivot rows, then look up names separately and join in JS.
    supabase.from('product_related').select('id, related_product_id').eq('product_id', id).order('sort_order', { ascending: true }),
  ])
  if (!product) notFound()

  // Names of the curated related products (none or a handful).
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
  const update = updateProduct.bind(null, product.id)
  const addRelated = addRelatedProduct.bind(null, product.id)

  const margRows: [string, string][] = product.marg_code
    ? [
        ['Item code', product.marg_code],
        ['Billing name', product.marg_name ?? '—'],
        ['Supplier', product.marg_company ?? '—'],
        ['MRP', product.marg_mrp != null ? formatPrice(Number(product.marg_mrp)) : '—'],
        ['Stock', Number(product.marg_stock ?? 0).toLocaleString('en-IN')],
        ['Last synced', product.marg_synced_at ? timeAgo(product.marg_synced_at) : '—'],
      ]
    : []

  return (
    <Page>
      <PageHeader
        back={{ href: '/admin/products', label: 'Products' }}
        title={product.name}
        meta={
          <>
            {product.is_published ? (
              <Badge tone="green" dot>
                Published
              </Badge>
            ) : (
              <Badge tone="gray" dot>
                Draft
              </Badge>
            )}
            {product.marg_code && <Badge tone="blue">Marg #{product.marg_code}</Badge>}
          </>
        }
        description={product.is_published ? undefined : 'Not visible on the website yet.'}
        actions={
          <>
            {product.is_published && (
              <a href={`/products/${product.slug}`} target="_blank" rel="noreferrer" className={buttonClass('secondary')}>
                <ExternalLinkIcon className="h-4 w-4" />
                View on website
              </a>
            )}
            <DeleteProductButton id={product.id} />
          </>
        }
      />

      {(product.marg_deleted_at || product.marg_missing_since) && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            {product.marg_deleted_at
              ? 'This item was deleted in Marg and has been unpublished.'
              : 'Marg no longer lists this item. Check it in Marg, then unpublish or delete it here.'}
          </p>
        </div>
      )}

      <div className={`mb-6 grid gap-6 ${product.marg_code ? 'lg:grid-cols-3' : ''}`}>
        <div className={product.marg_code ? 'lg:col-span-2' : ''}>
          <ImageManager productId={product.id} images={images ?? []} />
        </div>
        {product.marg_code && (
          <Card title="From Marg ERP" description="Synced automatically — change these in Marg." icon={RefreshIcon} tone="blue">
            <dl className="space-y-3 text-sm">
              {margRows.map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-4">
                  <dt className="shrink-0 text-slate-500">{k}</dt>
                  <dd className="min-w-0 text-right font-medium text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        )}
      </div>

      <ProductForm
        action={update}
        product={product}
        categories={categories ?? []}
        ageGroups={ageGroups ?? []}
        subcategories={subcategories ?? []}
        selectedAgeIds={selectedAgeIds}
        imageCount={images?.length ?? 0}
      />

      {/* Related products — curated "You may also like" picks. Optional: the
          storefront falls back to same-category products when empty. */}
      <Card
        className="mt-6"
        title="Related products"
        description="Shown as “You may also like”. Leave empty to show other products from the same category."
        icon={PackageIcon}
        tone="gray"
        bodyClassName="p-0"
      >
        {relatedList.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {relatedList.map((r) => (
              <li key={r.relationId} className={ui.row}>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{r.name}</span>
                <ActionForm action={removeRelatedProduct.bind(null, r.relationId, product.id)} successMessage="Related product removed">
                  <SubmitButton pendingText="" variant="icon-danger">
                    <TrashIcon className="h-4 w-4" />
                    <span className="sr-only">Remove {r.name}</span>
                  </SubmitButton>
                </ActionForm>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 py-5 text-sm text-slate-500">No related products picked yet.</p>
        )}

        <ActionForm
          action={addRelated}
          successMessage="Related product added"
          className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4"
        >
          <ProductPicker
            name="related_product_id"
            required
            aria-label="Product to relate"
            placeholder="Search for a product to relate…"
            className="min-w-0 flex-1"
            excludeIds={[product.id, ...relatedIds]}
          />
          <SubmitButton pendingText="Adding…">
            <PlusIcon className="h-4 w-4" />
            Add
          </SubmitButton>
        </ActionForm>
      </Card>
    </Page>
  )
}
