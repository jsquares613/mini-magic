'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { addProductImage, deleteProductImage, setPrimaryImage } from '@/app/admin/(protected)/products/actions'
import { unwrapAction } from '@/lib/admin/actionResult'
import type { Tables } from '@/lib/supabase/database.types'
import Spinner from './Spinner'
import ImageCropModal from './ImageCropModal'
import { Card, buttonClass } from './ui'
import { ImagesIcon, StarIcon, TrashIcon, UploadIcon } from './icons'

type ProductImage = Tables<'product_images'>

/**
 * Uploads product images to the `product-images` Storage bucket, then records
 * them via Server Actions. Lists existing images with set-primary / delete.
 */
export default function ImageManager({
  productId,
  images,
}: {
  productId: string
  images: ProductImage[]
}) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [busyImageId, setBusyImageId] = useState<string | null>(null)
  const [cropQueue, setCropQueue] = useState<{ file: File; preview: string }[]>([])

  useEffect(() => {
    return () => cropQueue.forEach((q) => URL.revokeObjectURL(q.preview))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function queueFilesForCrop(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length) {
      setCropQueue((prev) => [...prev, ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))])
    }
  }

  function advanceCropQueue() {
    setCropQueue((prev) => {
      URL.revokeObjectURL(prev[0].preview)
      return prev.slice(1)
    })
  }

  async function uploadCropped(blob: Blob) {
    const name = cropQueue[0].file.name
    setUploading(true)
    try {
      const supabase = createBrowserSupabase()
      const path = `${productId}/${Date.now()}-${name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
      const { error: upErr } = await supabase.storage.from('product-images').upload(path, blob)
      if (upErr) throw upErr
      const {
        data: { publicUrl },
      } = supabase.storage.from('product-images').getPublicUrl(path)
      unwrapAction(await addProductImage(productId, publicUrl, name))
      toast.success('Image uploaded successfully')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      advanceCropQueue()
    }
  }

  async function handleSetPrimary(imageId: string) {
    setBusyImageId(imageId)
    try {
      unwrapAction(await setPrimaryImage(imageId, productId))
      toast.success('Primary image updated')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update primary image')
    } finally {
      setBusyImageId(null)
    }
  }

  async function handleDelete(imageId: string) {
    setBusyImageId(imageId)
    try {
      unwrapAction(await deleteProductImage(imageId, productId))
      toast.success('Image deleted successfully')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete image')
    } finally {
      setBusyImageId(null)
    }
  }

  const uploadInput = (
    <input type="file" accept="image/*" multiple onChange={queueFilesForCrop} disabled={uploading} className="hidden" />
  )

  return (
    <Card
      title="Photos"
      description="Square photos work best (1000 × 1000 px). The main photo is used on product cards."
      icon={ImagesIcon}
      tone="violet"
      actions={
        images.length > 0 && (
          <label className={buttonClass('secondary', 'sm', `cursor-pointer ${uploading ? 'pointer-events-none opacity-60' : ''}`)}>
            {uploading ? <Spinner className="h-3.5 w-3.5" /> : <UploadIcon className="h-3.5 w-3.5" />}
            {uploading ? 'Uploading…' : 'Upload'}
            {uploadInput}
          </label>
        )
      }
    >
      {images.length === 0 ? (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
            {uploading ? <Spinner className="h-5 w-5" /> : <UploadIcon className="h-5 w-5" />}
          </span>
          <span className="text-sm font-semibold text-slate-800">{uploading ? 'Uploading…' : 'Upload photos'}</span>
          <span className="text-xs text-slate-500">A product needs at least one photo before it can be published.</span>
          {uploadInput}
        </label>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {images.map((img) => {
            const busy = busyImageId === img.id
            return (
              <div key={img.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.image_url} alt={img.alt_text ?? ''} className="aspect-square w-full object-cover" />
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
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-slate-900/70 to-transparent p-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  {!img.is_primary ? (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(img.id)}
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
                    onClick={() => handleDelete(img.id)}
                    disabled={busy}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-slate-700 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
                    aria-label="Delete photo"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {cropQueue.length > 0 && (
        <ImageCropModal
          imageSrc={cropQueue[0].preview}
          aspectRatio={1}
          title={cropQueue.length > 1 ? `Crop image (1 of ${cropQueue.length})` : 'Crop image'}
          onCancel={advanceCropQueue}
          onCropped={uploadCropped}
        />
      )}
    </Card>
  )
}
