'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Tables } from '@/lib/supabase/database.types'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { addProductImage, bulkUpdateProducts } from '@/app/admin/(protected)/products/actions'
import { isActionError, unwrapAction, type ActionResult } from '@/lib/admin/actionResult'
import ActionForm, { usePending } from './ActionForm'
import SubmitButton from './SubmitButton'
import ImageCropModal from './ImageCropModal'

type Product = Tables<'products'>
type Category = Pick<Tables<'categories'>, 'id' | 'name'>
type AgeGroup = Pick<Tables<'age_groups'>, 'id' | 'label'>
type Subcategory = Pick<Tables<'subcategories'>, 'id' | 'name' | 'emoji' | 'category_id'>

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
const label = 'mb-1 block text-sm font-medium text-gray-700'

/**
 * "Marg: …" note under a Marg-owned field. When the admin's value overrides
 * Marg's, offers a one-click reset: it puts Marg's value back in the input and
 * saves the form — a value equal to Marg's is what hands the field back to the
 * sync (see margOverrides() in the product actions).
 */
function MargHint({
  product,
  field,
  margValue,
  display,
}: {
  product?: Product
  field: 'name' | 'price'
  /** Raw value to put back in the input. */
  margValue: string | null
  /** How the Marg value is shown in the note. */
  display: string
}) {
  const pending = usePending()
  if (!product?.marg_code || margValue == null) return null
  const value = margValue
  const overridden = product.overridden_fields.includes(field)

  function resetToMarg(e: React.MouseEvent<HTMLButtonElement>) {
    const form = e.currentTarget.form
    const el = form?.elements.namedItem(field)
    if (!form || !(el instanceof HTMLInputElement)) return
    el.value = value
    form.requestSubmit()
  }

  return (
    <p className="mt-1 text-xs text-gray-400">
      Marg: {display}
      {overridden ? (
        <>
          {' — your edit is kept. '}
          <button
            type="button"
            onClick={resetToMarg}
            disabled={pending}
            className="font-medium text-blue-600 hover:underline disabled:opacity-60"
          >
            Reset to Marg
          </button>
        </>
      ) : (
        ' — follows Marg until you change it.'
      )}
    </p>
  )
}

/**
 * Shared create/edit product form. `action` is a bound Server Action
 * (createProduct or updateProduct.bind(null, id)). On create, `createProduct`
 * returns the new id instead of redirecting, so any images staged below can
 * be uploaded (browser → Storage, same as `ImageManager`) before navigating
 * to the edit page — letting a new product ship with a photo in one step.
 */
