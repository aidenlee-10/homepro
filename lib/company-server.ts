import { createClient } from '@/lib/supabase/server'

/** Returns the company id for the current session user, or null if missing. */
export async function getCompanyIdForSession(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return null

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (companyError || !company) return null
  return company.id
}
