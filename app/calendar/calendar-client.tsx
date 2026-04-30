'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Job } from '@/lib/supabase'

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

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type CalendarClientProps = {
  initialJobs: Job[]
  initialDate: string
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

export function CalendarClient({ initialJobs, initialDate }: CalendarClientProps) {
  const normalizedInitialDate = normalizeDateString(initialDate)
  const initialParts = parseDateParts(normalizedInitialDate)
  const [viewYear, setViewYear] = useState(initialParts.year)
  const [viewMonth, setViewMonth] = useState(initialParts.month - 1)
  const [selectedDate, setSelectedDate] = useState(normalizedInitialDate)

  const jobsByDate = useMemo(() => {
    return initialJobs.reduce<Record<string, Job[]>>((acc, job) => {
      const normalizedJobDate = normalizeDateString(job.date)
      if (!acc[normalizedJobDate]) acc[normalizedJobDate] = []
      acc[normalizedJobDate].push(job)
      return acc
    }, {})
  }, [initialJobs])

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Calendar</h1>
            <p className="text-sm text-slate-400">Plan your month and book jobs quickly</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href={`/new-job?date=${selectedDate}`}
              className="text-xs font-medium px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              + Add Job
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <section className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="w-10 h-10 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              aria-label="Previous month"
            >
              ←
            </button>
            <h2 className="text-lg font-semibold text-slate-900">{monthLabel}</h2>
            <button
              type="button"
              onClick={goToNextMonth}
              className="w-10 h-10 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              aria-label="Next month"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
            {weekdayLabels.map(label => (
              <div key={label} className="py-1">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((cell, index) => {
              if (!cell) {
                return <div key={`empty-${index}`} className="min-h-28 rounded-2xl bg-slate-50/60" />
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
                  className={`min-h-28 rounded-2xl border p-2 text-left transition-colors cursor-pointer ${
                    isSelected ? 'border-blue-200 bg-blue-50/60' : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-900'}`}>
                      {cell.dayNumber}
                    </span>
                    <Link
                      href={`/new-job?date=${cell.date}`}
                      onClick={event => event.stopPropagation()}
                      className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
                    >
                      + Add Job
                    </Link>
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

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{selectedDateLabel}</h2>
              <p className="text-sm text-slate-400">
                {selectedJobs.length} {selectedJobs.length === 1 ? 'job' : 'jobs'} scheduled
              </p>
            </div>
            <Link
              href={`/new-job?date=${selectedDate}`}
              className="text-xs font-medium px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              + Add Job
            </Link>
          </div>

          {selectedJobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
              <p className="text-4xl mb-2">📅</p>
              <p className="font-medium">No jobs booked for this day</p>
            </div>
          ) : (
            selectedJobs.map(job => {
              const status = statusConfig[job.status]
              const icon = serviceIcons[job.service_type] ?? '🔧'

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
                        <Link href={`/new-job?date=${job.date}`} className="mt-2 inline-block text-xs font-medium text-blue-600 hover:text-blue-700">
                          {formatDateLabel(job.date)}
                        </Link>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-slate-700">{formatTimeLabel(job.time)}</p>
                      <p className="text-sm font-bold text-blue-600">${job.price}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                    <Link href={`/new-job?date=${job.date}`} className="text-xs text-blue-600 font-medium hover:text-blue-700">
                      Book another on this date →
                    </Link>
                  </div>
                </div>
              )
            })
          )}
        </section>
      </main>
    </div>
  )
}
