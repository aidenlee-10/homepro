'use client'

import { FormEvent, Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Customer, Worker } from '@/lib/supabase'

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

function NewJobForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefilledDate = searchParams.get('date')
  const [prefilledYear = '', prefilledMonth = '', prefilledDay = ''] = prefilledDate?.split('-') ?? []
  const [customers, setCustomers] = useState<Customer[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [customersLoaded, setCustomersLoaded] = useState(false)
  const [workersLoaded, setWorkersLoaded] = useState(false)
  const [customerChoice, setCustomerChoice] = useState('')
  const [newCustomerName, setNewCustomerName] = useState('')
  const [address, setAddress] = useState('')
  const [month, setMonth] = useState(prefilledMonth)
  const [day, setDay] = useState(prefilledDay)
  const [year, setYear] = useState(prefilledYear)
  const [hour, setHour] = useState('')
  const [minute, setMinute] = useState('')
  const [meridiem, setMeridiem] = useState<'AM' | 'PM'>('AM')
  const [serviceType, setServiceType] = useState<(typeof serviceOptions)[number]>('Window Cleaning')
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
        }
        return
      }

      if (!cancelled) setCompanyId(resolvedCompanyId)

      const [customersRes, workersRes] = await Promise.all([
        supabase.from('customers').select('*').eq('company_id', resolvedCompanyId).order('name', { ascending: true }),
        supabase.from('workers').select('*').eq('company_id', resolvedCompanyId).order('name', { ascending: true }),
      ])
      if (!cancelled) {
        if (customersRes.error) console.error('Error loading customers:', customersRes.error.message)
        if (workersRes.error) console.error('Error loading workers:', workersRes.error.message)
        setCustomers(customersRes.data ?? [])
        setWorkers(workersRes.data ?? [])
        setCustomersLoaded(true)
        setWorkersLoaded(true)
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

    const resolvedServiceType = serviceType === 'Other' ? customService.trim() : serviceType
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
    const twentyFourHour = meridiem === 'AM' ? (hourNumber % 12) : ((hourNumber % 12) + 12)
    // Build month/day from validated numeric parts so month is always 01-12 (never 0-based).
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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">New Job</h1>
            <p className="text-sm text-slate-400">Add today&apos;s or upcoming appointment</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <div>
            <label htmlFor="customer" className="text-sm font-medium text-slate-700">
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
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
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
              <label htmlFor="newCustomerName" className="text-sm font-medium text-slate-700">
                New customer name
              </label>
              <input
                id="newCustomerName"
                type="text"
                value={newCustomerName}
                onChange={e => setNewCustomerName(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Jane Smith"
              />
            </div>
          ) : null}

          <div>
            <label htmlFor="assignedTo" className="text-sm font-medium text-slate-700">
              Assign to
            </label>
            <select
              id="assignedTo"
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              disabled={!workersLoaded}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            >
              <option value="">{workersLoaded ? 'Unassigned' : 'Loading workers…'}</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name ?? w.email ?? w.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="address" className="text-sm font-medium text-slate-700">
              Address
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123 Main St"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Date</label>
            <div className="grid grid-cols-3 gap-3">
              <select
                value={month}
                onChange={e => setMonth(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Month</option>
                {monthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={day}
                onChange={e => setDay(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
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
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Year"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Time</label>
            <div className="grid grid-cols-3 gap-3">
              <select
                value={hour}
                onChange={e => setHour(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Hour</option>
                {hourOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={minute}
                onChange={e => setMinute(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Minute</option>
                {minuteOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={meridiem}
                onChange={e => setMeridiem(e.target.value as 'AM' | 'PM')}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="serviceType" className="text-sm font-medium text-slate-700">
                Service type
              </label>
              <select
                id="serviceType"
                value={serviceType}
                onChange={e => {
                  const nextValue = e.target.value as (typeof serviceOptions)[number]
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
              <label htmlFor="price" className="text-sm font-medium text-slate-700">
                Price
              </label>
              <input
                id="price"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="150"
              />
            </div>
          </div>

          {serviceType === 'Other' && (
            <div>
              <label htmlFor="customService" className="text-sm font-medium text-slate-700">
                Custom service
              </label>
              <input
                id="customService"
                type="text"
                value={customService}
                onChange={e => setCustomService(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter custom service"
              />
            </div>
          )}

          <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-sm text-slate-600">
            Status defaults to <span className="font-semibold text-slate-800">Scheduled</span>
          </div>

          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

          <div className="pt-1 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="text-sm font-medium px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              {isSaving ? 'Saving…' : 'Save Job'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default function NewJobPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50">
          <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
            <div className="max-w-lg mx-auto">
              <h1 className="text-xl font-bold text-slate-900">New Job</h1>
            </div>
          </header>
          <main className="max-w-lg mx-auto px-4 py-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <p className="text-sm text-slate-400">Loading form…</p>
            </div>
          </main>
        </div>
      }
    >
      <NewJobForm />
    </Suspense>
  )
}
