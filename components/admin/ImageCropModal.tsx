'use client'

import { useCallback, useEffect, useState, type ComponentType } from 'react'
import EasyCrop, { type Area, type CropperProps } from 'react-easy-crop'
import { getCroppedImageBlob } from '@/lib/admin/cropImage'
import { buttonClass, iconButtonClass } from './ui'
import { XIcon } from './icons'

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onCancel} className={iconButtonClass()} aria-label="Close">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="relative h-80 w-full overflow-hidden rounded-xl bg-slate-900">
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

          <div className="mt-5 flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Zoom"
              className="w-full accent-blue-900"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <button type="button" onClick={onCancel} className={buttonClass('ghost')}>
            Cancel
          </button>
          <button type="button" onClick={confirm} disabled={busy || !croppedAreaPixels} className={buttonClass()}>
            {busy ? 'Cropping…' : 'Crop & use'}
          </button>
        </div>
      </div>
    </div>
  )
}
