import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSessionMembership } from '@/lib/company-server'
import type { Service } from '@/lib/supabase'
import { ServicesClient } from './services-client'

export default async function ServicesPage() {
  const membership = await getSessionMembership()
  const supabase = await createClient()

  if (!membership?.companyId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-4 py-4">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Services</h1>
              <p className="text-sm text-slate-500 mt-1">No company found for your account.</p>
            </div>
            <Link
              href="/"
              className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
            >
              Back
            </Link>
          </div>
        </header>
      </div>
    )
  }

  if (membership.isWorker) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-4 py-4">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Services</h1>
              <p className="text-sm text-slate-500 mt-1">Only owners can manage services.</p>
            </div>
            <Link
              href="/"
              className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
            >
              Back
            </Link>
          </div>
        </header>
      </div>
    )
  }

  const { data: servicesData, error } = await supabase
    .from('services')
    .select('*')
    .eq('company_id', membership.companyId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching services:', error.message)
  }

  return <ServicesClient initialServices={(servicesData ?? []) as Service[]} companyId={membership.companyId} />
}
