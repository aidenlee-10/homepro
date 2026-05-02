import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export type SessionMembership = {
  companyId: string
  isWorker: boolean
  workerId: string | null
  /** First name or display name for greetings (from workers.name or email). */
  displayName: string
}

function displayNameFromUser(user: User): string {
  const meta = user.user_metadata as { full_name?: string } | undefined
  const fromMeta = meta?.full_name?.trim()
  if (fromMeta) return fromMeta.split(/\s+/)[0] ?? fromMeta
  if (user.email) return user.email.split('@')[0] ?? 'there'
  return 'there'
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
    const { data: ownerWorker } = await supabase
      .from('workers')
      .select('name')
      .eq('user_id', user.id)
      .eq('company_id', company.id)
      .maybeSingle()
    const name = ownerWorker?.name?.trim()
    const first = name?.split(/\s+/)[0]
    return {
      companyId: company.id,
      isWorker: false,
      workerId: null,
      displayName: first || name || displayNameFromUser(user),
    }
  }

  const { data: worker, error: workerError } = await supabase
    .from('workers')
    .select('id, company_id, name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (workerError || !worker?.company_id) {
    return null
  }

  const wname = worker.name?.trim()
  const first = wname?.split(/\s+/)[0]
  return {
    companyId: worker.company_id,
    isWorker: true,
    workerId: worker.id,
    displayName: first || wname || displayNameFromUser(user),
  }
}

/** Returns the company id for the current session user, or null if missing. */
export async function getCompanyIdForSession(): Promise<string | null> {
  const membership = await getSessionMembership()
  return membership?.companyId ?? null
}
