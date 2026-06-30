'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createBrowserSupabase } from '@/lib/supabase/browser'
import Spinner from './Spinner'
import ImageCropModal from './ImageCropModal'

/**
 * Generic image uploader for use inside a <form>. Uploads to a Storage bucket
 * and writes the resulting public URL into a hidden input (`name`) so it is
 * submitted with the surrounding form's Server Action.
 *
 * When `aspectRatio` is given, the picked file is cropped to that ratio
 * (via a modal) before upload, so the stored image already matches the box
 * it renders in instead of relying on CSS `object-cover` to crop it later.
 */
export default function ImageUploadField({
  bucket,
  name,
  label,
  defaultUrl = null,
  aspectRatio,
}: {
  bucket: string
  name: string
  label: string
  defaultUrl?: string | null
  aspectRatio?: number
}) {
  const [url, setUrl] = useState<string | null>(defaultUrl)
  const [busy, setBusy] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  async function uploadToBucket(path: string, body: Blob) {
    setBusy(true)
    try {
      const supabase = createBrowserSupabase()
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
      void uploadToBucket(`${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`, file)
    }
  }

  function closeCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-gray-700">{label}</p>
      <input type="hidden" name={name} value={url ?? ''} readOnly />
      {url ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={label} className="h-24 w-40 rounded-lg border border-gray-200 object-cover" />
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
          {busy ? 'Uploading…' : '+ Upload'}
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
