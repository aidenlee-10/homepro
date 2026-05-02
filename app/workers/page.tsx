import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCompanyIdForSession, getSessionMembership } from '@/lib/company-server'
import type { Worker } from '@/lib/supabase'
import { WorkersClient } from './workers-client'
import { SidebarLayout } from '@/app/components/sidebar-layout'

function NoCompanyNotice() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">Workers</h1>
        <p className="mt-2 text-sm font-medium text-slate-400">No company found for your account.</p>
        <Link
          href="/"
          className="hp-btn-secondary mt-6 inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}

export default async function WorkersPage() {
  const companyId = await getCompanyIdForSession()
  const membership = await getSessionMembership()
  const supabase = await createClient()

  if (!companyId) {
    return <NoCompanyNotice />
  }

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('owner_id')
    .eq('id', companyId)
    .maybeSingle()

  if (companyError) {
    console.error('Error fetching company:', companyError.message)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isOwner = Boolean(user && company && user.id === company.owner_id)

  const { data: workers, error: workersError } = await supabase
    .from('workers')
    .select('*')
    .eq('company_id', companyId)
    .order('name', { ascending: true })

  if (workersError) {
    console.error('Error fetching workers:', workersError.message)
  }

  return (
    <SidebarLayout title="Workers" subtitle="Your team" isWorker={membership?.isWorker}>
      <WorkersClient initialWorkers={(workers ?? []) as Worker[]} companyId={companyId} isOwner={isOwner} />
    </SidebarLayout>
  )
}
