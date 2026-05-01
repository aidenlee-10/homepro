'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Invite } from '@/lib/supabase'

const supabase = createClient()

type Props = {
  token: string
}

export function InviteAcceptClient({ token }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState<Invite | null>(null)
  const [loadError, setLoadError] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase.from('invites').select('*').eq('token', token).eq('used', false).maybeSingle()
      if (cancelled) return
      if (error || !data) {
        setLoadError(error?.message ?? 'This invite is invalid or has already been used.')
        setInvite(null)
      } else {
        const row = data as Invite
        setInvite(row)
        setEmail(row.email)
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [token])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    if (!invite) return

    const trimmedEmail = email.trim().toLowerCase()
    if (trimmedEmail !== invite.email.toLowerCase()) {
      setFormError('Email must match the invited address.')
      return
    }

    setBusy(true)

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: { full_name: name.trim() },
      },
    })

    if (signUpError) {
      setFormError(signUpError.message)
      setBusy(false)
      return
    }

    const sessionUser = signUpData.user
    if (!sessionUser) {
      setFormError('Could not create account. Try again or contact support.')
      setBusy(false)
      return
    }

    if (!signUpData.session) {
      setFormError('Check your email to confirm your account, then sign in.')
      setBusy(false)
      return
    }

    const { error: workerError } = await supabase.from('workers').insert({
      company_id: invite.company_id,
      user_id: sessionUser.id,
      name: name.trim(),
      email: trimmedEmail,
      role: 'worker',
    })

    if (workerError) {
      console.error('Error creating worker:', workerError.message)
      setFormError(workerError.message || 'Account created but worker profile failed. Contact your admin.')
      setBusy(false)
      return
    }

    const { error: inviteUpdateError } = await supabase.from('invites').update({ used: true }).eq('token', token)

    if (inviteUpdateError) {
      console.error('Error marking invite used:', inviteUpdateError.message)
    }

    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <p className="text-sm text-slate-500">Loading invite…</p>
      </div>
    )
  }

  if (!invite || loadError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-100 p-6 text-center">
          <p className="text-lg font-semibold text-slate-900">Invite unavailable</p>
          <p className="text-sm text-slate-500 mt-2">{loadError || 'This link is no longer valid.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Join HomePro</h1>
        <p className="text-sm text-slate-500 mt-1">Create your account to accept the invite.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full text-sm font-medium px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
