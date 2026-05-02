'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Invite } from '@/lib/supabase'

const supabase = createClient()

const field =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/35 focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)]'

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
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
        <p className="text-sm font-medium text-slate-400">Loading invite…</p>
      </div>
    )
  }

  if (!invite || loadError) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold tracking-tight text-slate-900">Invite unavailable</p>
          <p className="mt-2 text-sm font-medium text-slate-400">{loadError || 'This link is no longer valid.'}</p>
          <Link
            href="/login"
            className="hp-btn-primary mt-6 inline-flex rounded-xl px-4 py-2 text-sm"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="text-2xl font-semibold tracking-tight text-white transition-opacity duration-200 hover:opacity-90"
        >
          HomePro
        </Link>
        <p className="mt-2 text-sm font-medium text-slate-400">Accept your team invite</p>
      </div>
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">Create your account</h1>
        <p className="mt-1.5 text-sm font-medium text-slate-400">You will join your team after signing up.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="name" className="text-sm font-medium text-slate-400">
              Name
            </label>
            <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className={field} />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-slate-400">
              Email
            </label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className={field} />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-slate-400">
              Password
            </label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className={field} />
          </div>
          {formError ? <p className="text-sm font-medium text-[#dc2626]">{formError}</p> : null}
          <button type="submit" disabled={busy} className="hp-btn-primary w-full rounded-xl px-4 py-2 text-sm">
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  )
}
