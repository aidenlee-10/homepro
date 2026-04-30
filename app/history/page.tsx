import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCompanyIdForSession } from '@/lib/company-server'
import type { Job } from '@/lib/supabase'

const NEW_YORK_TIME_ZONE = 'America/New_York'

const statusConfig = {
  scheduled: { label: 'Scheduled', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  in_progress: { label: 'In Progress', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400' },
} as const

function monthKeyFromDate(date: string) {
  return date.slice(0, 7)
}

function formatMonthHeading(monthKey: string) {
  const [y, m] = monthKey.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: NEW_YORK_TIME_ZONE,
  }).format(new Date(Date.UTC(y, m - 1, 1, 12)))
}

function formatJobDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: NEW_YORK_TIME_ZONE,
  }).format(new Date(Date.UTC(year, month - 1, day, 12)))
}

function compareJobsRecentFirst(a: Job, b: Job) {
  const dateCmp = b.date.localeCompare(a.date)
  if (dateCmp !== 0) return dateCmp
  return b.time.localeCompare(a.time)
}

export default async function HistoryPage() {
  const companyId = await getCompanyIdForSession()
  const supabase = await createClient()

  if (!companyId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 px-4 py-4">
          <div className="max-w-lg mx-auto">
            <h1 className="text-xl font-bold text-slate-900">Job history</h1>
            <p className="text-sm text-slate-500 mt-1">No company found for your account.</p>
          </div>
        </header>
      </div>
    )
  }

  const { data: jobsData, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', companyId)
    .order('date', { ascending: false })
    .order('time', { ascending: false })

  if (error) {
    console.error('Error fetching jobs:', error.message)
  }

  const jobs = (jobsData ?? []) as Job[]
  jobs.sort(compareJobsRecentFirst)

  const completedJobs = jobs.filter(j => j.status === 'completed')
  const totalRevenue = completedJobs.reduce((sum, j) => sum + j.price, 0)
  const completedCount = completedJobs.length

  const byMonth = new Map<string, Job[]>()
  for (const job of jobs) {
    const key = monthKeyFromDate(job.date)
    if (!byMonth.has(key)) byMonth.set(key, [])
    byMonth.get(key)!.push(job)
  }

  const monthKeys = [...byMonth.keys()].sort((a, b) => b.localeCompare(a))

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Job history</h1>
            <p className="text-sm text-slate-400">All jobs for your company</p>
          </div>
          <Link
            href="/"
            className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Total revenue</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">${totalRevenue}</p>
            <p className="text-xs text-slate-400 mt-1">from completed jobs</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Completed</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{completedCount}</p>
            <p className="text-xs text-slate-400 mt-1">jobs marked complete</p>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
            <p className="text-4xl mb-2">📜</p>
            <p className="font-medium">No jobs yet</p>
          </div>
        ) : (
          monthKeys.map(monthKey => {
            const monthJobs = byMonth.get(monthKey) ?? []
            const monthSubtotal = monthJobs.reduce((sum, j) => sum + j.price, 0)
            return (
              <section key={monthKey} className="space-y-3">
                <div className="flex items-baseline justify-between gap-3 px-0.5">
                  <h2 className="text-lg font-semibold text-slate-900">{formatMonthHeading(monthKey)}</h2>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700">${monthSubtotal}</p>
                    <p className="text-xs text-slate-400">{monthJobs.length} job{monthJobs.length === 1 ? '' : 's'}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {monthJobs.map(job => {
                    const s = statusConfig[job.status]
                    return (
                      <div key={job.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{job.customer_name}</p>
                            <p className="text-sm text-slate-500 mt-0.5">{job.service_type}</p>
                            <p className="text-xs text-slate-500 mt-1">{formatJobDate(job.date)}</p>
                            <p className="text-xs text-slate-400 mt-1">📍 {job.address}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-blue-600">${job.price}</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-50">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })
        )}
      </main>
    </div>
  )
}
