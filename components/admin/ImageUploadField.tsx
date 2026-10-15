'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { getBrowserSupabase } from '@/lib/supabase/lazyBrowser'
import AdminImage from './AdminImage'
import Spinner from './Spinner'
import { TrashIcon, UploadIcon } from './icons'

// The cropper (react-easy-crop) loads only when a crop dialog opens.
const ImageCropModal = dynamic(() => import('./ImageCropModal'), { ssr: false })

/**
 * Generic image uploader for use inside a <form>. Uploads to a Storage bucket
 * and writes the resulting public URL into a hidden input (`name`) so it is
 * submitted with the surrounding form's Server Action.
 *
 * When `aspectRatio` is given, the picked file is cropped to that ratio
 * (via a modal) before upload, so the stored image already matches the box
 * it renders in instead of relying on CSS `object-cover` to crop it later.
 *
 * For non-cropped uploads (no aspectRatio), large images are resized
 * client-side before upload so we never store 6 000 × 4 000 originals in
 * Supabase Storage.
 */

const MAX_UPLOAD_DIM = 2400 // px — longest edge cap for non-cropped uploads

/**
 * Resizes an image file so its longest edge is at most `maxDim` pixels.
 * Files already within the limit are returned unchanged (no re-encode).
 * Outputs JPEG at 0.85 quality to match the crop utility.
 */
function resizeBeforeUpload(file: File, maxDim = MAX_UPLOAD_DIM): Promise<Blob> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { naturalWidth: w, naturalHeight: h } = img
      if (w <= maxDim && h <= maxDim) {
        resolve(file)
        return
      }
      const scale = maxDim / Math.max(w, h)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(w * scale)
      canvas.height = Math.round(h * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => resolve(blob ?? file),
        'image/jpeg',
        0.85,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file) // fallback: upload original on decode error
    }
    img.src = url
  })
}
export default function ImageUploadField({
  bucket,
  name,
  label,
  defaultUrl = null,
  aspectRatio,
  hint,
}: {
  bucket: string
  name: string
  label: string
  defaultUrl?: string | null
  aspectRatio?: number
  /** Recommended pixel dimensions shown under the label, e.g. "1600 × 900px (16:9)". */
  hint?: string
}) {
  const [url, setUrl] = useState<string | null>(defaultUrl)
  const [busy, setBusy] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  async function uploadToBucket(path: string, body: Blob) {
    setBusy(true)
    try {
      const supabase = await getBrowserSupabase()
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, body)
      if (upErr) throw upErr
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(path)
      setUrl(publicUrl)
      toast.success('Image uploaded successfully')
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
    if (aspectRatio) {
      setCropSrc(URL.createObjectURL(file))
    } else {
      const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
      resizeBeforeUpload(file).then((blob) => uploadToBucket(path, blob))
    }
  }

  function closeCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  return (
    <div>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {hint && <p className="mb-2 text-xs text-slate-500">Recommended: {hint}</p>}
      <input type="hidden" name={name} value={url ?? ''} readOnly />
      {url ? (
        <div className="group relative h-32 w-48 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <AdminImage src={url} alt={label} width={192} className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/50 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50">
              <UploadIcon className="h-3.5 w-3.5" />
              Replace
              <input type="file" accept="image/*" onChange={onFile} disabled={busy} className="hidden" />
            </label>
            <button
              type="button"
              onClick={() => setUrl(null)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Spinner className="h-5 w-5 text-slate-600" />
            </span>
          )}
        </div>
      ) : (
        <label className="flex h-32 w-48 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 text-xs font-medium text-slate-500 transition hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-700">
          {busy ? <Spinner className="h-5 w-5" /> : <UploadIcon className="h-5 w-5" />}
          {busy ? 'Uploading…' : 'Upload image'}
          <input type="file" accept="image/*" onChange={onFile} disabled={busy} className="hidden" />
        </label>
      )}

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspectRatio={aspectRatio ?? 1}
          onCancel={closeCrop}
          onCropped={(blob) => {
            closeCrop()
            void uploadToBucket(`${Date.now()}.jpg`, blob)
          }}
        />
      )}
    </div>
  )
}
