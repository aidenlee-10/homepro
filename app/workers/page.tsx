import { createClient } from '@/lib/supabase/server'
import { getCompanyIdForSession } from '@/lib/company-server'
import type { Worker } from '@/lib/supabase'
import { WorkersClient } from './workers-client'

export default async function WorkersPage() {
  const companyId = await getCompanyIdForSession()
  const supabase = await createClient()

  if (!companyId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-4 py-4">
          <div className="max-w-lg mx-auto">
            <h1 className="text-xl font-bold text-slate-900">Workers</h1>
            <p className="text-sm text-slate-500 mt-1">No company found for your account.</p>
          </div>
        </header>
      </div>
    )
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
    <WorkersClient
      initialWorkers={(workers ?? []) as Worker[]}
      companyId={companyId}
      isOwner={isOwner}
    />
  )
}
