'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/35 focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)]'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setErrorMessage(error.message)
      setIsSubmitting(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0f172a] px-4 py-12 flex flex-col items-center justify-center">
      <main className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-block text-2xl font-semibold tracking-tight text-white transition-opacity duration-200 hover:opacity-90"
          >
            HomePro
          </Link>
          <p className="mt-2 text-sm font-medium text-slate-400">Sign in to your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm space-y-5"
        >
          <div>
            <label htmlFor="email" className="text-sm font-medium text-slate-400">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              required
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-slate-400">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              required
              className={inputClass}
            />
          </div>

          {errorMessage ? <p className="text-sm font-medium text-[#dc2626]">{errorMessage}</p> : null}

          <button type="submit" disabled={isSubmitting} className="hp-btn-primary w-full rounded-xl px-4 py-2 text-sm">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-sm font-medium text-slate-400 text-center">
            New to HomePro?{' '}
            <Link href="/signup" className="text-[#2563eb] transition-colors duration-200 hover:text-blue-800">
              Create an account
            </Link>
          </p>
        </form>
      </main>
    </div>
  )
}
