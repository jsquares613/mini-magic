import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { timeAgo } from '@/lib/format'
import { ENQUIRY_CHANNEL, ENQUIRY_STATUS, ENQUIRY_STATUS_ORDER, ENQUIRY_TYPE } from '@/lib/admin/enquiryLabels'
import { enquiryStatusCounts } from '@/lib/admin/counts'
import { Avatar, Badge, Card, EmptyState, Page, PageHeader, TabLinks, buttonClass, ui } from '@/components/admin/ui'
import IntentLink from '@/components/admin/IntentLink'
import { ChevronLeftIcon, ChevronRightIcon, InboxIcon, XIcon } from '@/components/admin/icons'
import type { Enums } from '@/lib/supabase/database.types'

type Status = Enums<'enquiry_status'>
type EnquiryType = Enums<'enquiry_type'>

const PAGE_SIZE = 50

export default async function EnquiriesPage({ searchParams }: { searchParams: { status?: string; type?: string; page?: string } }) {
  const status = ENQUIRY_STATUS_ORDER.includes(searchParams.status as Status) ? (searchParams.status as Status) : null
  const type = searchParams.type && searchParams.type in ENQUIRY_TYPE ? (searchParams.type as EnquiryType) : null
  const page = Math.max(1, Number(searchParams.page) || 1)
  const from = (page - 1) * PAGE_SIZE

  const supabase = createServerSupabase()
  // One page of the columns the table shows (the list grows forever — never load it all).
  let query = supabase
    .from('enquiries')
    .select('id, name, phone, enquiry_type, subject, channel, status, created_at', { count: 'exact' })
  if (status) query = query.eq('status', status)
  if (type) query = query.eq('enquiry_type', type)

  const [{ data: enquiries, count: matching, error }, counts] = await Promise.all([
    query.order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1),
    enquiryStatusCounts(supabase, type),
  ])
  if (error) throw new Error(`Could not load enquiries: ${error.message}`)

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)
  const shown = matching ?? 0
  const pageCount = Math.max(1, Math.ceil(shown / PAGE_SIZE))

  const href = (s: Status | null, p = 1) => {
    const params = new URLSearchParams()
    if (s) params.set('status', s)
    if (type) params.set('type', type)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return qs ? `/admin/enquiries?${qs}` : '/admin/enquiries'
  }

  return (
    <Page>
      <PageHeader
        title="Enquiries"
        description="Leads from the website, WhatsApp and phone. Open one to follow up, add notes and record the outcome."
        meta={type ? (
          <Link prefetch={false} href={status ? `/admin/enquiries?status=${status}` : '/admin/enquiries'} className="inline-flex">
            <Badge tone="blue" icon={XIcon}>
              {ENQUIRY_TYPE[type]} only
            </Badge>
          </Link>
        ) : undefined}
      />

      <TabLinks
        label="Enquiry status"
        active={status ?? 'all'}
        tabs={[
          { key: 'all', label: 'All', href: href(null), count: total },
          ...ENQUIRY_STATUS_ORDER.map((s) => ({ key: s, label: ENQUIRY_STATUS[s].label, href: href(s), count: counts[s] })),
        ]}
      />

      <Card bodyClassName="p-0">
        {enquiries && enquiries.length > 0 ? (
          <div className="admin-scroll overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={ui.thead}>
                <tr>
                  <th className={ui.th}>Contact</th>
                  <th className={ui.th}>Enquiry</th>
                  <th className={ui.th}>Channel</th>
                  <th className={ui.th}>Status</th>
                  <th className={ui.th}>Received</th>
                  <th className={ui.th}>
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enquiries.map((e) => (
                  <tr key={e.id} className="group transition hover:bg-slate-50/70">
                    <td className={ui.td}>
                      <div className="flex items-center gap-3">
                        <Avatar name={e.name} size="sm" />
                        <div className="min-w-0">
                          <IntentLink href={`/admin/enquiries/${e.id}`} className="font-medium text-slate-900 hover:text-blue-700 hover:underline">
                            {e.name}
                          </IntentLink>
                          <p className="text-xs text-slate-500">{e.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className={ui.td}>
                      <p className="font-medium text-slate-700">{ENQUIRY_TYPE[e.enquiry_type]}</p>
                      {e.subject && <p className="max-w-xs truncate text-xs text-slate-500">{e.subject}</p>}
                    </td>
                    <td className={`${ui.td} text-slate-600`}>{ENQUIRY_CHANNEL[e.channel]}</td>
                    <td className={ui.td}>
                      <Badge tone={ENQUIRY_STATUS[e.status].tone} dot>
                        {ENQUIRY_STATUS[e.status].label}
                      </Badge>
                    </td>
                    <td className={`${ui.td} whitespace-nowrap text-slate-500`} title={new Date(e.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}>
                      {timeAgo(e.created_at)}
                    </td>
                    <td className={`${ui.td} text-right`}>
                      <IntentLink
                        href={`/admin/enquiries/${e.id}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label={`Open enquiry from ${e.name}`}
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </IntentLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={InboxIcon}
            title={status ? `No ${ENQUIRY_STATUS[status].label.toLowerCase()} enquiries` : 'No enquiries yet'}
            description="New leads from the website will appear here."
          />
        )}
      </Card>

      {shown > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span>
            Showing <span className="font-medium text-slate-700">{(from + 1).toLocaleString('en-IN')}</span>–
            <span className="font-medium text-slate-700">{Math.min(from + PAGE_SIZE, shown).toLocaleString('en-IN')}</span> of{' '}
            <span className="font-medium text-slate-700">{shown.toLocaleString('en-IN')}</span>
          </span>
          {pageCount > 1 && (
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link prefetch={false} href={href(status, page - 1)} className={buttonClass('secondary', 'sm', 'h-9')}>
                  <ChevronLeftIcon className="h-4 w-4" />
                  Prev
                </Link>
              ) : (
                <span className={buttonClass('secondary', 'sm', 'h-9 cursor-not-allowed opacity-50')} aria-disabled="true">
                  <ChevronLeftIcon className="h-4 w-4" />
                  Prev
                </span>
              )}
              <span className="px-1 tabular-nums">
                Page {page} of {pageCount.toLocaleString('en-IN')}
              </span>
              {page < pageCount ? (
                <Link prefetch={false} href={href(status, page + 1)} className={buttonClass('secondary', 'sm', 'h-9')}>
                  Next
                  <ChevronRightIcon className="h-4 w-4" />
                </Link>
              ) : (
                <span className={buttonClass('secondary', 'sm', 'h-9 cursor-not-allowed opacity-50')} aria-disabled="true">
                  Next
                  <ChevronRightIcon className="h-4 w-4" />
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Page>
  )
}
