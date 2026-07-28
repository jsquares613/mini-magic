'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { updateCategoryImage } from '@/app/admin/(protected)/categories/actions'
import Spinner from './Spinner'
import ImageCropModal from './ImageCropModal'

export default function CategoryImageField({
  categoryId,
  field,
  label,
  current,
  aspectRatio,
  hint,
}: {
  categoryId: string
  field: 'image' | 'banner_image'
  label: string
  current: string | null
  /** Crop the picked file to this ratio before upload (e.g. 1 for square). */
  aspectRatio: number
  /** Recommended pixel dimensions shown under the label, e.g. "800 × 800px (square)". */
  hint?: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  async function uploadBlob(blob: Blob, extension: string) {
    setBusy(true)
    try {
      const supabase = createBrowserSupabase()
      const path = `${categoryId}/${field}-${Date.now()}.${extension}`
      const { error: upErr } = await supabase.storage.from('category-images').upload(path, blob, { upsert: true })
      if (upErr) throw upErr
      const {
        data: { publicUrl },
      } = supabase.storage.from('category-images').getPublicUrl(path)
      await updateCategoryImage(categoryId, field, publicUrl)
      toast.success('Image uploaded successfully')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setCropSrc(URL.createObjectURL(file))
  }

  function closeCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  async function remove() {
    setBusy(true)
    try {
      await updateCategoryImage(categoryId, field, null)
      toast.success('Image removed successfully')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove image')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-gray-700">{label}</p>
      {hint && <p className="mb-1.5 text-xs text-gray-400">Recommended size: {hint}</p>}
      {current ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current} alt={label} className="h-28 w-28 rounded-lg border border-gray-200 object-cover" />
          <button
            onClick={remove}
            disabled={busy}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 text-xs text-white disabled:opacity-60"
          >
            {busy ? <Spinner className="h-3 w-3" /> : '×'}
          </button>
        </div>
      ) : (
        <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-center text-xs text-gray-500 hover:border-blue-400">
          {busy && <Spinner className="h-3.5 w-3.5" />}
          {busy ? 'Uploading…' : '+ Upload'}
          <input type="file" accept="image/*" onChange={onFile} disabled={busy} className="hidden" />
        </label>
      )}

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspectRatio={aspectRatio}
          onCancel={closeCrop}
          onCropped={(blob) => {
            closeCrop()
            void uploadBlob(blob, 'jpg')
          }}
        />
      )}
    </div>
  )
}
