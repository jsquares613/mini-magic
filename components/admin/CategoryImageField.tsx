'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { updateCategoryImage } from '@/app/admin/(protected)/categories/actions'
import { unwrapAction } from '@/lib/admin/actionResult'
import Spinner from './Spinner'
import ImageCropModal from './ImageCropModal'
import { TrashIcon, UploadIcon } from './icons'

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
      unwrapAction(await updateCategoryImage(categoryId, field, publicUrl))
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
      unwrapAction(await updateCategoryImage(categoryId, field, null))
      toast.success('Image removed successfully')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove image')
    } finally {
      setBusy(false)
    }
  }

  const box = aspectRatio === 1 ? 'h-36 w-36' : 'h-36 w-64'

  return (
    <div>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {hint && <p className="mb-2 text-xs text-slate-500">Recommended: {hint}</p>}
      {current ? (
        <div className={`group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 ${box}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current} alt={label} className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/50 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
            {busy ? (
              <Spinner className="h-5 w-5 text-white" />
            ) : (
              <>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50">
                  <UploadIcon className="h-3.5 w-3.5" />
                  Replace
                  <input type="file" accept="image/*" onChange={onFile} disabled={busy} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={remove}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  Remove
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <label
          className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 text-center text-xs font-medium text-slate-500 transition hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-700 ${box}`}
        >
          {busy ? <Spinner className="h-5 w-5" /> : <UploadIcon className="h-5 w-5" />}
          {busy ? 'Uploading…' : 'Upload image'}
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
