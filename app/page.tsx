import { createClient } from '@/lib/supabase/server'
import { Job } from '@/lib/supabase'
import { DashboardClient } from './dashboard-client'

const NEW_YORK_TIME_ZONE = 'America/New_York'

async function getTodaysJobs(): Promise<Job[]> {
  const supabase = await createClient()
  const today = new Date().toLocaleDateString('en-CA', { timeZone: NEW_YORK_TIME_ZONE })
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('date', today)
    .order('time', { ascending: true })
  if (error) {
    console.error('Error fetching jobs:', error.message)
    return []
  }
  return data as Job[]
}

export default async function DashboardPage() {
  const jobs = await getTodaysJobs()
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: NEW_YORK_TIME_ZONE,
  })

  return <DashboardClient initialJobs={jobs} todayLabel={todayLabel} />
}
