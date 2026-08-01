const VIDEO_EXTS = /\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i

export function isVideo(url: string | null | undefined): url is string {
  return !!url && VIDEO_EXTS.test(url)
}
