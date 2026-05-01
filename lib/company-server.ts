import { createClient } from '@/lib/supabase/server'

export type SessionMembership = {
  companyId: string
  isWorker: boolean
  workerId: string | null
}

/** Returns company membership for the current session user, or null if missing. */
export async function getSessionMembership(): Promise<SessionMembership | null> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return null
  }

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (companyError) {
    return null
  }

  if (company?.id) {
    return { companyId: company.id, isWorker: false, workerId: null }
  }

  const { data: worker, error: workerError } = await supabase
    .from('workers')
    .select('id, company_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (workerError || !worker?.company_id) {
    return null
  }

  return { companyId: worker.company_id, isWorker: true, workerId: worker.id }
}

/** Returns the company id for the current session user, or null if missing. */
export async function getCompanyIdForSession(): Promise<string | null> {
  const membership = await getSessionMembership()
  return membership?.companyId ?? null
}
