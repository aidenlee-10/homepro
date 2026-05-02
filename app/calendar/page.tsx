import { CalendarClient } from './calendar-client'
import { createClient } from '@/lib/supabase/server'
import { Job } from '@/lib/supabase'
import { getSessionMembership } from '@/lib/company-server'

const NEW_YORK_TIME_ZONE = 'America/New_York'

async function getAllJobs(): Promise<Job[]> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    if (userError) console.error('Error fetching user:', userError.message)
    return []
  }

  const { data: company, error: companyError } = await supabase.from('companies').select('id').eq('owner_id', user.id).maybeSingle()
  if (companyError || !company) {
    if (companyError) console.error('Error fetching company:', companyError.message)
    return []
  }

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', company.id)
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (error) {
    console.error('Error fetching jobs:', error.message)
    return []
  }

  return data as Job[]
}

export default async function CalendarPage() {
  const membership = await getSessionMembership()
  const jobs = await getAllJobs()
  const initialDate = new Date().toLocaleDateString('en-CA', { timeZone: NEW_YORK_TIME_ZONE })

  return <CalendarClient initialJobs={jobs} initialDate={initialDate} isWorker={membership?.isWorker ?? false} />
}
