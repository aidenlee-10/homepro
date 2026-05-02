'use client'

import { FormEvent, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Job, Service, Worker } from '@/lib/supabase'

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

  const [customerName, setCustomerName] = useState(job.customer_name)
  const [address, setAddress] = useState(job.address)
  const [monthValue, setMonthValue] = useState(month)
  const [dayValue, setDayValue] = useState(day)
  const [yearValue, setYearValue] = useState(year)
  const [hourValue, setHourValue] = useState(initialHour12)
  const [minute, setMinute] = useState(minuteValue)
  const [meridiem, setMeridiem] = useState<'AM' | 'PM'>(initialMeridiem)
  const [services, setServices] = useState<Service[]>([])
  const [servicesLoaded, setServicesLoaded] = useState(false)
  const [serviceType, setServiceType] = useState('')
  const [customService, setCustomService] = useState('')
  const [price, setPrice] = useState(String(job.price))
  const [workers, setWorkers] = useState<Worker[]>([])
  const [workersLoaded, setWorkersLoaded] = useState(false)
  const [assignedTo, setAssignedTo] = useState(job.assigned_to ?? '')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadWorkers() {
      const { data, error } = await supabase
        .from('workers')
        .select('id, company_id, user_id, name, email, role, created_at')
        .eq('company_id', job.company_id)
        .order('name', { ascending: true })
      if (cancelled) return
      if (error) console.error('Error loading workers:', error.message)
      setWorkers(data ?? [])
      setWorkersLoaded(true)
    }
    loadWorkers()
    return () => {
      cancelled = true
    }
  }, [job.company_id, job.id])

  useEffect(() => {
    let cancelled = false
    async function loadServices() {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', job.company_id)
        .order('name', { ascending: true })

      if (cancelled) return
      if (error) console.error('Error loading services:', error.message)

      const nextServices = (data ?? []) as Service[]
      setServices(nextServices)
      setServicesLoaded(true)

      const matchingService = nextServices.find(service => service.name === job.service_type)
      if (matchingService) {
        setServiceType(matchingService.name)
        setCustomService('')
      } else {
        setServiceType('__other__')
        setCustomService(job.service_type)
      }
    }
    loadServices()
    return () => {
      cancelled = true
    }
  }, [job.company_id, job.id, job.service_type])

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

    if (!serviceType) {
      setErrorMessage('Please select a service type.')
      return
    }

    const resolvedServiceType = serviceType === '__other__' ? customService.trim() : serviceType
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

  const field =
    'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/35 focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)]'

  return (
    <div className="hp-animate-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-[2px]">
      <div className="hp-animate-modal-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-100 bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Edit job</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-slate-600"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-400">Customer name</label>
            <input type="text" value={customerName} onChange={event => setCustomerName(event.target.value)} required className={field} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-400">Address</label>
            <input type="text" value={address} onChange={event => setAddress(event.target.value)} required className={field} />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-400">Date</span>
            <div className="grid grid-cols-3 gap-3">
              <select value={monthValue} onChange={event => setMonthValue(event.target.value)} className={field} required>
                {monthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select value={dayValue} onChange={event => setDayValue(event.target.value)} className={field} required>
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
                className={field}
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-400">Time</span>
            <div className="grid grid-cols-3 gap-3">
              <select value={hourValue} onChange={event => setHourValue(event.target.value)} className={field} required>
                {hourOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select value={minute} onChange={event => setMinute(event.target.value)} className={field} required>
                {minuteOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select value={meridiem} onChange={event => setMeridiem(event.target.value as 'AM' | 'PM')} className={field}>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-400">Assign to</label>
            <select
              value={assignedTo}
              onChange={event => setAssignedTo(event.target.value)}
              disabled={!workersLoaded}
              className={field}
            >
              <option value="">{workersLoaded ? 'Unassigned' : 'Loading workers…'}</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name ?? w.email ?? w.id}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-400">Service type</label>
              <select
                value={serviceType}
                onChange={event => {
                  const nextValue = event.target.value
                  setServiceType(nextValue)
                  if (nextValue === '__other__') return
                  setCustomService('')
                  const selectedService = services.find(service => service.name === nextValue)
                  if (selectedService) {
                    setPrice(String(selectedService.default_price))
                  }
                }}
                disabled={!servicesLoaded}
                className={field}
              >
                <option value="">{servicesLoaded ? 'Select service…' : 'Loading services…'}</option>
                {services.map(service => (
                  <option key={service.id} value={service.name}>
                    {service.name}
                  </option>
                ))}
                <option value="__other__">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-400">Price</label>
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={price}
                onChange={event => setPrice(event.target.value)}
                required
                className={field}
              />
            </div>
          </div>

          {serviceType === '__other__' ? (
            <div>
              <label className="text-sm font-medium text-slate-400">Custom service</label>
              <input type="text" value={customService} onChange={event => setCustomService(event.target.value)} required className={field} />
            </div>
          ) : null}

          {errorMessage ? <p className="text-sm font-medium text-[#dc2626]">{errorMessage}</p> : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="hp-btn-secondary text-sm font-medium px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="hp-btn-primary rounded-xl px-4 py-2 text-sm">
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
