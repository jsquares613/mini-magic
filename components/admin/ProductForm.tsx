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
import { parseColors, type ProductColor } from '@/lib/productColors'
import type { ProductFieldKey } from '@/lib/productFields'
import ActionForm, { usePending } from './ActionForm'
import SubmitButton from './SubmitButton'
import Select from './Select'
import ProductColorsField from './ProductColorsField'
import { PhotoColorSelect, PhotoGroup, photoGroups } from './PhotoGroups'
import { FieldOffNote, FieldToggle, FieldVisibilityProvider, OptionalField, useFieldOn } from './ProductFieldVisibility'
import { Card, Dot, Field, FormActions, Switch, buttonClass, ui } from './ui'
import {
  BadgePercentIcon,
  EyeIcon,
  FileTextIcon,
  GlobeIcon,
  ImagesIcon,
  PackageIcon,
  PaletteIcon,
  ShapesIcon,
  StarIcon,
  TagIcon,
  XIcon,
} from './icons'

// The cropper (react-easy-crop) loads only when a crop dialog opens.
const ImageCropModal = dynamic(() => import('./ImageCropModal'), { ssr: false })

type Product = Tables<'products'>
type Category = Pick<Tables<'categories'>, 'id' | 'name'>
type AgeGroup = Pick<Tables<'age_groups'>, 'id' | 'label'>
type Subcategory = Pick<Tables<'subcategories'>, 'id' | 'name' | 'emoji' | 'category_id'>

type StagedImage = { blob: Blob; name: string; preview: string; colorId: string | null }
type CropItem = { file: File; preview: string; colorId: string | null }

/**
 * "Marg: …" note under a Marg-owned field. When the admin's value overrides
 * Marg's, offers a one-click reset: it puts Marg's value back in the input and
 * saves the form - a value equal to Marg's is what hands the field back to the
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
          {' - your edit is kept. '}
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
        ' - follows Marg until you change it.'
      )}
    </p>
  )
}

/** A switch with the field's on/off tick box beside it. */
function OptionalSwitch({
  field,
  name,
  defaultChecked,
  label,
  description,
}: {
  field: ProductFieldKey
  name: string
  defaultChecked: boolean
  label: string
  description: React.ReactNode
}) {
  const on = useFieldOn(field)
  return (
    <div className="flex items-start gap-3">
      <div className="min-w-0 flex-1">
        {on ? (
          <Switch name={name} defaultChecked={defaultChecked} label={label} description={description} />
        ) : (
          <>
            <span className="block text-sm font-medium text-slate-400">{label}</span>
            <span className="mt-0.5 block text-xs text-slate-400">Turned off for all products.</span>
          </>
        )}
      </div>
      <FieldToggle field={field} className="mt-0.5" />
    </div>
  )
}

/** Card whose whole body is one switchable field (SEO, promo tag, colours). */
function OptionalCard({
  field,
  children,
  ...card
}: { field: ProductFieldKey; children: React.ReactNode } & Omit<React.ComponentProps<typeof Card>, 'actions' | 'children'>) {
  const on = useFieldOn(field)
  return (
    <Card {...card} description={on ? card.description : undefined} actions={<FieldToggle field={field} />}>
      {on ? children : <FieldOffNote field={field} />}
    </Card>
  )
}

/**
 * Shared create/edit product form. `action` is a bound Server Action
 * (createProduct or updateProduct.bind(null, id)). On create, `createProduct`
 * returns the new id instead of redirecting, so any images staged below can
 * be uploaded (browser → Storage, same as `ImageManager`) before navigating
 * to the edit page - letting a new product ship with photos in one step.
 */
export default function ProductForm(props: {
  action: (formData: FormData) => unknown | Promise<unknown>
  product?: Product
  categories: Category[]
  ageGroups: AgeGroup[]
  subcategories?: Subcategory[]
  selectedAgeIds?: string[]
  /** Photos the product already has (edit page). */
  imageCount?: number
  /** Saved photos per colour id (edit page), shown in the Colours card. */
  photoCounts?: Record<string, number>
  /** The "New arrival" switch, worked out on the server (newArrivalSwitch in lib/newArrivals.ts). */
  newArrival: { on: boolean; hint: string }
  /** Fields switched off for all products (lib/productFields.ts). */
  hiddenFields?: ProductFieldKey[]
  /** Admins get the on/off tick boxes beside each optional field. */
  canConfigureFields?: boolean
}) {
  return (
    <FieldVisibilityProvider initialHidden={props.hiddenFields ?? []} canConfigure={props.canConfigureFields ?? false}>
      <ProductFormInner {...props} />
    </FieldVisibilityProvider>
  )
}

