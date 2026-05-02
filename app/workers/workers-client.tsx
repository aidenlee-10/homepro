'use client'

import { FormEvent, useState } from 'react'
import { HardHat } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Worker } from '@/lib/supabase'

const supabase = createClient()

const field =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/35 focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)]'

type WorkersClientProps = {
  initialWorkers: Worker[]
  companyId: string
  isOwner: boolean
}

export function WorkersClient({ initialWorkers, companyId, isOwner }: WorkersClientProps) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  const baseUrl = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')) || ''

  async function sendInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setInviteError('')
    setInviteLink(null)
    setInviteBusy(true)

    const email = inviteEmail.trim().toLowerCase()
    if (!email) {
      setInviteError('Please enter an email address.')
      setInviteBusy(false)
      return
    }

    const token = crypto.randomUUID()

    const { error } = await supabase.from('invites').insert({
      company_id: companyId,
      email,
      token,
      used: false,
    })

    if (error) {
      console.error('Error creating invite:', error.message)
      setInviteError(error.message || 'Could not create invite.')
      setInviteBusy(false)
      return
    }

    const path = `/invite/${token}`
    setInviteLink(baseUrl ? `${baseUrl}${path}` : path)
    setInviteEmail('')
    setInviteBusy(false)
  }

  function closeInviteModal() {
    if (inviteBusy) return
    setInviteOpen(false)
    setInviteError('')
    setInviteLink(null)
    setInviteEmail('')
  }

  return (
    <>
      {isOwner && initialWorkers.length > 0 ? (
        <div className="mb-5 flex justify-end">
          <button type="button" onClick={() => setInviteOpen(true)} className="hp-btn-primary rounded-xl px-4 py-2 text-sm">
            Invite worker
          </button>
        </div>
      ) : null}

      <div className="space-y-4">
        {initialWorkers.length === 0 ? (
          <div className="hp-card rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
            <HardHat className="mx-auto mb-3 h-14 w-14 text-slate-200" strokeWidth={1.25} aria-hidden />
            <p className="text-sm font-semibold text-slate-900">No workers yet</p>
            <p className="mt-1 text-sm font-medium text-slate-400">Invite teammates to see jobs on their dashboard.</p>
            {isOwner ? (
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="mt-5 text-sm font-medium text-[#2563eb] transition-colors duration-200 hover:text-blue-800"
              >
                Send an invite →
              </button>
            ) : null}
          </div>
        ) : (
          initialWorkers.map(worker => (
            <div
              key={worker.id}
              className="hp-card rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <p className="font-semibold text-slate-900">{worker.name ?? '—'}</p>
              <p className="text-sm font-medium text-slate-400 mt-1">{worker.email ?? '—'}</p>
              <p className="mt-3 inline-flex rounded-full bg-slate-50 px-3 py-1 text-xs font-medium capitalize text-slate-600">
                {worker.role}
              </p>
            </div>
          ))
        )}
      </div>

      {inviteOpen ? (
        <div className="hp-animate-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-[2px]">
          <div className="hp-animate-modal-panel w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">Invite worker</h2>
              <button
                type="button"
                onClick={closeInviteModal}
                className="text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-slate-600"
              >
                Close
              </button>
            </div>

            {inviteLink ? (
              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-400">Share this link with your worker:</p>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 break-all">
                  {inviteLink}
                </div>
                {!baseUrl ? (
                  <p className="text-xs font-medium text-[#d97706]">
                    Set <code className="font-mono text-slate-700">NEXT_PUBLIC_SITE_URL</code> in your env for a full domain link.
                  </p>
                ) : null}
                <button type="button" onClick={closeInviteModal} className="hp-btn-primary w-full rounded-xl px-4 py-2 text-sm">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={sendInvite} className="space-y-5">
                <div>
                  <label htmlFor="inviteEmail" className="text-sm font-medium text-slate-400">
                    Worker email
                  </label>
                  <input
                    id="inviteEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    required
                    className={field}
                    placeholder="worker@example.com"
                  />
                </div>
                {inviteError ? <p className="text-sm font-medium text-[#dc2626]">{inviteError}</p> : null}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={closeInviteModal}
                    disabled={inviteBusy}
                    className="hp-btn-secondary text-sm font-medium px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={inviteBusy} className="hp-btn-primary rounded-xl px-4 py-2 text-sm">
                    {inviteBusy ? 'Sending…' : 'Send invite'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
