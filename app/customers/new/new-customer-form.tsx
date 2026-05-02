'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SidebarLayout } from '@/app/components/sidebar-layout'

const supabase = createClient()

const field =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/35 focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)]'

type NewCustomerFormProps = {
  isWorker: boolean
}

export function NewCustomerForm({ isWorker }: NewCustomerFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsSaving(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      setErrorMessage(userError?.message ?? 'You must be signed in.')
      setIsSaving(false)
      return
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (companyError || !company) {
      setErrorMessage(companyError?.message ?? 'No company found for your account.')
      setIsSaving(false)
      return
    }

    const { error } = await supabase.from('customers').insert({
      company_id: company.id,
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
    })

    if (error) {
      console.error('Error creating customer:', error.message)
      setErrorMessage('Could not save the customer. Please try again.')
      setIsSaving(false)
      return
    }

    router.push('/customers')
    router.refresh()
  }

  return (
    <SidebarLayout
      title="New customer"
      subtitle="Add to your company directory"
      isWorker={isWorker}
      headerActions={
        <Link href="/customers" className="hp-btn-secondary inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
          Back
        </Link>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="hp-card space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8"
      >
        <div>
          <label htmlFor="name" className="text-sm font-medium text-slate-400">
            Name
          </label>
          <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required className={field} />
        </div>
        <div>
          <label htmlFor="phone" className="text-sm font-medium text-slate-400">
            Phone
          </label>
          <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-slate-400">
            Email
          </label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="address" className="text-sm font-medium text-slate-400">
            Address
          </label>
          <input id="address" type="text" value={address} onChange={e => setAddress(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="notes" className="text-sm font-medium text-slate-400">
            Notes
          </label>
          <textarea id="notes" rows={4} value={notes} onChange={e => setNotes(e.target.value)} className={`${field} resize-y`} />
        </div>

        {errorMessage ? <p className="text-sm font-medium text-[#dc2626]">{errorMessage}</p> : null}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Link href="/customers" className="hp-btn-secondary inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
            Cancel
          </Link>
          <button type="submit" disabled={isSaving} className="hp-btn-primary rounded-xl px-4 py-2 text-sm">
            {isSaving ? 'Saving…' : 'Save customer'}
          </button>
        </div>
      </form>
    </SidebarLayout>
  )
}
