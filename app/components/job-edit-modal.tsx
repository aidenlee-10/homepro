'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Job, Worker } from '@/lib/supabase'

const supabase = createClient()

const monthOptions = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
] as const

const dayOptions = Array.from({ length: 31 }, (_, index) => {
  const day = String(index + 1)
  return { value: day.padStart(2, '0'), label: day }
})

const hourOptions = Array.from({ length: 12 }, (_, index) => String(index + 1))
const minuteOptions = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))

const serviceOptions = [
  'Window Cleaning',
  'Gutter Cleaning',
  'Pressure Washing',
  'Solar Panel Cleaning',
  'Roof Cleaning',
  'Driveway Cleaning',
  'Patio Cleaning',
  'Pool Cleaning',
  'Lawn Mowing',
  'Hedge Trimming',
  'Tree Trimming',
  'Leaf Removal',
  'Snow Removal',
  'Irrigation System Check',
  'Fence Repair',
  'Deck Repair',
  'Door Repair',
  'Window Repair',
  'Roof Repair',
  'Gutter Repair',
  'Fence Installation',
  'Deck Installation',
  'Garden Bed Installation',
  'Outdoor Lighting Installation',
  'Security Camera Installation',
  'Pest Control',
  'Home Inspection',
  'Mold Inspection',
  'Chimney Inspection',
  'Junk Removal',
  'Moving Help',
  'Handyman Services',
  'Paint Touch Up',
  'Caulking & Sealing',
  'Other',
] as const

export type EditJobPayload = {
  customer_name: string
  address: string
  date: string
  time: string
  service_type: string
  price: number
  assigned_to: string | null
}

type JobEditModalProps = {
  job: Job
  isSaving: boolean
  onClose: () => void
  onSave: (payload: EditJobPayload) => Promise<void>
}

export function JobEditModal({ job, isSaving, onClose, onSave }: JobEditModalProps) {
  const [year, month, day] = job.date.split('-')
  const [hour24, minuteValue] = job.time.split(':')
  const hour24Number = Number(hour24)
  const initialMeridiem: 'AM' | 'PM' = hour24Number >= 12 ? 'PM' : 'AM'
  const initialHour12 = String((hour24Number % 12) || 12)
  const isKnownService = useMemo(() => serviceOptions.includes(job.service_type as (typeof serviceOptions)[number]), [job.service_type])

  const [customerName, setCustomerName] = useState(job.customer_name)
  const [address, setAddress] = useState(job.address)
  const [monthValue, setMonthValue] = useState(month)
  const [dayValue, setDayValue] = useState(day)
  const [yearValue, setYearValue] = useState(year)
  const [hourValue, setHourValue] = useState(initialHour12)
  const [minute, setMinute] = useState(minuteValue)
  const [meridiem, setMeridiem] = useState<'AM' | 'PM'>(initialMeridiem)
  const [serviceType, setServiceType] = useState<(typeof serviceOptions)[number]>(isKnownService ? (job.service_type as (typeof serviceOptions)[number]) : 'Other')
  const [customService, setCustomService] = useState(isKnownService ? '' : job.service_type)
  const [price, setPrice] = useState(String(job.price))
  const [workers, setWorkers] = useState<Worker[]>([])
  const [assignedTo, setAssignedTo] = useState(job.assigned_to ?? '')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadWorkers() {
      const { data, error } = await supabase.from('workers').select('*').eq('company_id', job.company_id).order('name', { ascending: true })
      if (cancelled) return
      if (error) console.error('Error loading workers:', error.message)
      setWorkers(data ?? [])
    }
    loadWorkers()
    return () => {
      cancelled = true
    }
  }, [job.company_id, job.id])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    const numericPrice = Number(price)
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      setErrorMessage('Please enter a valid price.')
      return
    }

    if (!/^\d{4}$/.test(yearValue.trim()) || !monthValue || !dayValue || !hourValue || !minute) {
      setErrorMessage('Please complete all date and time fields.')
      return
    }

    const resolvedServiceType = serviceType === 'Other' ? customService.trim() : serviceType
    if (!resolvedServiceType) {
      setErrorMessage('Please enter a custom service type.')
      return
    }

    const hourNumber = Number(hourValue)
    const twentyFourHour = meridiem === 'AM' ? (hourNumber % 12) : ((hourNumber % 12) + 12)

    await onSave({
      customer_name: customerName.trim(),
      address: address.trim(),
      date: `${yearValue.trim()}-${monthValue}-${dayValue}`,
      time: `${String(twentyFourHour).padStart(2, '0')}:${minute}`,
      service_type: resolvedServiceType,
      price: numericPrice,
      assigned_to: assignedTo || null,
    }).catch(error => {
      setErrorMessage(error instanceof Error ? error.message : 'Could not save job changes.')
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-100 p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Edit Job</h2>
          <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Customer name</label>
            <input
              type="text"
              value={customerName}
              onChange={event => setCustomerName(event.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Address</label>
            <input
              type="text"
              value={address}
              onChange={event => setAddress(event.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Date</label>
            <div className="grid grid-cols-3 gap-3">
              <select value={monthValue} onChange={event => setMonthValue(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                {monthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select value={dayValue} onChange={event => setDayValue(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                {dayOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={yearValue}
                onChange={event => setYearValue(event.target.value)}
                required
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Time</label>
            <div className="grid grid-cols-3 gap-3">
              <select value={hourValue} onChange={event => setHourValue(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                {hourOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select value={minute} onChange={event => setMinute(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                {minuteOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select value={meridiem} onChange={event => setMeridiem(event.target.value as 'AM' | 'PM')} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Assign to</label>
            <select
              value={assignedTo}
              onChange={event => setAssignedTo(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Unassigned</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name ?? w.email ?? w.id}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Service type</label>
              <select
                value={serviceType}
                onChange={event => {
                  const nextValue = event.target.value as (typeof serviceOptions)[number]
                  setServiceType(nextValue)
                  if (nextValue !== 'Other') setCustomService('')
                }}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {serviceOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Price</label>
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={price}
                onChange={event => setPrice(event.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {serviceType === 'Other' ? (
            <div>
              <label className="text-sm font-medium text-slate-700">Custom service</label>
              <input
                type="text"
                value={customService}
                onChange={event => setCustomService(event.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : null}

          {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

          <div className="pt-1 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="text-sm font-medium px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none transition-colors">
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
