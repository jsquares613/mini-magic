import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'
import ActionForm from '@/components/admin/ActionForm'
import SubmitButton from '@/components/admin/SubmitButton'
import { setStatus, assignEnquiry, addNote, markConverted, markLost } from '../actions'

const input = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400'
const STATUSES = ['new', 'contacted', 'in_progress', 'converted', 'lost']

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

  const fields: [string, string | null][] = [
    ['Phone', enquiry.phone],
    ['Email', enquiry.email],
    ['Preferred contact', enquiry.preferred_contact],
    ['Channel', enquiry.channel],
    ['Type', enquiry.enquiry_type],
    ['Product', productRes.data?.name ?? null],
    ['Preferred date', enquiry.preferred_date],
    ['Children', enquiry.children_count != null ? String(enquiry.children_count) : null],
    ['Source page', enquiry.source_page],
    ['UTM source', enquiry.utm_source],
  ]

  return (
    <div className="p-4 md:p-8">
      <Link href="/admin/enquiries" className="text-sm text-blue-600 hover:underline">
        ← Enquiries
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold text-gray-900">{enquiry.name}</h1>
      <p className="mb-6 text-sm text-gray-500">
        Received {new Date(enquiry.created_at).toLocaleString('en-IN')} · status{' '}
        <span className="font-semibold">{enquiry.status.replace('_', ' ')}</span>
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: details + message + notes */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-bold text-gray-900">Details</h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {fields
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs uppercase tracking-wide text-gray-400">{k}</dt>
                    <dd className="text-gray-900">{v}</dd>
                  </div>
                ))}
            </dl>
            {enquiry.message && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-xs uppercase tracking-wide text-gray-400">Message</p>
                <p className="mt-1 whitespace-pre-wrap text-gray-700">{enquiry.message}</p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-bold text-gray-900">Notes</h2>
            <div className="mb-4 space-y-3">
              {(notes ?? []).map((n) => (
                <div key={n.id} className="rounded-lg bg-gray-50 px-4 py-2 text-sm">
                  <p className="text-gray-800">{n.note}</p>
                  <p className="mt-1 text-xs text-gray-400">{new Date(n.created_at).toLocaleString('en-IN')}</p>
                </div>
              ))}
              {(!notes || notes.length === 0) && <p className="text-sm text-gray-400">No notes yet.</p>}
            </div>
            <ActionForm action={addNote.bind(null, enquiry.id)} successMessage="Note added successfully" className="flex gap-2">
              <input name="note" required placeholder="Add a follow-up note…" className={input} />
              <SubmitButton pendingText="Adding…">Add</SubmitButton>
            </ActionForm>
          </section>
        </div>

        {/* Right: workflow */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-bold text-gray-900">Status</h2>
            <ActionForm action={setStatus.bind(null, enquiry.id)} successMessage="Status updated successfully" className="space-y-3">
              <select name="status" defaultValue={enquiry.status} className={input}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <SubmitButton pendingText="Updating…" className="w-full py-2">
                Update status
              </SubmitButton>
            </ActionForm>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-bold text-gray-900">Assignment</h2>
            <ActionForm action={assignEnquiry.bind(null, enquiry.id)} successMessage="Enquiry assigned successfully" className="space-y-3">
              <select name="assigned_to" defaultValue={enquiry.assigned_to ?? ''} className={input}>
                <option value="">Unassigned</option>
                {(staff ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.email} ({s.role})
                  </option>
                ))}
              </select>
              <SubmitButton pendingText="Assigning…" variant="secondary" className="w-full py-2">
                Assign
              </SubmitButton>
            </ActionForm>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-bold text-gray-900">Outcome</h2>
            <ActionForm action={markConverted.bind(null, enquiry.id)} successMessage="Marked as converted" className="mb-3 space-y-2">
              <input name="estimated_value" type="number" step="0.01" placeholder="Est. value (₹)" className={input} />
              <SubmitButton pendingText="Saving…" variant="success" className="w-full py-2">
                Mark converted
              </SubmitButton>
            </ActionForm>
            <ActionForm action={markLost.bind(null, enquiry.id)} successMessage="Marked as lost" className="space-y-2">
              <input name="outcome_reason" placeholder="Reason lost" className={input} />
              <SubmitButton pendingText="Saving…" variant="outline" className="w-full py-2">
                Mark lost
              </SubmitButton>
            </ActionForm>
          </section>
        </div>
      </div>
    </div>
  )
}
