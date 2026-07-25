import type { Area } from 'react-easy-crop'

// Caps the longest edge of any cropped export. A hero or banner shown at
// most 1 280 px wide gains nothing from storing a 4 000 px original — it
// just wastes storage and makes the Next.js optimizer work harder on every
// cache miss.
const MAX_OUTPUT_DIM = 2400

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Draws the cropped pixel area onto a canvas and exports it as a JPEG blob. */
export async function getCroppedImageBlob(imageSrc: string, area: Area): Promise<Blob> {
  const image = await loadImage(imageSrc)

  // Scale down if either crop dimension exceeds MAX_OUTPUT_DIM.
  const scale = Math.min(1, MAX_OUTPUT_DIM / Math.max(area.width, area.height))
  const outW = Math.round(area.width * scale)
  const outH = Math.round(area.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, outW, outH)

  return new Promise((resolve, reject) => {
    // 0.85 quality: visually indistinguishable from 0.92 in most images,
    // ~15–20 % smaller file — meaningful over hundreds of product uploads.
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Crop failed'))), 'image/jpeg', 0.85)
  })
}
