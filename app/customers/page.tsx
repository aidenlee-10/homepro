import Link from 'next/link'
import { Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCompanyIdForSession, getSessionMembership } from '@/lib/company-server'
import type { Customer } from '@/lib/supabase'
import { AddressLine } from '@/app/components/address-line'
import { SidebarLayout } from '@/app/components/sidebar-layout'

type CustomerStats = {
  customer: Customer
  jobCount: number
  lifetimeValue: number
}

function NoCompanyNotice({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-semibold tracking-tight text-slate-900">{title}</p>
        <p className="mt-2 text-sm font-medium text-slate-400">No company found for your account.</p>
      </div>
    </div>
  )
}

export default async function CustomersPage() {
  const companyId = await getCompanyIdForSession()
  const membership = await getSessionMembership()
  const supabase = await createClient()

  if (!companyId) {
    return <NoCompanyNotice title="Customers" />
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
    <SidebarLayout
      title="Customers"
      subtitle="Your company directory"
      isWorker={membership?.isWorker}
      headerActions={
        <Link href="/customers/new" className="hp-btn-primary inline-flex rounded-xl px-4 py-2 text-sm">
          + Add customer
        </Link>
      }
    >
      <div className="space-y-4">
        {rows.length === 0 ? (
          <div className="hp-card rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
            <Users className="mx-auto mb-3 h-14 w-14 text-slate-200" strokeWidth={1.25} aria-hidden />
            <p className="text-sm font-semibold text-slate-900">No customers yet</p>
            <p className="mt-1 text-sm font-medium text-slate-400">Add people you serve to keep records in one place.</p>
            <Link
              href="/customers/new"
              className="mt-5 inline-flex text-sm font-medium text-[#2563eb] transition-colors duration-200 hover:text-blue-800"
            >
              Add your first customer →
            </Link>
          </div>
        ) : (
          rows.map(({ customer, jobCount, lifetimeValue }) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="hp-card block rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <p className="font-semibold text-slate-900">{customer.name}</p>
              <p className="text-sm font-medium text-slate-400 mt-1">{customer.phone ?? '—'}</p>
              <p className="text-sm font-medium text-slate-400">{customer.email ?? '—'}</p>
              <AddressLine className="mt-2">{customer.address ?? '—'}</AddressLine>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
                <span className="font-medium text-slate-400">
                  <span className="font-semibold tabular-nums text-slate-900">{jobCount}</span> jobs
                </span>
                <span className="font-semibold tabular-nums text-[#059669]">${lifetimeValue}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </SidebarLayout>
  )
}
