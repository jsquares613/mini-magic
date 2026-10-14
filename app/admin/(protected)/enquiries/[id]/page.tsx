import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import { timeAgo } from '@/lib/format'
import { CONTACT_PREFERENCE, ENQUIRY_CHANNEL, ENQUIRY_STATUS, ENQUIRY_STATUS_ORDER, ENQUIRY_TYPE } from '@/lib/admin/enquiryLabels'
import ActionForm from '@/components/admin/ActionForm'
import SubmitButton from '@/components/admin/SubmitButton'
import { Avatar, Badge, Card, Page, PageHeader, buttonClass, ui } from '@/components/admin/ui'
import {
  CheckCircleIcon,
  FileTextIcon,
  MailIcon,
  MessageCircleIcon,
  PhoneIcon,
  TrendingUpIcon,
  UserIcon,
  UsersIcon,
  XCircleIcon,
} from '@/components/admin/icons'
import { setStatus, assignEnquiry, addNote, markConverted, markLost } from '../actions'

const formatWhen = (iso: string) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })

export default async function EnquiryDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const { data: enquiry } = await supabase.from('enquiries').select('*').eq('id', params.id).maybeSingle()
  if (!enquiry) notFound()

  const [{ data: notes }, { data: staff }, productRes] = await Promise.all([
    supabase.from('enquiry_notes').select('*').eq('enquiry_id', enquiry.id).order('created_at', { ascending: true }),
    supabase.from('profiles').select('id, email, role'),
    enquiry.product_id
      ? supabase.from('products').select('name, slug').eq('id', enquiry.product_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  // WhatsApp needs the country code; bare 10-digit numbers are Indian.
  const digits = enquiry.phone.replace(/\D/g, '')
  const whatsapp = digits ? `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}` : null

  const details: [string, string | null][] = [
    ['Phone', enquiry.phone],
    ['Email', enquiry.email],
    ['Prefers', CONTACT_PREFERENCE[enquiry.preferred_contact]],
    ['Channel', ENQUIRY_CHANNEL[enquiry.channel]],
    ['Product', productRes.data?.name ?? null],
    ['Preferred date', enquiry.preferred_date],
    ['Children', enquiry.children_count != null ? String(enquiry.children_count) : null],
    ['Estimated value', enquiry.estimated_value != null ? `₹${enquiry.estimated_value.toLocaleString('en-IN')}` : null],
    ['Outcome note', enquiry.outcome_reason],
  ]
  const source: [string, string | null][] = [
    ['Page', enquiry.source_page],
    ['Referrer', enquiry.referrer],
    ['UTM source', enquiry.utm_source],
    ['UTM medium', enquiry.utm_medium],
    ['UTM campaign', enquiry.utm_campaign],
  ]
  const sourceRows = source.filter(([, v]) => v)
  const status = ENQUIRY_STATUS[enquiry.status]

  return (
    <Page>
      <PageHeader
        back={{ href: '/admin/enquiries', label: 'Enquiries' }}
        title={enquiry.name}
        meta={
          <>
            <Badge tone={status.tone} dot>
              {status.label}
            </Badge>
            <Badge tone="gray">{ENQUIRY_TYPE[enquiry.enquiry_type]}</Badge>
          </>
        }
        description={`Received ${formatWhen(enquiry.created_at)} · ${timeAgo(enquiry.created_at)}`}
        actions={
          <>
            <a href={`tel:${enquiry.phone}`} className={buttonClass('secondary')}>
              <PhoneIcon className="h-4 w-4" />
              Call
            </a>
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noreferrer" className={buttonClass('success')}>
                <MessageCircleIcon className="h-4 w-4" />
                WhatsApp
              </a>
            )}
            {enquiry.email && (
              <a href={`mailto:${enquiry.email}`} className={buttonClass('secondary')}>
                <MailIcon className="h-4 w-4" />
                Email
              </a>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: details, message, notes */}
        <div className="space-y-6 lg:col-span-2">
          <Card title="Details" icon={UserIcon}>
            <div className="mb-5 flex items-center gap-4">
              <Avatar name={enquiry.name} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-slate-900">{enquiry.name}</p>
                <p className="text-sm text-slate-500">{enquiry.subject ?? ENQUIRY_TYPE[enquiry.enquiry_type]}</p>
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
              {details
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{k}</dt>
                    <dd className="mt-0.5 break-words text-slate-900">{v}</dd>
                  </div>
                ))}
            </dl>
            {enquiry.message && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Message</p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{enquiry.message}</p>
              </div>
            )}
          </Card>

          <Card
            title="Notes"
            description="Follow-ups and anything worth remembering."
            icon={FileTextIcon}
            tone="gray"
            footer={
              <ActionForm action={addNote.bind(null, enquiry.id)} successMessage="Note added successfully" className="flex gap-2 py-1">
                <input name="note" required placeholder="Add a follow-up note…" aria-label="Note" className={`${ui.input} min-w-0 flex-1`} />
                <SubmitButton pendingText="Adding…">Add note</SubmitButton>
              </ActionForm>
            }
          >
            {notes && notes.length > 0 ? (
              <ol className="relative space-y-5 border-l border-slate-200 pl-6">
                {notes.map((n) => (
                  <li key={n.id} className="relative">
                    <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-white bg-blue-500 ring-1 ring-slate-200" aria-hidden="true" />
                    <p className="whitespace-pre-wrap text-sm text-slate-800">{n.note}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatWhen(n.created_at)}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-500">No notes yet.</p>
            )}
          </Card>
        </div>

        {/* Right: workflow */}
        <div className="space-y-6">
          <Card title="Status" icon={TrendingUpIcon} tone="violet">
            <ActionForm action={setStatus.bind(null, enquiry.id)} successMessage="Status updated successfully" className="space-y-3">
              <select name="status" defaultValue={enquiry.status} aria-label="Status" className={ui.input}>
                {ENQUIRY_STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {ENQUIRY_STATUS[s].label}
                  </option>
                ))}
              </select>
              <SubmitButton pendingText="Updating…" className="w-full">
                Update status
              </SubmitButton>
            </ActionForm>
          </Card>

          <Card title="Assigned to" icon={UsersIcon} tone="teal">
            <ActionForm action={assignEnquiry.bind(null, enquiry.id)} successMessage="Enquiry assigned successfully" className="space-y-3">
              <select name="assigned_to" defaultValue={enquiry.assigned_to ?? ''} aria-label="Assigned to" className={ui.input}>
                <option value="">Unassigned</option>
                {(staff ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.email} ({s.role})
                  </option>
                ))}
              </select>
              <SubmitButton pendingText="Assigning…" variant="secondary" className="w-full">
                Assign
              </SubmitButton>
            </ActionForm>
          </Card>

          <Card title="Outcome" description="Record how the lead ended." icon={CheckCircleIcon} tone="green">
            <ActionForm action={markConverted.bind(null, enquiry.id)} successMessage="Marked as converted" className="space-y-2">
              <input name="estimated_value" type="number" step="0.01" placeholder="Order value (₹), optional" aria-label="Order value" className={ui.input} />
              <SubmitButton pendingText="Saving…" variant="success" className="w-full">
                <CheckCircleIcon className="h-4 w-4" />
                Mark converted
              </SubmitButton>
            </ActionForm>
            <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              or
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <ActionForm action={markLost.bind(null, enquiry.id)} successMessage="Marked as lost" className="space-y-2">
              <input name="outcome_reason" placeholder="Why it was lost, optional" aria-label="Reason lost" className={ui.input} />
              <SubmitButton pendingText="Saving…" variant="secondary" className="w-full">
                <XCircleIcon className="h-4 w-4" />
                Mark lost
              </SubmitButton>
            </ActionForm>
          </Card>

          {sourceRows.length > 0 && (
            <Card title="Where it came from" icon={TrendingUpIcon} tone="gray">
              <dl className="space-y-3 text-sm">
                {sourceRows.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{k}</dt>
                    <dd className="mt-0.5 break-all text-slate-700">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}
        </div>
      </div>
    </Page>
  )
}
