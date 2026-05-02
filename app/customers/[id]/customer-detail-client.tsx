'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Customer, Job } from '@/lib/supabase'
import { ServiceTypeIcon } from '@/app/components/service-type-icon'
import { SidebarLayout } from '@/app/components/sidebar-layout'

const supabase = createClient()

const statusConfig = {
  scheduled: { label: 'Scheduled', bg: 'bg-blue-50', text: 'text-[#2563eb]', dot: 'bg-[#2563eb]' },
  in_progress: { label: 'In progress', bg: 'bg-amber-50', text: 'text-[#d97706]', dot: 'bg-[#d97706]' },
  completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-[#059669]', dot: 'bg-[#059669]' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-[#dc2626]', dot: 'bg-[#dc2626]' },
}

const field =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/35 focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)]'

type Props = {
  customer: Customer
  jobs: Job[]
  isWorker: boolean
}

function formatJobDate(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  }).format(new Date(Date.UTC(y, m - 1, d, 12)))
}

function jobLeftBorderClass(status: Job['status']) {
  if (status === 'scheduled') return 'border-l-[#2563eb]'
  if (status === 'in_progress') return 'border-l-[#d97706]'
  if (status === 'completed') return 'border-l-[#059669]'
  return 'border-l-[#dc2626]'
}

export function CustomerDetailClient({ customer, jobs, isWorker }: Props) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState(customer.name)
  const [phone, setPhone] = useState(customer.phone ?? '')
  const [email, setEmail] = useState(customer.email ?? '')
  const [address, setAddress] = useState(customer.address ?? '')
  const [notes, setNotes] = useState(customer.notes ?? '')
  const [errorMessage, setErrorMessage] = useState('')

  function openEdit() {
    setName(customer.name)
    setPhone(customer.phone ?? '')
    setEmail(customer.email ?? '')
    setAddress(customer.address ?? '')
    setNotes(customer.notes ?? '')
    setErrorMessage('')
    setIsEditing(true)
  }

  async function handleSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsSaving(true)

    const payload = {
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
    }

    const { error } = await supabase.from('customers').update(payload).eq('id', customer.id).eq('company_id', customer.company_id)

    if (error) {
      console.error('Error updating customer:', error.message)
      setErrorMessage('Could not save changes. Please try again.')
      setIsSaving(false)
      return
    }

    setIsEditing(false)
    setIsSaving(false)
    router.refresh()
  }

  return (
    <SidebarLayout
      title={customer.name}
      subtitle="Customer profile"
      isWorker={isWorker}
      headerActions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openEdit}
            className="hp-btn-secondary text-sm font-medium px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"
          >
            Edit
          </button>
          <Link href="/customers" className="hp-btn-primary inline-flex rounded-xl px-4 py-2 text-sm">
            All customers
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="hp-card space-y-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Phone</p>
            <p className="mt-1 font-medium text-slate-900">{customer.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</p>
            <p className="mt-1 font-medium text-slate-900">{customer.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Address</p>
            <p className="mt-1 text-sm font-medium text-slate-600">{customer.address ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Notes</p>
            <p className="mt-1 text-sm font-medium text-slate-600 whitespace-pre-wrap">{customer.notes ?? '—'}</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 mb-4">Past jobs</h2>
          {jobs.length === 0 ? (
            <div className="hp-card rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
              <p className="text-sm font-semibold text-slate-900">No jobs linked yet</p>
              <p className="mt-1 text-sm font-medium text-slate-400">Jobs assigned to this customer appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job, index) => {
                const s = statusConfig[job.status]
                return (
                  <div
                    key={job.id}
                    style={{ animationDelay: `${Math.min(index, 12) * 55}ms` }}
                    className={`hp-stagger-fade-up hp-card rounded-2xl border border-slate-100 border-l-[6px] bg-white p-5 shadow-sm ${jobLeftBorderClass(job.status)}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{formatJobDate(job.date)}</p>
                        <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-500">
                          <ServiceTypeIcon serviceType={job.service_type} className="h-4 w-4 shrink-0 text-slate-400" />
                          {job.service_type}
                        </p>
                      </div>
                      <p className="text-sm font-semibold tabular-nums text-[#2563eb] shrink-0">${job.price}</p>
                    </div>
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {isEditing ? (
        <div className="hp-animate-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-[2px]">
          <div className="hp-animate-modal-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-100 bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">Edit customer</h2>
              <button
                type="button"
                onClick={() => !isSaving && setIsEditing(false)}
                className="text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-slate-600"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-slate-400">Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className={field} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={field} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={field} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">Address</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} className={field} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-400">Notes</label>
                <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} className={`${field} resize-y`} />
              </div>
              {errorMessage ? <p className="text-sm font-medium text-[#dc2626]">{errorMessage}</p> : null}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => !isSaving && setIsEditing(false)}
                  className="hp-btn-secondary text-sm font-medium px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="hp-btn-primary rounded-xl px-4 py-2 text-sm">
                  {isSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </SidebarLayout>
  )
}
