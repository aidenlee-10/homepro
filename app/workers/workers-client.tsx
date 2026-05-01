'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Worker } from '@/lib/supabase'

const supabase = createClient()

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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Workers</h1>
            <p className="text-sm text-slate-400">Your team</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Dashboard
            </Link>
            {isOwner ? (
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="text-xs font-medium px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Invite Worker
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-3">
        {initialWorkers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
            <p className="text-4xl mb-2">👷</p>
            <p className="font-medium">No workers yet</p>
            {isOwner ? (
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="mt-3 text-sm text-blue-600 font-medium hover:text-blue-700"
              >
                Send an invite →
              </button>
            ) : null}
          </div>
        ) : (
          initialWorkers.map(worker => (
            <div key={worker.id} className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="font-semibold text-slate-900">{worker.name ?? '—'}</p>
              <p className="text-sm text-slate-500 mt-1">{worker.email ?? '—'}</p>
              <p className="text-xs text-slate-400 mt-2 inline-flex items-center gap-1.5">
                <span className="font-medium text-slate-600 capitalize">{worker.role}</span>
              </p>
            </div>
          ))
        )}
      </main>

      {inviteOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Invite worker</h2>
              <button type="button" onClick={closeInviteModal} className="text-sm text-slate-500 hover:text-slate-700">
                Close
              </button>
            </div>

            {inviteLink ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">Share this link with your worker:</p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 break-all">{inviteLink}</div>
                {!baseUrl ? (
                  <p className="text-xs text-amber-700">
                    Set <code className="font-mono">NEXT_PUBLIC_SITE_URL</code> in your env for a full domain link.
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={closeInviteModal}
                  className="w-full text-sm font-medium px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={sendInvite} className="space-y-4">
                <div>
                  <label htmlFor="inviteEmail" className="text-sm font-medium text-slate-700">
                    Worker email
                  </label>
                  <input
                    id="inviteEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="worker@example.com"
                  />
                </div>
                {inviteError ? <p className="text-sm text-red-600">{inviteError}</p> : null}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeInviteModal}
                    disabled={inviteBusy}
                    className="text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviteBusy}
                    className="text-sm font-medium px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    {inviteBusy ? 'Sending…' : 'Send Invite'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
