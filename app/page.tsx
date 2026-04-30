import { supabase, Job } from '@/lib/supabase'
import { DashboardClient } from './dashboard-client'

async function getTodaysJobs(): Promise<Job[]> {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
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
  })

  return <DashboardClient initialJobs={jobs} todayLabel={todayLabel} />
}
