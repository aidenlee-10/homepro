'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const inputClass =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/35 focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)]'

export default function SignupPage() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    const trimmedCompanyName = companyName.trim()
    const trimmedOwnerName = ownerName.trim()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedCompanyName || !trimmedOwnerName) {
      setErrorMessage('Please fill in all required fields.')
      setIsSubmitting(false)
      return
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
    })

    if (signUpError) {
      setErrorMessage(signUpError.message)
      setIsSubmitting(false)
      return
    }

    const userId = signUpData.user?.id
    if (!userId) {
      setErrorMessage('Please check your email to confirm your account, then sign in.')
      setIsSubmitting(false)
      return
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: trimmedCompanyName,
        owner_id: userId,
      })
      .select('id')
      .single()

    if (companyError || !company?.id) {
      console.error('Error creating company:', companyError?.message)
      setErrorMessage(companyError?.message ?? 'Could not create company.')
      setIsSubmitting(false)
      return
    }

    const { error: workerError } = await supabase.from('workers').insert({
      company_id: company.id,
      user_id: userId,
      name: trimmedOwnerName,
      email: trimmedEmail,
      role: 'owner',
    })

    if (workerError) {
      console.error('Error creating owner worker record:', workerError.message)
      setErrorMessage(workerError.message || 'Could not finish account setup.')
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
          <p className="mt-2 text-sm font-medium text-slate-400">Create your business account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm space-y-5"
        >
          <div>
            <label htmlFor="companyName" className="text-sm font-medium text-slate-400">
              Company name
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={event => setCompanyName(event.target.value)}
              required
              className={inputClass}
              placeholder="Apex Home Services"
            />
          </div>

          <div>
            <label htmlFor="ownerName" className="text-sm font-medium text-slate-400">
              Your name
            </label>
            <input
              id="ownerName"
              type="text"
              value={ownerName}
              onChange={event => setOwnerName(event.target.value)}
              required
              className={inputClass}
              placeholder="Jane Smith"
            />
          </div>

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
              minLength={6}
              className={inputClass}
              placeholder="At least 6 characters"
            />
          </div>

          {errorMessage ? <p className="text-sm font-medium text-[#dc2626]">{errorMessage}</p> : null}

          <button type="submit" disabled={isSubmitting} className="hp-btn-primary w-full rounded-xl px-4 py-2 text-sm">
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-sm font-medium text-slate-400 text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-[#2563eb] transition-colors duration-200 hover:text-blue-800">
              Sign in
            </Link>
          </p>
        </form>
      </main>
    </div>
  )
}
