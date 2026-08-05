'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Tables } from '@/lib/supabase/database.types'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { addProductImage } from '@/app/admin/(protected)/products/actions'
import ActionForm from './ActionForm'
import SubmitButton from './SubmitButton'
import ImageCropModal from './ImageCropModal'

type Product = Tables<'products'>
type Category = Pick<Tables<'categories'>, 'id' | 'name'>
type AgeGroup = Pick<Tables<'age_groups'>, 'id' | 'label'>
type Subcategory = Pick<Tables<'subcategories'>, 'id' | 'name' | 'emoji' | 'category_id'>

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
const label = 'mb-1 block text-sm font-medium text-gray-700'

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
}: {
  action: (formData: FormData) => unknown | Promise<unknown>
  product?: Product
  categories: Category[]
  ageGroups: AgeGroup[]
  subcategories?: Subcategory[]
  selectedAgeIds?: string[]
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
    const id = (await action(formData)) as string

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
          await addProductImage(id, publicUrl, name)
        } catch {
          failures++
        }
      }
      if (failures > 0) {
        toast.error(`${failures} image(s) failed to upload — add them from the product's edit page`)
      }
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
                <label className={label}>Category *</label>
                <select
                  name="category_id"
                  required
                  defaultValue={product?.category_id ?? ''}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className={input}
                >
                  <option value="" disabled>Select…</option>
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
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="available" defaultChecked={product?.available ?? true} /> Available
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="popular" defaultChecked={product?.popular ?? false} /> Popular
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="new_arrival" defaultChecked={product?.new_arrival ?? false} /> New arrival
              </label>
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
