'use client'

import { useEffect, useState } from 'react'
import { friendlyUploadError } from '@/lib/admin/errors'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getBrowserSupabase } from '@/lib/supabase/lazyBrowser'
import {
  addProductImage,
  deleteProductImage,
  setPrimaryImage,
  setProductImageColor,
} from '@/app/admin/(protected)/products/actions'
import { unwrapAction } from '@/lib/admin/actionResult'
import type { Tables } from '@/lib/supabase/database.types'
import type { ProductColor } from '@/lib/productColors'
import AdminImage from './AdminImage'
import Spinner from './Spinner'
import { PhotoColorSelect, PhotoGroup, photoGroups } from './PhotoGroups'
import { Card } from './ui'
import { ImagesIcon, StarIcon, TrashIcon } from './icons'

// The cropper (react-easy-crop) loads only when a crop dialog opens.
const ImageCropModal = dynamic(() => import('./ImageCropModal'), { ssr: false })

type ProductImage = Tables<'product_images'>

/**
 * Uploads product images to the `product-images` Storage bucket, then records
 * them via Server Actions. Photos are grouped into general photos plus one
 * group per saved product colour; each photo can be made main, moved to
 * another colour, or deleted.
 */
export default function ImageManager({
  productId,
  images,
  colors = [],
}: {
  productId: string
  images: ProductImage[]
  /** The product's saved colours (products.colors). */
  colors?: ProductColor[]
}) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [busyImageId, setBusyImageId] = useState<string | null>(null)
  const [cropQueue, setCropQueue] = useState<{ file: File; preview: string; colorId: string | null }[]>([])

  useEffect(() => {
    return () => cropQueue.forEach((q) => URL.revokeObjectURL(q.preview))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function queueFilesForCrop(files: File[], colorId: string | null) {
    setCropQueue((prev) => [...prev, ...files.map((file) => ({ file, preview: URL.createObjectURL(file), colorId }))])
  }

  function advanceCropQueue() {
    setCropQueue((prev) => {
      URL.revokeObjectURL(prev[0].preview)
      return prev.slice(1)
    })
  }

  async function uploadCropped(blob: Blob) {
    const { file, colorId } = cropQueue[0]
    const name = file.name
    setUploading(true)
    try {
      const supabase = await getBrowserSupabase()
      const path = `${productId}/${Date.now()}-${name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
      const { error: upErr } = await supabase.storage.from('product-images').upload(path, blob)
      if (upErr) throw upErr
      const {
        data: { publicUrl },
      } = supabase.storage.from('product-images').getPublicUrl(path)
      unwrapAction(await addProductImage(productId, publicUrl, name, colorId))
      toast.success('Image uploaded successfully')
      router.refresh()
    } catch (err) {
      toast.error(friendlyUploadError(err, 'Upload failed. Please try again.'))
    } finally {
      setUploading(false)
      advanceCropQueue()
    }
  }

  async function runImageAction(imageId: string, run: () => Promise<{ error: string } | void>, success: string, failure: string) {
    setBusyImageId(imageId)
    try {
      unwrapAction(await run())
      toast.success(success)
      router.refresh()
    } catch (err) {
      toast.error(friendlyUploadError(err, failure))
    } finally {
      setBusyImageId(null)
    }
  }

  const colorIds = new Set(colors.map((c) => c.id))
  const groupOf = (img: ProductImage) => (img.color_id && colorIds.has(img.color_id) ? img.color_id : null)
  const hasColors = colors.length > 0
  const nameOf = (colorId: string | null) => colors.find((c) => c.id === colorId)?.name

  return (
    <Card
      title="Photos"
      description={
        hasColors
          ? 'Add photos for each colour - customers see them when they pick that colour. General photos show for every colour.'
          : 'Square photos work best (1000 × 1000 px). The main photo is used on product cards. Add colours below to give each colour its own photos.'
      }
      icon={ImagesIcon}
      tone="violet"
      actions={uploading && <Spinner className="h-4 w-4 text-slate-500" />}
    >
      {images.length === 0 && !hasColors && (
        <p className="mb-3 text-xs text-slate-500">A product needs at least one photo before it can be published.</p>
      )}
      <div className="space-y-6">
        {photoGroups(colors).map(({ colorId, color }) => {
          const groupImages = images.filter((img) => groupOf(img) === colorId)
          return (
            <PhotoGroup
              key={colorId ?? 'general'}
              color={color}
              showHeading={hasColors}
              count={groupImages.length}
              disabled={uploading}
              addLabel={uploading ? 'Uploading…' : color ? `Add ${color.name} photos` : 'Add photos'}
              onAddFiles={(files) => queueFilesForCrop(files, colorId)}
            >
              {groupImages.map((img) => {
                const busy = busyImageId === img.id
                return (
                  <div key={img.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <AdminImage src={img.image_url} alt={img.alt_text ?? ''} width={240} className="aspect-square w-full object-cover" />
                    {img.is_primary && (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-slate-900/75 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        <StarIcon className="h-3 w-3" />
                        Main
                      </span>
                    )}
                    {busy && (
                      <span className="absolute inset-0 flex items-center justify-center bg-white/60">
                        <Spinner className="h-5 w-5 text-slate-600" />
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 space-y-1 bg-gradient-to-t from-slate-900/70 to-transparent p-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <PhotoColorSelect
                        colors={colors}
                        value={groupOf(img)}
                        disabled={busy}
                        onChange={(next) =>
                          runImageAction(
                            img.id,
                            () => setProductImageColor(img.id, productId, next),
                            next ? `Moved to ${nameOf(next)}` : 'Now shown for all colours',
                            'Failed to move photo',
                          )
                        }
                      />
                      <div className="flex items-center justify-between gap-1">
                        {!img.is_primary ? (
                          <button
                            type="button"
                            onClick={() =>
                              runImageAction(img.id, () => setPrimaryImage(img.id, productId), 'Primary image updated', 'Failed to update primary image')
                            }
                            disabled={busy}
                            className="rounded-md bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-800 transition hover:bg-white disabled:opacity-60"
                          >
                            Make main
                          </button>
                        ) : (
                          <span />
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            runImageAction(img.id, () => deleteProductImage(img.id, productId), 'Image deleted successfully', 'Failed to delete image')
                          }
                          disabled={busy}
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-slate-700 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
                          aria-label="Delete photo"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </PhotoGroup>
          )
        })}
      </div>

      {cropQueue.length > 0 && (
        <ImageCropModal
          imageSrc={cropQueue[0].preview}
          aspectRatio={1}
          title={
            (cropQueue[0].colorId ? `Crop ${nameOf(cropQueue[0].colorId) ?? ''} photo` : 'Crop image') +
            (cropQueue.length > 1 ? ` (1 of ${cropQueue.length})` : '')
          }
          onCancel={advanceCropQueue}
          onCropped={uploadCropped}
        />
      )}
    </Card>
  )
}
