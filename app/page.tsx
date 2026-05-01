import { createClient } from '@/lib/supabase/server'
import { Job } from '@/lib/supabase'
import { DashboardClient } from './dashboard-client'
import { getSessionMembership } from '@/lib/company-server'

const NEW_YORK_TIME_ZONE = 'America/New_York'

async function getTodaysJobs() {
  const supabase = await createClient()
  const membership = await getSessionMembership()
  if (!membership?.companyId) {
    return { jobs: [] as Job[], isWorker: false }
  }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: NEW_YORK_TIME_ZONE })
  let jobsQuery = supabase
    .from('jobs')
    .select('*')
    .eq('company_id', membership.companyId)
    .eq('date', today)
    .order('time', { ascending: true })

  if (membership.isWorker && membership.workerId) {
    jobsQuery = jobsQuery.eq('assigned_to', membership.workerId)
  }

  const { data, error } = await jobsQuery
  if (error) {
    console.error('Error fetching jobs:', error.message)
    return { jobs: [] as Job[], isWorker: membership.isWorker }
  }
  return { jobs: data as Job[], isWorker: membership.isWorker }
}

export default async function DashboardPage() {
  const { jobs, isWorker } = await getTodaysJobs()
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: NEW_YORK_TIME_ZONE,
  })

  return <DashboardClient initialJobs={jobs} todayLabel={todayLabel} isWorker={isWorker} />
}
