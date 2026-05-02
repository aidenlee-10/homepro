import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSessionMembership } from '@/lib/company-server'
import type { Service } from '@/lib/supabase'
import { ServicesClient } from './services-client'
import { SidebarLayout } from '@/app/components/sidebar-layout'

function NavyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-sm font-medium text-slate-400">{body}</p>
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

export default async function ServicesPage() {
  const membership = await getSessionMembership()
  const supabase = await createClient()

  if (!membership?.companyId) {
    return <NavyCard title="Services" body="No company found for your account." />
  }

  if (membership.isWorker) {
    return <NavyCard title="Services" body="Only owners can manage services." />
  }

  const { data: servicesData, error } = await supabase
    .from('services')
    .select('*')
    .eq('company_id', membership.companyId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching services:', error.message)
  }

  return (
    <SidebarLayout title="Services" subtitle="Manage your company service catalog" isWorker={membership.isWorker}>
      <ServicesClient initialServices={(servicesData ?? []) as Service[]} companyId={membership.companyId} />
    </SidebarLayout>
  )
}
