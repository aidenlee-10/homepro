'use client'

import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Job } from '@/lib/supabase'
import { AddressLine } from '@/app/components/address-line'
import { EditJobPayload, JobEditModal } from '@/app/components/job-edit-modal'
import { CancelJobModal } from '@/app/components/cancel-job-modal'
import { DeleteJobModal } from '@/app/components/delete-job-modal'
import { ServiceTypeIcon } from '@/app/components/service-type-icon'
import { SidebarLayout } from '@/app/components/sidebar-layout'

const supabase = createClient()

const statusConfig = {
  scheduled: {
    label: 'Scheduled',
    pill: 'bg-blue-50 text-[#2563eb]',
    dot: 'bg-[#2563eb]',
    border: 'border-l-[#2563eb]',
  },
  in_progress: {
    label: 'In progress',
    pill: 'bg-amber-50 text-[#d97706]',
    dot: 'bg-[#d97706]',
    border: 'border-l-[#d97706]',
  },
  completed: {
    label: 'Completed',
    pill: 'bg-emerald-50 text-[#059669]',
    dot: 'bg-[#059669]',
    border: 'border-l-[#059669]',
  },
  cancelled: {
    label: 'Cancelled',
    pill: 'bg-red-50 text-[#dc2626]',
    dot: 'bg-[#dc2626]',
    border: 'border-l-[#dc2626]',
  },
}

function greetingForNy(): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      hour12: false,
    })
      .formatToParts(new Date())
      .find(p => p.type === 'hour')?.value ?? '12',
  )
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

