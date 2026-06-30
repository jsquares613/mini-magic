'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { addProductImage, deleteProductImage, setPrimaryImage } from '@/app/admin/(protected)/products/actions'
import type { Tables } from '@/lib/supabase/database.types'
import Spinner from './Spinner'
import ImageCropModal from './ImageCropModal'

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
      await addProductImage(productId, publicUrl, name)
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
      await setPrimaryImage(imageId, productId)
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
      await deleteProductImage(imageId, productId)
      toast.success('Image deleted successfully')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete image')
    } finally {
      setBusyImageId(null)
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 font-bold text-gray-900">Images</h2>

      <label className="mb-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 transition hover:border-blue-400 hover:text-blue-600">
        {uploading && <Spinner className="h-4 w-4" />}
        {uploading ? 'Uploading…' : '+ Upload images'}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={queueFilesForCrop}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {cropQueue.length > 0 && (
        <ImageCropModal
          imageSrc={cropQueue[0].preview}
          aspectRatio={1}
          title={cropQueue.length > 1 ? `Crop image (1 of ${cropQueue.length})` : 'Crop image'}
          onCancel={advanceCropQueue}
          onCropped={uploadCropped}
        />
      )}

      {images.length === 0 ? (
        <p className="text-sm text-gray-400">No images yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img) => {
            const busy = busyImageId === img.id
            return (
              <div key={img.id} className="group relative overflow-hidden rounded-lg border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.image_url} alt={img.alt_text ?? ''} className="aspect-square w-full object-cover" />
                {img.is_primary && (
                  <span className="absolute left-1 top-1 rounded bg-blue-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    Primary
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/50 p-1 opacity-0 transition group-hover:opacity-100">
                  {!img.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(img.id)}
                      disabled={busy}
                      className="text-[10px] font-medium text-white hover:underline disabled:opacity-60"
                    >
                      {busy ? 'Working…' : 'Set primary'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(img.id)}
                    disabled={busy}
                    className="ml-auto text-[10px] font-medium text-red-300 hover:underline disabled:opacity-60"
                  >
                    {busy ? 'Working…' : 'Delete'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
