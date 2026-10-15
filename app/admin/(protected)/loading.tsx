import PageSkeleton from '@/components/admin/Skeleton'

/** Instant feedback when switching admin sections (and a cheap prefetch boundary). */
export default function AdminLoading() {
  return <PageSkeleton variant="list" />
}
