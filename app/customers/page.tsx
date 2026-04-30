import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCompanyIdForSession } from '@/lib/company-server'
import type { Customer } from '@/lib/supabase'

type CustomerStats = {
  customer: Customer
  jobCount: number
  lifetimeValue: number
}

export default async function CustomersPage() {
  const companyId = await getCompanyIdForSession()
  const supabase = await createClient()

  if (!companyId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-4 py-4">
          <div className="max-w-lg mx-auto">
            <h1 className="text-xl font-bold text-slate-900">Customers</h1>
            <p className="text-sm text-slate-500 mt-1">No company found for your account.</p>
          </div>
        </header>
      </div>
    )
  }

  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('*')
    .eq('company_id', companyId)
    .order('name', { ascending: true })

  if (customersError) {
    console.error('Error fetching customers:', customersError.message)
  }

  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('customer_id, price')
    .eq('company_id', companyId)

  if (jobsError) {
    console.error('Error fetching jobs for stats:', jobsError.message)
  }

  const statsByCustomer = new Map<string, { jobCount: number; lifetimeValue: number }>()
  for (const job of jobs ?? []) {
    const cid = job.customer_id as string | null | undefined
    if (!cid) continue
    const prev = statsByCustomer.get(cid) ?? { jobCount: 0, lifetimeValue: 0 }
    prev.jobCount += 1
    prev.lifetimeValue += Number(job.price) || 0
    statsByCustomer.set(cid, prev)
  }

  const rows: CustomerStats[] = (customers ?? []).map(customer => {
    const s = statsByCustomer.get(customer.id) ?? { jobCount: 0, lifetimeValue: 0 }
    return { customer, jobCount: s.jobCount, lifetimeValue: s.lifetimeValue }
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Customers</h1>
            <p className="text-sm text-slate-400">Your company directory</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/customers/new"
              className="text-xs font-medium px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              + Add Customer
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-3">
        {rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
            <p className="text-4xl mb-2">👥</p>
            <p className="font-medium">No customers yet</p>
            <Link href="/customers/new" className="mt-3 inline-block text-sm text-blue-600 font-medium hover:text-blue-700">
              Add your first customer →
            </Link>
          </div>
        ) : (
          rows.map(({ customer, jobCount, lifetimeValue }) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="block bg-white rounded-2xl border border-slate-100 p-4 hover:border-slate-200 transition-colors"
            >
              <p className="font-semibold text-slate-900">{customer.name}</p>
              <p className="text-sm text-slate-500 mt-1">{customer.phone ?? '—'}</p>
              <p className="text-sm text-slate-500">{customer.email ?? '—'}</p>
              <p className="text-xs text-slate-400 mt-2">📍 {customer.address ?? '—'}</p>
              <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  <span className="font-semibold text-slate-900">{jobCount}</span> jobs
                </span>
                <span className="font-bold text-emerald-600">${lifetimeValue}</span>
              </div>
            </Link>
          ))
        )}
      </main>
    </div>
  )
}