function ProductFormInner({
  action,
  product,
  categories,
  ageGroups,
  subcategories = [],
  selectedAgeIds = [],
  imageCount = 0,
  photoCounts,
  newArrival,
}: React.ComponentProps<typeof ProductForm>) {
  const router = useRouter()
  const colorsOn = useFieldOn('colors')
  const [selectedCategoryId, setSelectedCategoryId] = useState(product?.category_id ?? '')
  const [colors, setColors] = useState<ProductColor[]>(() => parseColors(product?.colors))
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([])
  const [cropQueue, setCropQueue] = useState<CropItem[]>([])

  useEffect(() => {
    return () => {
      stagedImages.forEach((s) => URL.revokeObjectURL(s.preview))
      cropQueue.forEach((s) => URL.revokeObjectURL(s.preview))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Colours that photos can be grouped under: named ones, and only while the field is on.
  const photoColors = colorsOn ? colors.filter((c) => c.name.trim()) : []
  const photoColorIds = new Set(photoColors.map((c) => c.id))
  const groupOf = (s: StagedImage) => (s.colorId && photoColorIds.has(s.colorId) ? s.colorId : null)

  function queueFilesForCrop(files: File[], colorId: string | null) {
    setCropQueue((prev) => [...prev, ...files.map((file) => ({ file, preview: URL.createObjectURL(file), colorId }))])
  }

  function advanceCropQueue() {
    setCropQueue((prev) => {
      URL.revokeObjectURL(prev[0].preview)
      return prev.slice(1)
    })
  }

  function stageCroppedImage(blob: Blob) {
    const { file, colorId } = cropQueue[0]
    setStagedImages((prev) => [...prev, { blob, name: file.name, preview: URL.createObjectURL(blob), colorId }])
    advanceCropQueue()
  }

  function removeStagedFile(preview: string) {
    setStagedImages((prev) => {
      const removed = prev.find((s) => s.preview === preview)
      if (removed) URL.revokeObjectURL(removed.preview)
      return prev.filter((s) => s.preview !== preview)
    })
  }

  function moveStagedFile(preview: string, colorId: string | null) {
    setStagedImages((prev) => prev.map((s) => (s.preview === preview ? { ...s, colorId } : s)))
  }

  // Upload order = display order: general photos first (the first one becomes the main photo), then each colour's.
  const orderedStaged = photoGroups(photoColors).flatMap(({ colorId }) => stagedImages.filter((s) => groupOf(s) === colorId))

  async function createWithImages(formData: FormData) {
    // createProduct always saves a draft (publishing needs a photo, and photos
    // attach to an existing product) - publish once the uploads are in.
    const wantsPublish = formData.get('is_published') === 'on'
    const id = unwrapAction(await action(formData) as ActionResult<string>)
    if (!id) throw new Error('Product creation returned no ID - please try again.')

    if (orderedStaged.length > 0) {
      const supabase = await getBrowserSupabase()
      let failures = 0
      for (const staged of orderedStaged) {
        try {
          const path = `${id}/${Date.now()}-${staged.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
          const { error: upErr } = await supabase.storage.from('product-images').upload(path, staged.blob)
          if (upErr) throw upErr
          const {
            data: { publicUrl },
          } = supabase.storage.from('product-images').getPublicUrl(path)
          unwrapAction(await addProductImage(id, publicUrl, staged.name, groupOf(staged)))
        } catch {
          failures++
        }
      }
      if (failures > 0) {
        toast.error(`${failures} image(s) failed to upload - add them from the product's edit page`)
      }
    }

    if (wantsPublish) {
      const published = await bulkUpdateProducts({ op: 'publish', ids: [id] })
      if (isActionError(published)) toast.error(published.error)
      else if (published.skipped > 0) toast.warning('Saved as a draft - publishing needs a category and at least one photo.')
    }

    router.push(`/admin/products/${id}`)
  }

  const subsForCategory = subcategories.filter((s) => s.category_id === selectedCategoryId)
  const needsPhoto = !!product && !product.is_published && imageCount === 0
  const stagedCounts = Object.fromEntries(photoColors.map((c) => [c.id, stagedImages.filter((s) => groupOf(s) === c.id).length]))
  const mainPreview = orderedStaged[0]?.preview

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
              description={
                photoColors.length
                  ? 'Add photos for each colour - customers see them when they pick that colour. They upload when you create the product.'
                  : 'Add as many as you like - square photos work best (1000 × 1000 px). They upload when you create the product.'
              }
              icon={ImagesIcon}
              tone="violet"
            >
              <div className="space-y-6">
                {photoGroups(photoColors).map(({ colorId, color }) => {
                  const group = stagedImages.filter((s) => groupOf(s) === colorId)
                  return (
                    <PhotoGroup
                      key={colorId ?? 'general'}
                      color={color}
                      showHeading={photoColors.length > 0}
                      count={group.length}
                      addLabel={color ? `Add ${color.name} photos` : 'Add photos'}
                      onAddFiles={(files) => queueFilesForCrop(files, colorId)}
                    >
                      {group.map((staged) => (
                        <div key={staged.preview} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={staged.preview} alt="" className="aspect-square w-full object-cover" />
                          {staged.preview === mainPreview && (
                            <span className="absolute left-2 top-2 rounded-md bg-slate-900/75 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                              Main
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeStagedFile(staged.preview)}
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm transition hover:bg-rose-50 hover:text-rose-600"
                            aria-label="Remove photo"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                          {photoColors.length > 0 && (
                            <div className="absolute inset-x-0 bottom-0 p-1.5">
                              <PhotoColorSelect
                                colors={photoColors}
                                value={groupOf(staged)}
                                onChange={(next) => moveStagedFile(staged.preview, next)}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </PhotoGroup>
                  )
                })}
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

          <OptionalCard
            field="colors"
            title="Colours"
            description={
              product
                ? 'The colours this product comes in. Customers pick one to see its photos. Save, then add each new colour’s photos in Photos above.'
                : 'The colours this product comes in. Each colour gets its own photo section above.'
            }
            icon={PaletteIcon}
            tone="violet"
          >
            <ProductColorsField colors={colors} onChange={setColors} photoCounts={product ? photoCounts : stagedCounts} />
          </OptionalCard>

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
                <OptionalField field="slug" htmlFor="product-slug" hint="Leave blank to generate it from the name.">
                  <input id="product-slug" name="slug" defaultValue={product?.slug} placeholder="auto from name" className={ui.input} />
                </OptionalField>
                <OptionalField field="sku" htmlFor="product-sku">
                  <input id="product-sku" name="sku" defaultValue={product?.sku ?? ''} className={ui.input} />
                </OptionalField>
              </div>
              <OptionalField field="short_description" htmlFor="product-short" hint="One line, shown on product cards.">
                <input id="product-short" name="short_description" defaultValue={product?.short_description ?? ''} className={ui.input} />
              </OptionalField>
              <OptionalField field="description" htmlFor="product-description">
                <textarea id="product-description" name="description" rows={5} defaultValue={product?.description ?? ''} className={ui.input} />
              </OptionalField>
              <OptionalField field="features" htmlFor="product-features" hint="One feature per line.">
                <textarea
                  id="product-features"
                  name="features"
                  rows={4}
                  defaultValue={(product?.features ?? []).join('\n')}
                  className={ui.input}
                />
              </OptionalField>
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
              <OptionalField field="sale_price" label="Sale price (₹)" htmlFor="product-sale" hint="Leave blank when not on offer.">
                <input id="product-sale" name="sale_price" type="number" step="0.01" defaultValue={product?.sale_price ?? ''} className={ui.input} />
              </OptionalField>
              <OptionalField field="price_display">
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
              </OptionalField>
            </div>
          </Card>

          <Card title="Details" description="Helps customers filter and compare." icon={ShapesIcon} tone="teal">
            <div className="space-y-5">
              <OptionalField field="material" htmlFor="product-material">
                <input id="product-material" name="material" defaultValue={product?.material ?? ''} className={ui.input} />
              </OptionalField>
              <OptionalField field="tags" htmlFor="product-tags" hint="Comma separated, e.g. wooden, eco-friendly.">
                <input id="product-tags" name="tags" defaultValue={(product?.tags ?? []).join(', ')} className={ui.input} />
              </OptionalField>
              <OptionalField field="age_groups">
                <div className="flex flex-wrap gap-2" role="group" aria-label="Age groups">
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
              </OptionalField>
            </div>
          </Card>

          <OptionalCard
            field="seo"
            title="Search engines"
            description="Optional - how this product appears on Google."
            icon={GlobeIcon}
            tone="gray"
          >
            <div className="space-y-5">
              <Field label="Meta title">
                <input name="seo_title" defaultValue={product?.seo_title ?? ''} className={ui.input} />
              </Field>
              <Field label="Meta description">
                <textarea name="seo_description" rows={2} defaultValue={product?.seo_description ?? ''} className={ui.input} />
              </Field>
            </div>
          </OptionalCard>
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
                <OptionalField field="subcategory">
                  <Select
                    name="subcategory_id"
                    aria-label="Subcategory"
                    defaultValue={product?.subcategory_id ?? ''}
                    options={[
                      { value: '', label: 'None' },
                      ...subsForCategory.map((s) => ({ value: s.id, label: `${s.emoji ? `${s.emoji} ` : ''}${s.name}` })),
                    ]}
                  />
                </OptionalField>
              )}
              <OptionalField field="display_order" htmlFor="product-order" hint="Lower numbers show first.">
                <input id="product-order" name="display_order" type="number" defaultValue={product?.display_order ?? 0} className={ui.input} />
              </OptionalField>
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
              <OptionalSwitch
                field="popular"
                name="popular"
                defaultChecked={product?.popular ?? false}
                label="Popular"
                description="Marks a best-seller in this admin. The homepage no longer has a Most Popular section."
              />
              <OptionalSwitch
                field="new_arrival"
                name="new_arrival"
                defaultChecked={newArrival.on}
                label="New arrival"
                description={newArrival.hint}
              />
            </div>
          </Card>

          <OptionalCard
            field="promo_tag"
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
          </OptionalCard>
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
