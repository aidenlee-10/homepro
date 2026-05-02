'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Customer, Service, Worker } from '@/lib/supabase'
import { SidebarLayout } from '@/app/components/sidebar-layout'

const supabase = createClient()

async function resolveCompanyIdForSession() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: ownerCompany } = await supabase.from('companies').select('id').eq('owner_id', user.id).maybeSingle()
  if (ownerCompany?.id) return ownerCompany.id

  const { data: worker } = await supabase.from('workers').select('company_id').eq('user_id', user.id).maybeSingle()
  return worker?.company_id ?? null
}

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

const field =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/35 focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)] disabled:opacity-60'

type NewJobFormProps = {
  isWorker: boolean
}

export function NewJobForm({ isWorker }: NewJobFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefilledDate = searchParams.get('date')
  const [prefilledYear = '', prefilledMonth = '', prefilledDay = ''] = prefilledDate?.split('-') ?? []
  const [customers, setCustomers] = useState<Customer[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [customersLoaded, setCustomersLoaded] = useState(false)
  const [workersLoaded, setWorkersLoaded] = useState(false)
  const [servicesLoaded, setServicesLoaded] = useState(false)
  const [customerChoice, setCustomerChoice] = useState('')
  const [newCustomerName, setNewCustomerName] = useState('')
  const [address, setAddress] = useState('')
  const [month, setMonth] = useState(prefilledMonth)
  const [day, setDay] = useState(prefilledDay)
  const [year, setYear] = useState(prefilledYear)
  const [hour, setHour] = useState('')
  const [minute, setMinute] = useState('')
  const [meridiem, setMeridiem] = useState<'AM' | 'PM'>('AM')
  const [serviceType, setServiceType] = useState('')
  const [customService, setCustomService] = useState('')
  const [price, setPrice] = useState('')
  const [status] = useState<'scheduled'>('scheduled')
  const [assignedTo, setAssignedTo] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadCustomersAndWorkers() {
      const resolvedCompanyId = await resolveCompanyIdForSession()
      if (!resolvedCompanyId || cancelled) {
        if (!cancelled) {
          setCustomersLoaded(true)
          setWorkersLoaded(true)
          setServicesLoaded(true)
        }
        return
      }

      if (!cancelled) setCompanyId(resolvedCompanyId)

      const [customersRes, workersRes, servicesRes] = await Promise.all([
        supabase.from('customers').select('*').eq('company_id', resolvedCompanyId).order('name', { ascending: true }),
        supabase.from('workers').select('*').eq('company_id', resolvedCompanyId).order('name', { ascending: true }),
        supabase.from('services').select('*').eq('company_id', resolvedCompanyId).order('name', { ascending: true }),
      ])
      if (!cancelled) {
        if (customersRes.error) console.error('Error loading customers:', customersRes.error.message)
        if (workersRes.error) console.error('Error loading workers:', workersRes.error.message)
        if (servicesRes.error) console.error('Error loading services:', servicesRes.error.message)
        setCustomers(customersRes.data ?? [])
        setWorkers(workersRes.data ?? [])
        setServices((servicesRes.data ?? []) as Service[])
        setCustomersLoaded(true)
        setWorkersLoaded(true)
        setServicesLoaded(true)
      }
    }
    loadCustomersAndWorkers()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsSaving(true)

    const numericPrice = Number(price)
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      setErrorMessage('Please enter a valid price.')
      setIsSaving(false)
      return
    }

    if (!/^\d{4}$/.test(year.trim())) {
      setErrorMessage('Please enter a valid 4-digit year.')
      setIsSaving(false)
      return
    }

    if (!month || !day || !hour || !minute) {
      setErrorMessage('Please complete the date and time fields.')
      setIsSaving(false)
      return
    }

    const monthIndex = monthOptions.findIndex(option => option.value === month)
    if (monthIndex === -1) {
      setErrorMessage('Please select a valid month.')
      setIsSaving(false)
      return
    }

    const dayNumber = Number(day)
    if (Number.isNaN(dayNumber) || dayNumber < 1 || dayNumber > 31) {
      setErrorMessage('Please select a valid day.')
      setIsSaving(false)
      return
    }

    if (!serviceType) {
      setErrorMessage('Please select a service type.')
      setIsSaving(false)
      return
    }

    const resolvedServiceType = serviceType === '__other__' ? customService.trim() : serviceType
    if (!resolvedServiceType) {
      setErrorMessage('Please enter a custom service type.')
      setIsSaving(false)
      return
    }

    if (!customerChoice) {
      setErrorMessage('Please select a customer.')
      setIsSaving(false)
      return
    }

    if (customerChoice === '__new__' && !newCustomerName.trim()) {
      setErrorMessage('Please enter the new customer name.')
      setIsSaving(false)
      return
    }

    const hourNumber = Number(hour)
    const twentyFourHour = meridiem === 'AM' ? hourNumber % 12 : (hourNumber % 12) + 12
    const normalizedMonth = String(monthIndex + 1).padStart(2, '0')
    const normalizedDay = String(dayNumber).padStart(2, '0')
    const normalizedDate = `${year.trim()}-${normalizedMonth}-${normalizedDay}`
    const normalizedTime = `${String(twentyFourHour).padStart(2, '0')}:${minute}`

    const resolvedCompanyId = companyId ?? (await resolveCompanyIdForSession())
    if (!resolvedCompanyId) {
      setErrorMessage('No company found for your account.')
      setIsSaving(false)
      return
    }

    let customerId: string | null = null
    let resolvedCustomerName = ''

    if (customerChoice === '__new__') {
      resolvedCustomerName = newCustomerName.trim()
      const { data: newCustomer, error: insertCustomerError } = await supabase
        .from('customers')
        .insert({
          company_id: resolvedCompanyId,
          name: resolvedCustomerName,
          phone: null,
          email: null,
          address: address.trim() || null,
          notes: null,
        })
        .select('id')
        .maybeSingle()

      if (insertCustomerError || !newCustomer?.id) {
        console.error('Error creating customer:', insertCustomerError?.message)
        setErrorMessage(insertCustomerError?.message ?? 'Could not create customer.')
        setIsSaving(false)
        return
      }
      customerId = newCustomer.id as string
    } else {
      const selected = customers.find(c => c.id === customerChoice)
      if (!selected) {
        setErrorMessage('Selected customer not found.')
        setIsSaving(false)
        return
      }
      customerId = selected.id
      resolvedCustomerName = selected.name
    }

    const { error } = await supabase.from('jobs').insert({
      company_id: resolvedCompanyId,
      customer_id: customerId,
      customer_name: resolvedCustomerName,
      address: address.trim(),
      date: normalizedDate,
      time: normalizedTime,
      service_type: resolvedServiceType,
      price: numericPrice,
      status,
      assigned_to: assignedTo || null,
    })

    if (error) {
      console.error('Error creating job:', error.message)
      setErrorMessage('Could not save the job. Please try again.')
      setIsSaving(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <SidebarLayout title="New Job" subtitle="Add today&apos;s or upcoming appointment" isWorker={isWorker}>
      <div className="max-w-lg">
        <form onSubmit={handleSubmit} className="hp-card space-y-5 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <label htmlFor="customer" className="text-sm font-medium text-slate-400">
              Customer
            </label>
            <select
              id="customer"
              value={customerChoice}
              onChange={e => {
                const value = e.target.value
                setCustomerChoice(value)
                if (value && value !== '__new__') {
                  const selected = customers.find(c => c.id === value)
                  if (selected?.address) setAddress(selected.address)
                }
              }}
              required
              disabled={!customersLoaded}
              className={field}
            >
              <option value="">{customersLoaded ? 'Select customer…' : 'Loading customers…'}</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="__new__">Add new customer…</option>
            </select>
          </div>

          {customerChoice === '__new__' ? (
            <div>
              <label htmlFor="newCustomerName" className="text-sm font-medium text-slate-400">
                New customer name
              </label>
              <input
                id="newCustomerName"
                type="text"
                value={newCustomerName}
                onChange={e => setNewCustomerName(e.target.value)}
                required
                className={field}
                placeholder="Jane Smith"
              />
            </div>
          ) : null}

          <div>
            <label htmlFor="assignedTo" className="text-sm font-medium text-slate-400">
              Assign to
            </label>
            <select id="assignedTo" value={assignedTo} onChange={e => setAssignedTo(e.target.value)} disabled={!workersLoaded} className={field}>
              <option value="">{workersLoaded ? 'Unassigned' : 'Loading workers…'}</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name ?? w.email ?? w.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="address" className="text-sm font-medium text-slate-400">
              Address
            </label>
            <input id="address" type="text" value={address} onChange={e => setAddress(e.target.value)} required className={field} placeholder="123 Main St" />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-400">Date</span>
            <div className="grid grid-cols-3 gap-3">
              <select value={month} onChange={e => setMonth(e.target.value)} required className={field}>
                <option value="">Month</option>
                {monthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select value={day} onChange={e => setDay(e.target.value)} required className={field}>
                <option value="">Day</option>
                {dayOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                inputMode="numeric"
                value={year}
                onChange={e => setYear(e.target.value)}
                required
                maxLength={4}
                className={field}
                placeholder="Year"
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-400">Time</span>
            <div className="grid grid-cols-3 gap-3">
              <select value={hour} onChange={e => setHour(e.target.value)} required className={field}>
                <option value="">Hour</option>
                {hourOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select value={minute} onChange={e => setMinute(e.target.value)} required className={field}>
                <option value="">Minute</option>
                {minuteOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select value={meridiem} onChange={e => setMeridiem(e.target.value as 'AM' | 'PM')} className={field}>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="serviceType" className="text-sm font-medium text-slate-400">
                Service type
              </label>
              <select
                id="serviceType"
                value={serviceType}
                onChange={e => {
                  const nextValue = e.target.value
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
              <label htmlFor="price" className="text-sm font-medium text-slate-400">
                Price
              </label>
              <input id="price" type="number" min="0" step="1" inputMode="numeric" value={price} onChange={e => setPrice(e.target.value)} required className={field} placeholder="150" />
            </div>
          </div>

          {serviceType === '__other__' && (
            <div>
              <label htmlFor="customService" className="text-sm font-medium text-slate-400">
                Custom service
              </label>
              <input id="customService" type="text" value={customService} onChange={e => setCustomService(e.target.value)} required className={field} placeholder="Enter custom service" />
            </div>
          )}

          <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-500">
            Status defaults to <span className="font-semibold text-slate-800">Scheduled</span>
          </div>

          {errorMessage && <p className="text-sm font-medium text-[#dc2626]">{errorMessage}</p>}

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="hp-btn-secondary text-sm font-medium px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="hp-btn-primary rounded-xl px-4 py-2 text-sm">
              {isSaving ? 'Saving…' : 'Save Job'}
            </button>
          </div>
        </form>
      </div>
    </SidebarLayout>
  )
}
