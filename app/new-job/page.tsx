import { Suspense } from 'react'
import { getSessionMembership } from '@/lib/company-server'
import { NewJobForm } from './new-job-form'

function NewJobFallback() {
  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 md:pb-0">
      <div className="md:pl-[260px] px-4 py-10">
        <div className="max-w-lg mx-auto rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-slate-400">Loading form…</p>
        </div>
      </div>
    </div>
  )
}

export default async function NewJobPage() {
  const membership = await getSessionMembership()
  const isWorker = membership?.isWorker ?? false

  return (
    <Suspense fallback={<NewJobFallback />}>
      <NewJobForm isWorker={isWorker} />
    </Suspense>
  )
}
