'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Tables } from '@/lib/supabase/database.types'
import { getBrowserSupabase } from '@/lib/supabase/lazyBrowser'
import { addProductImage, bulkUpdateProducts } from '@/app/admin/(protected)/products/actions'
import { isActionError, unwrapAction, type ActionResult } from '@/lib/admin/actionResult'
import ActionForm, { usePending } from './ActionForm'
import SubmitButton from './SubmitButton'
import Select from './Select'
import { Card, Dot, Field, FormActions, Switch, buttonClass, ui } from './ui'
import {
  BadgePercentIcon,
  EyeIcon,
  FileTextIcon,
  GlobeIcon,
  ImagesIcon,
  PackageIcon,
  ShapesIcon,
  StarIcon,
  TagIcon,
  UploadIcon,
  XIcon,
} from './icons'

// The cropper (react-easy-crop) loads only when a crop dialog opens.
const ImageCropModal = dynamic(() => import('./ImageCropModal'), { ssr: false })

type Product = Tables<'products'>
type Category = Pick<Tables<'categories'>, 'id' | 'name'>
type AgeGroup = Pick<Tables<'age_groups'>, 'id' | 'label'>
type Subcategory = Pick<Tables<'subcategories'>, 'id' | 'name' | 'emoji' | 'category_id'>

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
    <p className={ui.hint}>
      <span className="font-medium text-slate-600">Marg:</span> {display}
      {overridden ? (
        <>
          {' — your edit is kept. '}
          <button
            type="button"
            onClick={resetToMarg}
            disabled={pending}
            className="font-semibold text-blue-700 hover:underline disabled:opacity-60"
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
  newArrival,
}: {
  action: (formData: FormData) => unknown | Promise<unknown>
  product?: Product
  categories: Category[]
  ageGroups: AgeGroup[]
  subcategories?: Subcategory[]
  selectedAgeIds?: string[]
  /** Photos the product already has (edit page). */
  imageCount?: number
  /** The "New arrival" switch, worked out on the server (newArrivalSwitch in lib/newArrivals.ts). */
  newArrival: { on: boolean; hint: string }
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
      const supabase = await getBrowserSupabase()
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

  const subsForCategory = subcategories.filter((s) => s.category_id === selectedCategoryId)
  const needsPhoto = !!product && !product.is_published && imageCount === 0

  return (
    <ActionForm
      action={product ? action : createWithImages}
      successMessage={product ? 'Product saved successfully' : 'Product created successfully'}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {!product && (
            <Card
              title="Photos"
              description="Square photos work best (1000 × 1000 px). They upload when you create the product."
              icon={ImagesIcon}
              tone="violet"
            >
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {stagedImages.map((staged, i) => (
                  <div key={staged.preview} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={staged.preview} alt="" className="aspect-square w-full object-cover" />
                    {i === 0 && (
                      <span className="absolute left-2 top-2 rounded-md bg-slate-900/75 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Main
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeStagedFile(i)}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm transition hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Remove photo"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 text-center text-xs font-medium text-slate-500 transition hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-700">
                  <UploadIcon className="h-5 w-5" />
                  Add photos
                  <input type="file" accept="image/*" multiple onChange={queueFilesForCrop} className="hidden" />
                </label>
              </div>

              {cropQueue.length > 0 && (
                <ImageCropModal
                  imageSrc={cropQueue[0].preview}
                  aspectRatio={1}
                  title={cropQueue.length > 1 ? `Crop image (1 of ${cropQueue.length})` : 'Crop image'}
                  onCancel={advanceCropQueue}
                  onCropped={stageCroppedImage}
                />
              )}
            </Card>
          )}

          <Card title="Basics" description="What customers see on the product page." icon={FileTextIcon}>
            <div className="space-y-5">
              <div>
                <label htmlFor="product-name" className={ui.label}>
                  Name<span className="ml-0.5 text-rose-500">*</span>
                </label>
                <input id="product-name" name="name" required defaultValue={product?.name} className={ui.input} />
                <MargHint product={product} field="name" margValue={product?.marg_name ?? null} display={product?.marg_name ?? ''} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="URL slug" hint="Leave blank to generate it from the name.">
                  <input name="slug" defaultValue={product?.slug} placeholder="auto from name" className={ui.input} />
                </Field>
                <Field label="SKU">
                  <input name="sku" defaultValue={product?.sku ?? ''} className={ui.input} />
                </Field>
              </div>
              <Field label="Short description" hint="One line, shown on product cards.">
                <input name="short_description" defaultValue={product?.short_description ?? ''} className={ui.input} />
              </Field>
              <Field label="Description">
                <textarea name="description" rows={5} defaultValue={product?.description ?? ''} className={ui.input} />
              </Field>
              <Field label="Why kids love it" hint="One feature per line.">
                <textarea name="features" rows={4} defaultValue={(product?.features ?? []).join('\n')} className={ui.input} />
              </Field>
            </div>
          </Card>

          <Card
            title="Pricing"
            description={product?.marg_code ? 'The price follows Marg’s MRP unless you change it here.' : undefined}
            icon={TagIcon}
            tone="green"
          >
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label htmlFor="product-price" className={ui.label}>
                  Price (₹)
                </label>
                <input id="product-price" name="price" type="number" step="0.01" defaultValue={product?.price ?? ''} className={ui.input} />
                <MargHint
                  product={product}
                  field="price"
                  margValue={product?.marg_mrp != null ? String(Number(product.marg_mrp)) : null}
                  display={`₹${product?.marg_mrp} MRP`}
                />
              </div>
              <Field label="Sale price (₹)" hint="Leave blank when not on offer.">
                <input name="sale_price" type="number" step="0.01" defaultValue={product?.sale_price ?? ''} className={ui.input} />
              </Field>
              <Field label="Price display">
                <Select
                  name="price_display"
                  aria-label="Price display"
                  defaultValue={product?.price_display ?? 'show'}
                  options={[
                    { value: 'show', label: 'Show price', description: 'Customers see the price' },
                    { value: 'hide', label: 'Hide price', description: 'No price on the website' },
                    { value: 'enquire', label: 'Enquire for price', description: 'Shows “Enquire for price”' },
                  ]}
                />
              </Field>
            </div>
          </Card>

          <Card title="Details" description="Helps customers filter and compare." icon={ShapesIcon} tone="teal">
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Material">
                  <input name="material" defaultValue={product?.material ?? ''} className={ui.input} />
                </Field>
                <Field label="Colour">
                  <input name="color" defaultValue={product?.color ?? ''} className={ui.input} />
                </Field>
              </div>
              <Field label="Tags" hint="Comma separated, e.g. wooden, eco-friendly.">
                <input name="tags" defaultValue={(product?.tags ?? []).join(', ')} className={ui.input} />
              </Field>
              <fieldset>
                <legend className={ui.label}>Age groups</legend>
                <div className="flex flex-wrap gap-2">
                  {ageGroups.map((a) => (
                    <label
                      key={a.id}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-400 has-[:checked]:border-blue-900 has-[:checked]:bg-blue-50 has-[:checked]:text-blue-900"
                    >
                      <input
                        type="checkbox"
                        name="age_group_ids"
                        value={a.id}
                        defaultChecked={selectedAgeIds.includes(a.id)}
                        className={ui.checkbox}
                      />
                      {a.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </Card>

          <Card title="Search engines" description="Optional — how this product appears on Google." icon={GlobeIcon} tone="gray">
            <div className="space-y-5">
              <Field label="Meta title">
                <input name="seo_title" defaultValue={product?.seo_title ?? ''} className={ui.input} />
              </Field>
              <Field label="Meta description">
                <textarea name="seo_description" rows={2} defaultValue={product?.seo_description ?? ''} className={ui.input} />
              </Field>
            </div>
          </Card>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          <Card title="Visibility" icon={EyeIcon}>
            <Switch
              name="is_published"
              defaultChecked={product?.is_published ?? true}
              label="Published on website"
              description={
                needsPhoto ? (
                  <span className="text-amber-700">Add a photo above before publishing.</span>
                ) : (
                  'Publishing needs a category and at least one photo.'
                )
              }
            />
          </Card>

          <Card title="Organisation" icon={ShapesIcon} tone="teal">
            <div className="space-y-5">
              <Field label="Category" hint="Required to publish.">
                <Select
                  name="category_id"
                  aria-label="Category"
                  defaultValue={product?.category_id ?? ''}
                  onChange={setSelectedCategoryId}
                  options={[
                    { value: '', label: 'No category' },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              </Field>
              {subsForCategory.length > 0 && (
                <Field label="Subcategory">
                  <Select
                    name="subcategory_id"
                    aria-label="Subcategory"
                    defaultValue={product?.subcategory_id ?? ''}
                    options={[
                      { value: '', label: 'None' },
                      ...subsForCategory.map((s) => ({ value: s.id, label: `${s.emoji ? `${s.emoji} ` : ''}${s.name}` })),
                    ]}
                  />
                </Field>
              )}
              <Field label="Display order" hint="Lower numbers show first.">
                <input name="display_order" type="number" defaultValue={product?.display_order ?? 0} className={ui.input} />
              </Field>
            </div>
          </Card>

          <Card title="Stock" icon={PackageIcon} tone="amber">
            {product?.marg_code ? (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-sm text-slate-500">Marg stock</span>
                  <span className="text-lg font-semibold tabular-nums text-slate-900">
                    {Number(product.marg_stock ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <Field label="Shown to customers">
                  <Select
                    name="stock_status_override"
                    aria-label="Stock shown to customers"
                    defaultValue={product.stock_status_override ?? ''}
                    options={[
                      { value: '', label: 'Automatic', description: 'Follows the Marg quantity', icon: <Dot tone="gray" /> },
                      { value: 'in-stock', label: 'Always in stock', description: 'Even when Marg says 0', icon: <Dot tone="green" /> },
                      { value: 'low-stock', label: 'Low stock', description: 'Shows “Low stock”', icon: <Dot tone="amber" /> },
                      { value: 'out-of-stock', label: 'Out of stock', description: 'Shows “Out of stock”', icon: <Dot tone="red" /> },
                      { value: 'pre-order', label: 'Pre-order', description: 'Shows “Available to pre-order”', icon: <Dot tone="blue" /> },
                    ]}
                  />
                </Field>
              </div>
            ) : (
              <Switch
                name="available"
                defaultChecked={product?.available ?? true}
                label="In stock"
                description="Turn off to show “Out of stock”."
              />
            )}
          </Card>

          <Card title="Highlights" icon={StarIcon} tone="amber">
            <div className="space-y-4">
              <Switch name="popular" defaultChecked={product?.popular ?? false} label="Popular" description="Shown in the popular toys rail." />
              <Switch name="new_arrival" defaultChecked={newArrival.on} label="New arrival" description={newArrival.hint} />
            </div>
          </Card>

          <Card
            title="Promo tag"
            description="Badge on the product card. Line breaks control how it stacks."
            icon={BadgePercentIcon}
            tone="red"
          >
            <textarea
              name="promo_tag"
              rows={3}
              placeholder={'BUY 1\nGET 1\nFREE'}
              defaultValue={product?.promo_tag ?? ''}
              className={ui.input}
            />
            {product?.promo_tag && (
              <div className="mt-4 flex items-start gap-3">
                <span className="pt-1 text-xs text-slate-400">Preview</span>
                <div
                  className="inline-block overflow-hidden rounded-br-xl shadow-[3px_3px_16px_rgba(0,0,0,0.35)]"
                  style={{ background: 'linear-gradient(155deg, #1e3fad 0%, #080f2e 100%)' }}
                >
                  <div className="px-4 py-2.5">
                    {product.promo_tag.split('\n').map((line, i) => (
                      <p
                        key={i}
                        className={`text-center text-[16px] font-black uppercase leading-none tracking-widest drop-shadow ${
                          i === 0 ? 'text-white' : 'text-yellow-400'
                        }`}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <FormActions note={product ? undefined : 'New products are saved as drafts until they have a photo and a category.'}>
        <Link href="/admin/products" className={buttonClass('ghost')}>
          Cancel
        </Link>
        <SubmitButton pendingText={product ? 'Saving…' : 'Creating…'} size="lg">
          {product ? 'Save changes' : 'Create product'}
        </SubmitButton>
      </FormActions>
    </ActionForm>
  )
}
