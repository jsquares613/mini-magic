import { createServerSupabase } from './server'

/**
 * Storage cleanup for admin-managed images. Every admin form uploads to a
 * Storage bucket and stores the resulting public URL on a row; deleting a
 * row (or replacing its image) previously left the old file behind forever.
 * Call this alongside the DB write that removes/replaces a URL.
 *
 * Best-effort by design: cleanup runs after the DB write has already
 * succeeded, so a failed/blocked storage delete must never surface as a
 * user-facing error for an otherwise-successful save/delete.
 */

function parsePublicUrl(url: string): { bucket: string; path: string } | null {
  const marker = '/storage/v1/object/public/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  const rest = url.slice(idx + marker.length)
  const slash = rest.indexOf('/')
  if (slash === -1) return null
  return { bucket: rest.slice(0, slash), path: decodeURIComponent(rest.slice(slash + 1)) }
}

/** Deletes Storage objects by public URL. Ignores null/undefined/non-Supabase URLs. */
export async function deleteStorageObjects(urls: Array<string | null | undefined>): Promise<void> {
  const byBucket = new Map<string, string[]>()
  for (const url of urls) {
    if (!url) continue
    const parsed = parsePublicUrl(url)
    if (!parsed) continue
    const list = byBucket.get(parsed.bucket) ?? []
    list.push(parsed.path)
    byBucket.set(parsed.bucket, list)
  }
  if (byBucket.size === 0) return

  const supabase = createServerSupabase()
  await Promise.all(
    Array.from(byBucket.entries()).map(([bucket, paths]) =>
      supabase
        .storage.from(bucket)
        .remove(paths)
        .catch((err) => console.error(`[storage] cleanup failed for bucket "${bucket}":`, err)),
    ),
  )
}

/** Deletes a single Storage object by public URL, if `url` replaced/removed an old one that differs. */
export async function deleteStorageObjectIfChanged(oldUrl: string | null | undefined, newUrl: string | null | undefined) {
  if (!oldUrl || oldUrl === newUrl) return
  await deleteStorageObjects([oldUrl])
}