export default function ProductForm({
  action,
  product,
  categories,
  ageGroups,
  subcategories = [],
  selectedAgeIds = [],
  imageCount = 0,
}: {
  action: (formData: FormData) => unknown | Promise<unknown>
  product?: Product
  categories: Category[]
  ageGroups: AgeGroup[]
  subcategories?: Subcategory[]
  selectedAgeIds?: string[]
  /** Photos the product already has (edit page). */
  imageCount?: number
}) {
  const router = useRouter()
  const [selectedCategoryId, setSelectedCategoryId] = useState(product?.category_id ?? '')
  const [stagedImages, setStagedImages] = useState<{ blob: Blob; name: string; preview: string }[]>([])
  const [cropQueue, setCropQueue] = useState<{ file: File; preview: string }[]>([])

  useEffect(() => {
    return () => {
      stagedImages.forEach((s) => URL.revokeObjectURL(s.preview))
      cropQueue.forEach((s) => URL.revokeObjectURL(s.preview))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function queueFilesForCrop(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length) {
      setCropQueue((prev) => [...prev, ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))])
    }
    e.target.value = ''
  }

  function advanceCropQueue() {
    setCropQueue((prev) => {
      URL.revokeObjectURL(prev[0].preview)
      return prev.slice(1)
    })
  }

  function stageCroppedImage(blob: Blob) {
    const name = cropQueue[0].file.name
    setStagedImages((prev) => [...prev, { blob, name, preview: URL.createObjectURL(blob) }])
    advanceCropQueue()
  }

  function removeStagedFile(index: number) {
    setStagedImages((prev) => {
      const removed = prev[index]
      if (removed) URL.revokeObjectURL(removed.preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  async function createWithImages(formData: FormData) {
    // createProduct always saves a draft (publishing needs a photo, and photos
    // attach to an existing product) — publish once the uploads are in.
    const wantsPublish = formData.get('is_published') === 'on'
    const id = unwrapAction(await action(formData) as ActionResult<string>)
    if (!id) throw new Error('Product creation returned no ID — please try again.')

    if (stagedImages.length > 0) {
      const supabase = createBrowserSupabase()
      let failures = 0
      for (const { blob, name } of stagedImages) {
        try {
          const path = `${id}/${Date.now()}-${name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
          const { error: upErr } = await supabase.storage.from('product-images').upload(path, blob)
          if (upErr) throw upErr
          const {
            data: { publicUrl },
          } = supabase.storage.from('product-images').getPublicUrl(path)
          unwrapAction(await addProductImage(id, publicUrl, name))
        } catch {
          failures++
        }
      }
      if (failures > 0) {
        toast.error(`${failures} image(s) failed to upload — add them from the product's edit page`)
      }
    }

    if (wantsPublish) {
      const published = await bulkUpdateProducts({ op: 'publish', ids: [id] })
      if (isActionError(published)) toast.error(published.error)
      else if (published.skipped > 0) toast.warning('Saved as a draft — publishing needs a category and at least one photo.')
    }

    router.push(`/admin/products/${id}`)
  }

  return (
    <ActionForm
      action={product ? action : createWithImages}
      successMessage={product ? 'Product saved successfully' : 'Product created successfully'}
      className="space-y-6"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          {!product && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 font-bold text-gray-900">Images</h2>
              <label className="mb-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 transition hover:border-blue-400 hover:text-blue-600">
                + Upload images
                <input type="file" accept="image/*" multiple onChange={queueFilesForCrop} className="hidden" />
              </label>
              <p className="mb-4 text-xs text-gray-400">
                Recommended size: 1000 × 1000px (square) — same on mobile & desktop
              </p>
              {stagedImages.length === 0 ? (
                <p className="text-sm text-gray-400">No images yet — they upload once you create the product.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {stagedImages.map((staged, i) => (
                    <div key={staged.preview} className="group relative overflow-hidden rounded-lg border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={staged.preview} alt="" className="aspect-square w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeStagedFile(i)}
                        className="absolute right-1 top-1 rounded-full bg-red-500 px-1.5 text-xs text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {cropQueue.length > 0 && (
                <ImageCropModal
                  imageSrc={cropQueue[0].preview}
                  aspectRatio={1}
                  title={cropQueue.length > 1 ? `Crop image (1 of ${cropQueue.length})` : 'Crop image'}
                  onCancel={advanceCropQueue}
                  onCropped={stageCroppedImage}
                />
              )}
            </section>
          )}

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-bold text-gray-900">Basics</h2>
            <div className="space-y-4">
              <div>
                <label className={label}>Name *</label>
                <input name="name" required defaultValue={product?.name} className={input} />
                <MargHint product={product} field="name" margValue={product?.marg_name ?? null} display={product?.marg_name ?? ''} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label}>Slug</label>
                  <input name="slug" defaultValue={product?.slug} placeholder="auto from name" className={input} />
                </div>
                <div>
                  <label className={label}>SKU</label>
                  <input name="sku" defaultValue={product?.sku ?? ''} className={input} />
                </div>
              </div>
              <div>
                <label className={label}>Short description</label>
                <input name="short_description" defaultValue={product?.short_description ?? ''} className={input} />
              </div>
              <div>
                <label className={label}>Description</label>
                <textarea name="description" rows={5} defaultValue={product?.description ?? ''} className={input} />
              </div>
              <div>
                <label className={label}>Features (one per line — “Why Kids Love It”)</label>
                <textarea
                  name="features"
                  rows={4}
                  defaultValue={(product?.features ?? []).join('\n')}
                  className={input}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-bold text-gray-900">Pricing</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={label}>Price (₹)</label>
                <input name="price" type="number" step="0.01" defaultValue={product?.price ?? ''} className={input} />
                <MargHint
                  product={product}
                  field="price"
                  margValue={product?.marg_mrp != null ? String(Number(product.marg_mrp)) : null}
                  display={`₹${product?.marg_mrp} (MRP)`}
                />
              </div>
              <div>
                <label className={label}>Sale price (₹)</label>
                <input name="sale_price" type="number" step="0.01" defaultValue={product?.sale_price ?? ''} className={input} />
              </div>
              <div>
                <label className={label}>Price display</label>
                <select name="price_display" defaultValue={product?.price_display ?? 'show'} className={input}>
                  <option value="show">Show price</option>
                  <option value="hide">Hide price</option>
                  <option value="enquire">Enquire for price</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-bold text-gray-900">Attributes</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Material</label>
                <input name="material" defaultValue={product?.material ?? ''} className={input} />
              </div>
              <div>
                <label className={label}>Color</label>
                <input name="color" defaultValue={product?.color ?? ''} className={input} />
              </div>
            </div>
            <div className="mt-4">
              <label className={label}>Tags (comma separated)</label>
              <input name="tags" defaultValue={(product?.tags ?? []).join(', ')} className={input} />
            </div>
            <div className="mt-4">
              <label className={label}>Age groups</label>
              <div className="flex flex-wrap gap-3">
                {ageGroups.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm">
                    <input
                      type="checkbox"
                      name="age_group_ids"
                      value={a.id}
                      defaultChecked={selectedAgeIds.includes(a.id)}
                    />
                    {a.label}
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-bold text-gray-900">SEO</h2>
            <div className="space-y-4">
              <div>
                <label className={label}>Meta title</label>
                <input name="seo_title" defaultValue={product?.seo_title ?? ''} className={input} />
              </div>
              <div>
                <label className={label}>Meta description</label>
                <textarea name="seo_description" rows={2} defaultValue={product?.seo_description ?? ''} className={input} />
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar column */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-bold text-gray-900">Organisation</h2>
            <div className="space-y-4">
              <div>
                <label className={label}>Category <span className="text-gray-400">(required to publish)</span></label>
                <select
                  name="category_id"
                  defaultValue={product?.category_id ?? ''}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className={input}
                >
                  <option value="">Select…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {(() => {
                const filtered = subcategories.filter((s) => s.category_id === selectedCategoryId)
                if (!filtered.length) return null
                return (
                  <div>
                    <label className={label}>Subcategory</label>
                    <select
                      name="subcategory_id"
                      defaultValue={product?.subcategory_id ?? ''}
                      className={input}
                    >
                      <option value="">None</option>
                      {filtered.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.emoji ? `${s.emoji} ` : ''}{s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })()}
              <div>
                <label className={label}>Display order</label>
                <input name="display_order" type="number" defaultValue={product?.display_order ?? 0} className={input} />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <input type="checkbox" name="is_published" defaultChecked={product?.is_published ?? true} /> Published on website
              </label>
              <p className={`-mt-2 text-xs ${product && !product.is_published && imageCount === 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                {product && !product.is_published && imageCount === 0
                  ? 'Add a photo above before publishing.'
                  : 'Publishing needs a category and at least one photo.'}
              </p>
              {product?.marg_code ? (
                <div>
                  <label className={label}>
                    Stock shown to customers{' '}
                    <span className="text-gray-400">(Marg stock: {Number(product.marg_stock ?? 0)})</span>
                  </label>
                  <select name="stock_status_override" defaultValue={product.stock_status_override ?? ''} className={input}>
                    <option value="">Automatic from Marg stock</option>
                    <option value="in-stock">Always in stock</option>
                    <option value="low-stock">Low stock</option>
                    <option value="out-of-stock">Out of stock</option>
                    <option value="pre-order">Pre-order</option>
                  </select>
                </div>
              ) : (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" name="available" defaultChecked={product?.available ?? true} /> Available
                </label>
              )}
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="popular" defaultChecked={product?.popular ?? false} /> Popular
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="new_arrival" defaultChecked={product?.new_arrival ?? false} /> New arrival
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-1 font-bold text-gray-900">Promo Tag</h2>
            <p className="mb-4 text-xs text-gray-500">
              Badge shown on the product card and detail page. Use line breaks to control how text stacks (e.g. &ldquo;BUY 1 / GET 1 / FREE&rdquo;). Leave blank for no badge.
            </p>
            <div className="space-y-3">
              <textarea
                name="promo_tag"
                rows={3}
                placeholder={'BUY 1\nGET 1\nFREE'}
                defaultValue={product?.promo_tag ?? ''}
                className={input}
              />
              {product?.promo_tag && (
                <div className="flex items-start gap-3">
                  <span className="text-xs text-gray-400">Preview:</span>
                  <div
                    className="inline-block overflow-hidden rounded-br-xl shadow-[3px_3px_16px_rgba(0,0,0,0.5)]"
                    style={{ background: 'linear-gradient(155deg, #1e3fad 0%, #080f2e 100%)' }}
                  >
                    <div className="px-4 py-2.5">
                      {product.promo_tag.split('\n').map((line, i) => (
                        <p key={i} className={`text-center text-[16px] font-black uppercase leading-none tracking-widest drop-shadow ${i === 0 ? 'text-white' : 'text-yellow-400'}`}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <SubmitButton pendingText={product ? 'Saving…' : 'Creating…'} className="w-full py-3">
            {product ? 'Save changes' : 'Create product'}
          </SubmitButton>
        </div>
      </div>
    </ActionForm>
  )
}
