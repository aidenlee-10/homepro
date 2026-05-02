import { ScrollText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCompanyIdForSession, getSessionMembership } from '@/lib/company-server'
import type { Job } from '@/lib/supabase'
import { AddressLine } from '@/app/components/address-line'
import { ServiceTypeIcon } from '@/app/components/service-type-icon'
import { SidebarLayout } from '@/app/components/sidebar-layout'

const NEW_YORK_TIME_ZONE = 'America/New_York'

const statusConfig = {
  scheduled: { label: 'Scheduled', bg: 'bg-blue-50', text: 'text-[#2563eb]', dot: 'bg-[#2563eb]' },
  in_progress: { label: 'In progress', bg: 'bg-amber-50', text: 'text-[#d97706]', dot: 'bg-[#d97706]' },
  completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-[#059669]', dot: 'bg-[#059669]' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-[#dc2626]', dot: 'bg-[#dc2626]' },
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

function NoCompanyNotice() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-semibold tracking-tight text-slate-900">Job history</p>
        <p className="mt-2 text-sm font-medium text-slate-400">No company found for your account.</p>
      </div>
    </div>
  )
}

export default async function HistoryPage() {
  const companyId = await getCompanyIdForSession()
  const membership = await getSessionMembership()
  const supabase = await createClient()

  if (!companyId) {
    return <NoCompanyNotice />
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
    <SidebarLayout title="Job history" subtitle="All jobs for your company" isWorker={membership?.isWorker}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="hp-card rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total revenue</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-[#059669]">${totalRevenue}</p>
            <p className="mt-1.5 text-xs font-medium text-slate-400">From completed jobs</p>
          </div>
          <div className="hp-card rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Completed</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">{completedCount}</p>
            <p className="mt-1.5 text-xs font-medium text-slate-400">Jobs marked complete</p>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="hp-card rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
            <ScrollText className="mx-auto mb-3 h-14 w-14 text-slate-200" strokeWidth={1.25} aria-hidden />
            <p className="text-sm font-semibold text-slate-900">No jobs yet</p>
            <p className="mt-1 text-sm font-medium text-slate-400">Completed work will show up here.</p>
          </div>
        ) : (
          monthKeys.map(monthKey => {
            const monthJobs = byMonth.get(monthKey) ?? []
            const monthSubtotal = monthJobs.reduce((sum, j) => sum + j.price, 0)
            return (
              <section key={monthKey} className="space-y-4">
                <div className="flex items-baseline justify-between gap-3 px-0.5">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-900">{formatMonthHeading(monthKey)}</h2>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums text-slate-900">${monthSubtotal}</p>
                    <p className="text-xs font-medium text-slate-400">
                      {monthJobs.length} job{monthJobs.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {monthJobs.map((job, index) => {
                    const s = statusConfig[job.status]
                    const leftBorder =
                      job.status === 'scheduled'
                        ? 'border-l-[#2563eb]'
                        : job.status === 'in_progress'
                          ? 'border-l-[#d97706]'
                          : job.status === 'completed'
                            ? 'border-l-[#059669]'
                            : 'border-l-[#dc2626]'
                    return (
                      <div
                        key={job.id}
                        style={{ animationDelay: `${Math.min(index, 12) * 50}ms` }}
                        className={`hp-stagger-fade-up hp-card rounded-2xl border border-slate-100 border-l-[6px] bg-white p-5 shadow-sm ${leftBorder}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{job.customer_name}</p>
                            <p className="mt-0.5 flex items-center gap-2 text-sm font-medium text-slate-500">
                              <ServiceTypeIcon serviceType={job.service_type} className="h-4 w-4 shrink-0 text-slate-400" />
                              {job.service_type}
                            </p>
                            <p className="text-xs font-medium text-slate-400 mt-1">{formatJobDate(job.date)}</p>
                            <AddressLine className="mt-1">{job.address}</AddressLine>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold tabular-nums text-[#2563eb]">${job.price}</p>
                          </div>
                        </div>
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${s.bg} ${s.text}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
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
      </div>
    </SidebarLayout>
  )
}
