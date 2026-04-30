import { CalendarClient } from './calendar-client'
import { createClient } from '@/lib/supabase/server'
import { Job } from '@/lib/supabase'

const NEW_YORK_TIME_ZONE = 'America/New_York'

async function getAllJobs(): Promise<Job[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('jobs').select('*').order('date', { ascending: true }).order('time', { ascending: true })

  if (error) {
    console.error('Error fetching jobs:', error.message)
    return []
  }

  return data as Job[]
}

export default async function CalendarPage() {
  const jobs = await getAllJobs()
  const initialDate = new Date().toLocaleDateString('en-CA', { timeZone: NEW_YORK_TIME_ZONE })

  return <CalendarClient initialJobs={jobs} initialDate={initialDate} />
}
