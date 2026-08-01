'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { isVideo } from '@/lib/media'
import Spinner from './Spinner'
import ImageCropModal from './ImageCropModal'

const MAX_IMAGE_DIM = 2400
const MAX_VIDEO_MB = 100

function resizeImage(file: File, maxDim = MAX_IMAGE_DIM): Promise<Blob> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { naturalWidth: w, naturalHeight: h } = img
      if (w <= maxDim && h <= maxDim) { resolve(file); return }
      const scale = maxDim / Math.max(w, h)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(w * scale)
      canvas.height = Math.round(h * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', 0.85)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

export default function MediaUploadField({
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
  /** When set, images are cropped to this ratio before upload. Videos skip crop. */
  aspectRatio?: number
  hint?: string
}) {
  const [url, setUrl] = useState<string | null>(defaultUrl)
  const [busy, setBusy] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  async function upload(path: string, body: Blob, contentType?: string) {
    setBusy(true)
    try {
      const supabase = createBrowserSupabase()
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, body, contentType ? { contentType } : undefined)
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
      setUrl(publicUrl)
      toast.success('Uploaded successfully')
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

    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`

    if (file.type.startsWith('video/')) {
      if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
        toast.error(`Video must be under ${MAX_VIDEO_MB} MB`)
        return
      }
      void upload(path, file, file.type)
      return
    }

    // Image path
    if (aspectRatio) {
      setCropSrc(URL.createObjectURL(file))
    } else {
      resizeImage(file).then((blob) => upload(path, blob))
    }
  }

  function closeCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  const isVid = isVideo(url)

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-gray-700">{label}</p>
      {hint && <p className="mb-1.5 text-xs text-gray-400">Recommended size: {hint}</p>}
      <input type="hidden" name={name} value={url ?? ''} readOnly />

      {url ? (
        <div className="relative inline-block">
          {isVid ? (
            <video src={url} muted playsInline className="h-24 w-40 rounded-lg border border-gray-200 object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={label} className="h-24 w-40 rounded-lg border border-gray-200 object-cover" />
          )}
          <button
            type="button"
            onClick={() => setUrl(null)}
            className="absolute -right-2 -top-2 rounded-full bg-red-500 px-2 text-xs text-white"
          >
            ×
          </button>
        </div>
      ) : (
        <label className="flex h-24 w-40 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 text-xs text-gray-500 hover:border-blue-400">
          {busy && <Spinner className="h-3.5 w-3.5" />}
          {busy ? 'Uploading…' : '+ Image or Video'}
          <input
            type="file"
            accept="image/*,video/*"
            onChange={onFile}
            disabled={busy}
            className="hidden"
          />
        </label>
      )}

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspectRatio={aspectRatio ?? 1}
          onCancel={closeCrop}
          onCropped={(blob) => {
            closeCrop()
            void upload(`${Date.now()}.jpg`, blob)
          }}
        />
      )}
    </div>
  )
}
