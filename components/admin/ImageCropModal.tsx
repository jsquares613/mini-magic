'use client'

import { useCallback, useEffect, useState, type ComponentType } from 'react'
import EasyCrop, { type Area, type CropperProps } from 'react-easy-crop'
import { getCroppedImageBlob } from '@/lib/admin/cropImage'

// react-easy-crop's `Cropper` is a class component typed against React 18,
// which @types/react@19 (pinned in this project, ahead of the react@18
// runtime) doesn't recognise as a valid JSX element type, and its
// `static defaultProps` aren't reflected as optional in `CropperProps`
// under that typing. Cast once here (Partial + the fields we actually pass)
// rather than touching the pinned React types project-wide.
type MinimalCropperProps = Partial<CropperProps> & Pick<CropperProps, 'image' | 'crop' | 'onCropChange'>
const Cropper = EasyCrop as unknown as ComponentType<MinimalCropperProps>

export default function ImageCropModal({
  imageSrc,
  aspectRatio,
  title = 'Crop image',
  onCancel,
  onCropped,
}: {
  imageSrc: string
  aspectRatio: number
  title?: string
  onCancel: () => void
  onCropped: (blob: Blob) => void
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onCancel])

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => setCroppedAreaPixels(areaPixels), [])

  async function confirm() {
    if (!croppedAreaPixels) return
    setBusy(true)
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels)
      onCropped(blob)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-900">{title}</h2>

        <div className="relative h-80 w-full overflow-hidden rounded-lg bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Zoom"
          className="mt-4 w-full"
        />

        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy || !croppedAreaPixels}
            className="rounded-full bg-blue-900 px-5 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {busy ? 'Cropping…' : 'Crop & Use'}
          </button>
        </div>
      </div>
    </div>
  )
}