type DashboardClientProps = {
  initialJobs: Job[]
  todayLabel: string
  isWorker: boolean
  displayName: string
}

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: string | number
  hint: string
  icon: ReactNode
}) {
  return (
    <div className="hp-card group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900 tracking-tight">{value}</p>
          <p className="mt-1.5 text-xs font-medium text-slate-400">{hint}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-2.5 text-slate-400 transition-colors duration-200 group-hover:text-[#2563eb]">
          {icon}
        </div>
      </div>
    </div>
  )
}

export function DashboardClient({ initialJobs, todayLabel, isWorker, displayName }: DashboardClientProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [cancellingJobId, setCancellingJobId] = useState<string | null>(null)
  const [isCancellingJob, setIsCancellingJob] = useState(false)

  const completed = useMemo(() => jobs.filter(j => j.status === 'completed'), [jobs])
  const revenue = useMemo(() => completed.reduce((sum, j) => sum + j.price, 0), [completed])
  const greeting = useMemo(() => greetingForNy(), [])

  async function markComplete(jobId: string) {
    const previous = jobs.find(j => j.id === jobId)
    if (!previous || previous.status === 'completed') return

    setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, status: 'completed' } : j)))
    setBusyId(jobId)

    const { error } = await supabase.from('jobs').update({ status: 'completed' }).eq('id', jobId)

    setBusyId(null)

    if (error) {
      console.error('Error updating job:', error.message)
      if (previous) {
        setJobs(prev => prev.map(j => (j.id === jobId ? previous : j)))
      }
    }
  }

  async function handleConfirmCancelJob() {
    if (!cancellingJobId) return
    const targetId = cancellingJobId
    const previous = jobs.find(j => j.id === targetId)
    if (!previous) {
      setCancellingJobId(null)
      return
    }

    setIsCancellingJob(true)
    setJobs(prev => prev.map(j => (j.id === targetId ? { ...j, status: 'cancelled' } : j)))
    if (editingJob?.id === targetId) {
      setEditingJob(null)
    }

    const { error } = await supabase.from('jobs').update({ status: 'cancelled' }).eq('id', targetId)

    setIsCancellingJob(false)
    setCancellingJobId(null)

    if (error) {
      console.error('Error cancelling job:', error.message)
      setJobs(prev => prev.map(j => (j.id === targetId ? previous : j)))
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingJobId) return
    setIsDeleting(true)
    const previousJobs = jobs
    setJobs(prev => prev.filter(job => job.id !== deletingJobId))

    const { error } = await supabase.from('jobs').delete().eq('id', deletingJobId)
    if (error) {
      console.error('Error deleting job:', error.message)
      setJobs(previousJobs)
    }
    setIsDeleting(false)
    setDeletingJobId(null)
  }

  async function handleSaveEdit(payload: EditJobPayload) {
    if (!editingJob) return
    setSavingEdit(true)
    const targetId = editingJob.id
    const previousJobs = jobs
    const nextJobs = jobs.map(job => (job.id === targetId ? { ...job, ...payload } : job))
    setJobs(nextJobs)

    const { error } = await supabase.from('jobs').update(payload).eq('id', targetId)
    if (error) {
      console.error('Error updating job:', error.message)
      setJobs(previousJobs)
      setSavingEdit(false)
      throw new Error('Could not save job changes.')
    }

    setEditingJob(null)
    setSavingEdit(false)
  }

  return (
    <SidebarLayout showPageHeader={false} isWorker={isWorker}>
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {greeting}, {displayName}
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-400">{todayLabel}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-10">
        <StatCard
          label="Today&apos;s jobs"
          value={jobs.length}
          hint="Scheduled for today"
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M8 6V4h8v2h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3Zm0 2H6v12h12V8H8Zm2 4h2v2h-2v-2Zm4 0h2v2h-2v-2Zm-4 4h2v2h-2v-2Zm4 0h2v2h-2v-2Z" fill="currentColor" />
            </svg>
          }
        />
        <StatCard
          label="Revenue"
          value={`$${revenue}`}
          hint="From completed work"
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 2v2a7 7 0 0 1 0 14v2a9 9 0 0 0 0-18Zm0 4v2a3 3 0 0 1 0 6v2a5 5 0 0 0 0-10Zm-1 5h2v2h-2v-2Z" fill="currentColor" />
            </svg>
          }
        />
        <StatCard
          label="Completed"
          value={completed.length}
          hint="Marked complete today"
          icon={
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="m9 16.2-3.5-3.5-1.4 1.4L9 19 20.3 7.7l-1.4-1.4L9 16.2Z" fill="currentColor" />
            </svg>
          }
        />
      </div>

      <div className="space-y-4">
        {jobs.length === 0 ? (
          <div className="hp-card rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center shadow-sm">
            <ClipboardList className="mx-auto mb-3 h-14 w-14 text-slate-200" strokeWidth={1.25} aria-hidden />
            <p className="text-sm font-medium text-slate-500">No jobs on the schedule today</p>
            <p className="mt-1 text-xs font-medium text-slate-400">When you add jobs, they&apos;ll show up here.</p>
          </div>
        ) : (
          jobs.map((job, index) => {
            const s = statusConfig[job.status]
            const time = new Date(`2000-01-01T${job.time}`).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })
            const canComplete = job.status !== 'completed' && job.status !== 'cancelled'
            const canCancelJob = job.status !== 'completed' && job.status !== 'cancelled'
            return (
              <div
                key={job.id}
                style={{ animationDelay: `${Math.min(index, 12) * 55}ms` }}
                className={`hp-stagger-fade-up hp-card group rounded-2xl border border-slate-100 bg-white border-l-[6px] ${s.border} p-5 shadow-sm transition-[border-color,box-shadow,transform] duration-200`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-slate-900 truncate">{job.customer_name}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-sm font-medium text-slate-500 truncate">
                      <ServiceTypeIcon serviceType={job.service_type} className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{job.service_type}</span>
                    </p>
                    <AddressLine className="mt-2">{job.address}</AddressLine>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-700 tabular-nums">{time}</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-[#2563eb]">${job.price}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors duration-200 ${s.pill}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {canComplete && (
                      <button
                        type="button"
                        disabled={busyId === job.id}
                        onClick={() => markComplete(job.id)}
                        className="hp-btn-primary rounded-xl px-4 py-2 text-xs"
                      >
                        {busyId === job.id ? 'Saving…' : 'Mark complete'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-xs font-medium text-[#2563eb] transition-colors duration-200 hover:underline"
                    >
                      View details
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingJob(job)}
                      className="hp-btn-secondary rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm"
                    >
                      Edit
                    </button>
                    {canCancelJob ? (
                      <button
                        type="button"
                        onClick={() => setCancellingJobId(job.id)}
                        className="hp-btn-secondary rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm transition-[color,border-color,box-shadow,transform] duration-200"
                      >
                        Cancel Job
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setDeletingJobId(job.id)}
                      className="hp-btn-secondary rounded-xl border border-red-100 bg-white px-4 py-2 text-xs font-medium text-[#dc2626] shadow-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {editingJob ? (
        <JobEditModal
          key={editingJob.id}
          job={editingJob}
          isSaving={savingEdit}
          onClose={() => !savingEdit && setEditingJob(null)}
          onSave={handleSaveEdit}
        />
      ) : null}
      {deletingJobId ? (
        <DeleteJobModal isDeleting={isDeleting} onCancel={() => !isDeleting && setDeletingJobId(null)} onConfirm={handleDeleteConfirm} />
      ) : null}
      {cancellingJobId ? (
        <CancelJobModal
          isCancelling={isCancellingJob}
          onDismiss={() => !isCancellingJob && setCancellingJobId(null)}
          onConfirmCancel={handleConfirmCancelJob}
        />
      ) : null}

      {!isWorker ? (
        <Link
          href="/new-job"
          aria-label="Add job"
          className="fixed bottom-20 right-4 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-[#2563eb] to-[#1d4ed8] text-white shadow-[0_8px_28px_-4px_rgba(37,99,235,0.5),0_4px_14px_-4px_rgba(15,23,42,0.15)] transition-[transform,box-shadow] duration-200 ease-out hover:scale-110 hover:shadow-[0_14px_36px_-4px_rgba(37,99,235,0.55),0_6px_18px_-4px_rgba(15,23,42,0.18)] active:scale-95 md:bottom-8 md:right-8 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#2563eb]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8fafc]"
        >
          <Plus className="h-8 w-8" strokeWidth={2.5} aria-hidden />
        </Link>
      ) : null}
    </SidebarLayout>
  )
}
