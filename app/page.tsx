import { supabase, Job } from '@/lib/supabase'

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

async function getTodaysJobs(): Promise<Job[]> {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('date', today)
    .order('time', { ascending: true })
  if (error) { console.error('Error fetching jobs:', error.message); return [] }
  return data as Job[]
}

export default async function DashboardPage() {
  const jobs = await getTodaysJobs()

  const completed = jobs.filter(j => j.status === 'completed')
  const revenue = completed.reduce((sum, j) => sum + j.price, 0)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">HomePro</h1>
            <p className="text-sm text-slate-400">{today}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">JP</div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Today's Jobs</p>
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
          ) : jobs.map(job => {
            const s = statusConfig[job.status]
            const icon = serviceIcons[job.service_type] ?? '🔧'
            const time = new Date(`2000-01-01T${job.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            return (
              <div key={job.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl">{icon}</div>
                    <div>
                      <p className="font-semibold text-slate-900">{job.customer_name}</p>
                      <p className="text-sm text-slate-500">{job.service_type}</p>
                      <p className="text-xs text-slate-400 mt-1">📍 {job.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700">{time}</p>
                    <p className="text-sm font-bold text-blue-600">${job.price}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                  <button className="text-xs text-blue-600 font-medium">View details →</button>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}