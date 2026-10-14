'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import { isVideo } from '@/lib/media'
import Spinner from './Spinner'
import ImageCropModal from './ImageCropModal'
import { TrashIcon, UploadIcon, VideoIcon } from './icons'

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
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {hint && <p className="mb-2 text-xs text-slate-500">Recommended: {hint}</p>}
      <input type="hidden" name={name} value={url ?? ''} readOnly />

      {url ? (
        <div className="group relative h-36 w-64 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-900/5">
          {isVid ? (
            <video src={url} muted playsInline className="h-full w-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={label} className="h-full w-full object-cover" />
          )}
          {isVid && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-slate-900/75 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              <VideoIcon className="h-3 w-3" />
              Video
            </span>
          )}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/50 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50">
              <UploadIcon className="h-3.5 w-3.5" />
              Replace
              <input type="file" accept="image/*,video/*" onChange={onFile} disabled={busy} className="hidden" />
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
        <label className="flex h-36 w-64 max-w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-4 text-center text-xs font-medium text-slate-500 transition hover:border-blue-400 hover:bg-blue-50/40 hover:text-blue-700">
          {busy ? <Spinner className="h-5 w-5" /> : <UploadIcon className="h-5 w-5" />}
          {busy ? 'Uploading…' : 'Upload image or video'}
          {!busy && <span className="font-normal text-slate-400">MP4 up to {MAX_VIDEO_MB} MB</span>}
          <input type="file" accept="image/*,video/*" onChange={onFile} disabled={busy} className="hidden" />
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
