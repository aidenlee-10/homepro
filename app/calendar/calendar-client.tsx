'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { Job } from '@/lib/supabase'
import { createClient } from '@/lib/supabase/client'
import { AddressLine } from '@/app/components/address-line'
import { EditJobPayload, JobEditModal } from '@/app/components/job-edit-modal'
import { CancelJobModal } from '@/app/components/cancel-job-modal'
import { DeleteJobModal } from '@/app/components/delete-job-modal'
import { ServiceTypeIcon } from '@/app/components/service-type-icon'
import { SidebarLayout } from '@/app/components/sidebar-layout'

const supabase = createClient()

const statusConfig = {
  scheduled: { label: 'Scheduled', bg: 'bg-blue-50', text: 'text-[#2563eb]', dot: 'bg-[#2563eb]' },
  in_progress: { label: 'In progress', bg: 'bg-amber-50', text: 'text-[#d97706]', dot: 'bg-[#d97706]' },
  completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-[#059669]', dot: 'bg-[#059669]' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-[#dc2626]', dot: 'bg-[#dc2626]' },
}

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type CalendarClientProps = {
  initialJobs: Job[]
  initialDate: string
  isWorker: boolean
}

function parseDateParts(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return { year, month, day }
}

function normalizeDateString(date: string) {
  const { year, month, day } = parseDateParts(date)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatMonthLabel(year: number, monthIndex: number) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/New_York',
  }).format(new Date(Date.UTC(year, monthIndex, 1, 12)))
}

function formatDateLabel(date: string) {
  const { year, month, day } = parseDateParts(date)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)))
}

