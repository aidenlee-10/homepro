import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCompanyIdForSession, getSessionMembership } from '@/lib/company-server'
import type { Customer, Job } from '@/lib/supabase'
import { CustomerDetailClient } from './customer-detail-client'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params
  const companyId = await getCompanyIdForSession()
  const membership = await getSessionMembership()
  if (!companyId) notFound()

  const supabase = await createClient()
  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .maybeSingle()

  if (error || !customer) notFound()

  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', companyId)
    .eq('customer_id', id)
    .order('date', { ascending: false })
    .order('time', { ascending: false })

  if (jobsError) {
    console.error('Error fetching customer jobs:', jobsError.message)
  }

  return (
    <CustomerDetailClient
      customer={customer as Customer}
      jobs={(jobs ?? []) as Job[]}
      isWorker={Boolean(membership?.isWorker)}
    />
  )
}
