'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Customer, Job } from '@/lib/supabase'

const supabase = createClient()

const statusConfig = {
  scheduled: { label: 'Scheduled', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  in_progress: { label: 'In Progress', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400' },
}

type Props = {
  customer: Customer
  jobs: Job[]
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

export function CustomerDetailClient({ customer, jobs }: Props) {
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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{customer.name}</h1>
            <p className="text-sm text-slate-400">Customer profile</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openEdit}
              className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Edit
            </button>
            <Link href="/customers" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              All customers
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <section className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Phone</p>
            <p className="text-slate-900 font-medium">{customer.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Email</p>
            <p className="text-slate-900 font-medium">{customer.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Address</p>
            <p className="text-slate-900">{customer.address ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Notes</p>
            <p className="text-slate-700 whitespace-pre-wrap">{customer.notes ?? '—'}</p>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Past jobs</h2>
          {jobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
              <p className="font-medium">No jobs linked to this customer yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map(job => {
                const s = statusConfig[job.status]
                return (
                  <div key={job.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{formatJobDate(job.date)}</p>
                        <p className="text-sm text-slate-500 mt-1">{job.service_type}</p>
                      </div>
                      <p className="text-sm font-bold text-blue-600 shrink-0">${job.price}</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-50">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {isEditing ? (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center px-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-100 p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Edit customer</h2>
              <button type="button" onClick={() => !isSaving && setIsEditing(false)} className="text-sm text-slate-500 hover:text-slate-700">
                Close
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
              </div>
              {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
              <div className="pt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => !isSaving && setIsEditing(false)}
                  className="text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="text-sm font-medium px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
