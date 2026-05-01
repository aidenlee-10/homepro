'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Job } from '@/lib/supabase'
import { EditJobPayload, JobEditModal } from '@/app/components/job-edit-modal'
import { DeleteJobModal } from '@/app/components/delete-job-modal'

const supabase = createClient()

const statusConfig = {
  scheduled: { label: 'Scheduled', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  in_progress: { label: 'In Progress', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  completed: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400' },
}

const serviceIcons: Record<string, string> = {
  'Window Cleaning': '🪟',
  'Gutter Cleaning': '🏠',
  'Pressure Washing': '💧',
  'Solar Panel Cleaning': '☀️',
}

type DashboardClientProps = {
  initialJobs: Job[]
  todayLabel: string
  isWorker: boolean
}

export function DashboardClient({ initialJobs, todayLabel, isWorker }: DashboardClientProps) {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const completed = useMemo(() => jobs.filter(j => j.status === 'completed'), [jobs])
  const revenue = useMemo(() => completed.reduce((sum, j) => sum + j.price, 0), [completed])

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

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">HomePro</h1>
            <p className="text-sm text-slate-400">{todayLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/calendar"
              className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Calendar
            </Link>
            {!isWorker ? (
              <>
                <Link
                  href="/customers"
                  className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Customers
                </Link>
                <Link
                  href="/workers"
                  className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Workers
                </Link>
                <Link
                  href="/history"
                  className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  History
                </Link>
                <Link
                  href="/new-job"
                  className="text-xs font-medium px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  + Add Job
                </Link>
              </>
            ) : null}
            <button
              type="button"
              onClick={signOut}
              className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Sign Out
            </button>
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
              JP
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Today&apos;s Jobs</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{jobs.length}</p>
            <p className="text-xs text-slate-400 mt-1">{completed.length} completed</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Revenue</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">${revenue}</p>
            <p className="text-xs text-slate-400 mt-1">from completed jobs</p>
          </div>
        </div>

        <div className="space-y-3">
          {jobs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-4xl mb-2">📋</p>
              <p className="font-medium">No jobs today</p>
            </div>
          ) : (
            jobs.map(job => {
              const s = statusConfig[job.status]
              const icon = serviceIcons[job.service_type] ?? '🔧'
              const time = new Date(`2000-01-01T${job.time}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })
              const canComplete = job.status !== 'completed' && job.status !== 'cancelled'
              return (
                <div key={job.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl">
                        {icon}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{job.customer_name}</p>
                        <p className="text-sm text-slate-500">{job.service_type}</p>
                        <p className="text-xs text-slate-400 mt-1">📍 {job.address}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-slate-700">{time}</p>
                      <p className="text-sm font-bold text-blue-600">${job.price}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-50 flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {canComplete && (
                        <button
                          type="button"
                          disabled={busyId === job.id}
                          onClick={() => markComplete(job.id)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                        >
                          {busyId === job.id ? 'Saving…' : 'Mark as Complete'}
                        </button>
                      )}
                      <button type="button" className="text-xs text-blue-600 font-medium hover:text-blue-700">
                        View details →
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingJob(job)}
                        className="text-xs text-slate-600 font-medium hover:text-slate-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingJobId(job.id)}
                        className="text-xs text-red-600 font-medium hover:text-red-700"
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
      </main>
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
    </div>
  )
}