function formatTimeLabel(time: string) {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function CalendarClient({ initialJobs, initialDate, isWorker }: CalendarClientProps) {
  const normalizedInitialDate = normalizeDateString(initialDate)
  const initialParts = parseDateParts(normalizedInitialDate)
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [viewYear, setViewYear] = useState(initialParts.year)
  const [viewMonth, setViewMonth] = useState(initialParts.month - 1)
  const [selectedDate, setSelectedDate] = useState(normalizedInitialDate)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [cancellingJobId, setCancellingJobId] = useState<string | null>(null)
  const [isCancellingJob, setIsCancellingJob] = useState(false)

  const jobsByDate = useMemo(() => {
    return jobs.reduce<Record<string, Job[]>>((acc, job) => {
      const normalizedJobDate = normalizeDateString(job.date)
      if (!acc[normalizedJobDate]) acc[normalizedJobDate] = []
      acc[normalizedJobDate].push(job)
      return acc
    }, {})
  }, [jobs])

  const selectedJobs = useMemo(() => {
    return [...(jobsByDate[selectedDate] ?? [])].sort((a, b) => a.time.localeCompare(b.time))
  }, [jobsByDate, selectedDate])

  const monthLabel = formatMonthLabel(viewYear, viewMonth)
  const selectedDateLabel = formatDateLabel(selectedDate)

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const leadingEmptyDays = firstDay.getDay()
    const totalCells = Math.ceil((leadingEmptyDays + daysInMonth) / 7) * 7

    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - leadingEmptyDays + 1
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        return null
      }

      const date = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
      return {
        date,
        dayNumber,
        jobs: jobsByDate[date] ?? [],
      }
    })
  }, [jobsByDate, viewMonth, viewYear])

  function goToPreviousMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(prev => prev - 1)
      setSelectedDate(`${viewYear - 1}-12-01`)
      return
    }

    setViewMonth(prev => prev - 1)
    setSelectedDate(`${viewYear}-${String(viewMonth).padStart(2, '0')}-01`)
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(prev => prev + 1)
      setSelectedDate(`${viewYear + 1}-01-01`)
      return
    }

    setViewMonth(prev => prev + 1)
    setSelectedDate(`${viewYear}-${String(viewMonth + 2).padStart(2, '0')}-01`)
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
    <SidebarLayout
      title="Calendar"
      subtitle="Plan your month and book jobs quickly"
      isWorker={isWorker}
      headerActions={
        !isWorker ? (
          <Link
            href={`/new-job?date=${selectedDate}`}
            className="hp-btn-primary inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm"
          >
            + Add Job
          </Link>
        ) : null
      }
    >
      <div className="space-y-5">
        <section className="hp-card rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="hp-btn-secondary flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">{monthLabel}</h2>
            <button
              type="button"
              onClick={goToNextMonth}
              className="hp-btn-secondary flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-2 text-center text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {weekdayLabels.map(label => (
              <div key={label} className="py-1">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((cell, index) => {
              if (!cell) {
                return <div key={`empty-${index}`} className="min-h-28 rounded-2xl bg-slate-50/50" />
              }

              const isSelected = cell.date === selectedDate
              const hasJobs = cell.jobs.length > 0

              return (
                <div
                  key={cell.date}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedDate(cell.date)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedDate(cell.date)
                    }
                  }}
                  className={`min-h-28 cursor-pointer rounded-2xl border p-2 text-left shadow-sm transition-all duration-200 ease-out ${
                    isSelected ? 'border-[#2563eb]/30 bg-blue-50/80 ring-1 ring-[#2563eb]/20' : 'border-slate-100 bg-white hover:-translate-y-0.5 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm font-semibold ${isSelected ? 'text-[#2563eb]' : 'text-slate-900'}`}>
                      {cell.dayNumber}
                    </span>
                    {!isWorker ? (
                      <Link
                        href={`/new-job?date=${cell.date}`}
                        onClick={event => event.stopPropagation()}
                        className="text-[11px] font-medium text-[#2563eb] transition-colors duration-200 hover:underline"
                      >
                        + Add Job
                      </Link>
                    ) : null}
                  </div>

                  {hasJobs ? (
                    <div className="mt-3 space-y-1">
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        {cell.jobs.length} {cell.jobs.length === 1 ? 'job' : 'jobs'}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {cell.jobs.slice(0, 3).map(job => (
                          <span key={job.id} className="w-2 h-2 rounded-full bg-emerald-500" />
                        ))}
                        {cell.jobs.length > 3 && <span className="text-[11px] text-slate-400">+{cell.jobs.length - 3}</span>}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-300">No jobs</p>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">{selectedDateLabel}</h2>
              <p className="text-sm font-medium text-slate-400 mt-1">
                {selectedJobs.length} {selectedJobs.length === 1 ? 'job' : 'jobs'} scheduled
              </p>
            </div>
            {!isWorker ? (
              <Link href={`/new-job?date=${selectedDate}`} className="hp-btn-primary rounded-xl px-4 py-2 text-sm">
                + Add Job
              </Link>
            ) : null}
          </div>

          {selectedJobs.length === 0 ? (
            <div className="hp-card rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
              <CalendarDays className="mx-auto mb-2 h-14 w-14 text-slate-200" strokeWidth={1.25} aria-hidden />
              <p className="text-sm font-medium text-slate-500">No jobs booked for this day</p>
            </div>
          ) : (
            <div key={selectedDate} className="space-y-4">
              {selectedJobs.map((job, index) => {
              const status = statusConfig[job.status]
              const canCancelJob = job.status !== 'completed' && job.status !== 'cancelled'

              return (
                <div
                  key={job.id}
                  style={{ animationDelay: `${Math.min(index, 12) * 55}ms` }}
                  className={`hp-stagger-fade-up hp-card rounded-2xl border border-slate-100 bg-white border-l-[6px] p-5 shadow-sm transition-[border-color,box-shadow,transform] duration-200 ${
                    job.status === 'scheduled'
                      ? 'border-l-[#2563eb]'
                      : job.status === 'in_progress'
                        ? 'border-l-[#d97706]'
                        : job.status === 'completed'
                          ? 'border-l-[#059669]'
                          : 'border-l-[#dc2626]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-600">
                        <ServiceTypeIcon serviceType={job.service_type} className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{job.customer_name}</p>
                        <p className="truncate text-sm font-medium text-slate-500">{job.service_type}</p>
                        <AddressLine className="mt-1">{job.address}</AddressLine>
                        <Link href={`/new-job?date=${job.date}`} className="mt-2 inline-block text-xs font-medium text-[#2563eb] hover:underline">
                          {formatDateLabel(job.date)}
                        </Link>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-slate-700 tabular-nums">{formatTimeLabel(job.time)}</p>
                      <p className="mt-1 text-base font-semibold tabular-nums text-[#2563eb]">${job.price}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors duration-200 ${status.bg} ${status.text}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="text-xs font-medium text-[#2563eb] transition-colors duration-200 hover:underline"
                      >
                        View details
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingJob(job)}
                        className="hp-btn-secondary rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
                      >
                        Edit
                      </button>
                      {canCancelJob ? (
                        <button
                          type="button"
                          onClick={() => setCancellingJobId(job.id)}
                          className="hp-btn-secondary rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-[color,border-color,box-shadow,transform] duration-200"
                        >
                          Cancel Job
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setDeletingJobId(job.id)}
                        className="hp-btn-secondary rounded-xl border border-red-100 bg-white px-3 py-1.5 text-xs font-medium text-[#dc2626] shadow-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            </div>
          )}
        </section>
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
    </SidebarLayout>
  )
}
