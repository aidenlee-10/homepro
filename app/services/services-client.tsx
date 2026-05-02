'use client'

import { FormEvent, useMemo, useState } from 'react'
import { Wrench } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Service } from '@/lib/supabase'

const supabase = createClient()

const field =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/35 focus:border-[#2563eb] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.12)]'

type ServicesClientProps = {
  initialServices: Service[]
  companyId: string
}

type EditingService = {
  id: string
  name: string
  default_price: number
}

export function ServicesClient({ initialServices, companyId }: ServicesClientProps) {
  const [services, setServices] = useState<Service[]>(initialServices)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingService, setEditingService] = useState<EditingService | null>(null)
  const [deletingService, setDeletingService] = useState<Service | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [priceInput, setPriceInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const sortedServices = useMemo(
    () => [...services].sort((a, b) => a.name.localeCompare(b.name)),
    [services],
  )

  function openAddModal() {
    setNameInput('')
    setPriceInput('')
    setErrorMessage('')
    setEditingService(null)
    setIsAddOpen(true)
  }

  function openEditModal(service: Service) {
    setNameInput(service.name)
    setPriceInput(String(service.default_price))
    setErrorMessage('')
    setIsAddOpen(false)
    setEditingService({ id: service.id, name: service.name, default_price: service.default_price })
  }

  function closeFormModal() {
    if (isSaving) return
    setIsAddOpen(false)
    setEditingService(null)
    setNameInput('')
    setPriceInput('')
    setErrorMessage('')
  }

  async function handleSaveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    const trimmedName = nameInput.trim()
    const parsedPrice = Number(priceInput)
    if (!trimmedName) {
      setErrorMessage('Please enter a service name.')
      return
    }
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMessage('Please enter a valid default price.')
      return
    }

    setIsSaving(true)
    if (editingService) {
      const previousServices = services
      const nextServices = services.map(service =>
        service.id === editingService.id ? { ...service, name: trimmedName, default_price: parsedPrice } : service,
      )
      setServices(nextServices)

      const { error } = await supabase
        .from('services')
        .update({ name: trimmedName, default_price: parsedPrice })
        .eq('id', editingService.id)

      if (error) {
        console.error('Error updating service:', error.message)
        setServices(previousServices)
        setErrorMessage('Could not update service.')
        setIsSaving(false)
        return
      }

      setIsSaving(false)
      closeFormModal()
      return
    }

    const { data, error } = await supabase
      .from('services')
      .insert({ company_id: companyId, name: trimmedName, default_price: parsedPrice })
      .select('*')
      .single()

    if (error || !data) {
      console.error('Error creating service:', error?.message)
      setErrorMessage(error?.message ?? 'Could not create service.')
      setIsSaving(false)
      return
    }

    setServices(prev => [data as Service, ...prev])
    setIsSaving(false)
    closeFormModal()
  }

  async function handleDeleteService() {
    if (!deletingService) return
    setIsSaving(true)
    const target = deletingService
    const previousServices = services
    setServices(prev => prev.filter(service => service.id !== target.id))

    const { error } = await supabase.from('services').delete().eq('id', target.id)
    if (error) {
      console.error('Error deleting service:', error.message)
      setServices(previousServices)
      setErrorMessage('Could not delete service.')
    }

    setIsSaving(false)
    setDeletingService(null)
  }

  const isFormOpen = isAddOpen || Boolean(editingService)
  const formTitle = editingService ? 'Edit service' : 'Add service'
  const saveLabel = editingService ? 'Save changes' : 'Add service'

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button type="button" onClick={openAddModal} className="hp-btn-primary rounded-xl px-4 py-2 text-sm">
          Add service
        </button>
      </div>
      <div className="space-y-4">
        {sortedServices.length === 0 ? (
          <div className="hp-card rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
            <Wrench className="mx-auto mb-3 h-14 w-14 text-slate-200" strokeWidth={1.25} aria-hidden />
            <p className="text-sm font-semibold text-slate-900">No services yet</p>
            <p className="mt-1 text-sm font-medium text-slate-400">Define what you sell and default prices for new jobs.</p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-5 text-sm font-medium text-[#2563eb] transition-colors duration-200 hover:text-blue-800"
            >
              Add your first service →
            </button>
          </div>
        ) : (
          sortedServices.map(service => (
            <div
              key={service.id}
              className="hp-card rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{service.name}</p>
                  <p className="text-sm font-medium text-slate-400 mt-1">Default price: ${service.default_price}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(service)}
                    className="hp-btn-secondary rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('')
                      setDeletingService(service)
                    }}
                    className="hp-btn-secondary rounded-xl border border-red-100 bg-white px-3 py-1.5 text-xs font-medium text-[#dc2626] shadow-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isFormOpen ? (
        <div className="hp-animate-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-[2px]">
          <div className="hp-animate-modal-panel w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">{formTitle}</h2>
              <button
                type="button"
                onClick={closeFormModal}
                className="text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-slate-600"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSaveService} className="space-y-5">
              <div>
                <label htmlFor="serviceName" className="text-sm font-medium text-slate-400">
                  Service name
                </label>
                <input
                  id="serviceName"
                  type="text"
                  value={nameInput}
                  onChange={event => setNameInput(event.target.value)}
                  required
                  className={field}
                  placeholder="Window cleaning"
                />
              </div>
              <div>
                <label htmlFor="defaultPrice" className="text-sm font-medium text-slate-400">
                  Default price
                </label>
                <input
                  id="defaultPrice"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={priceInput}
                  onChange={event => setPriceInput(event.target.value)}
                  required
                  className={field}
                  placeholder="150"
                />
              </div>
              {errorMessage ? <p className="text-sm font-medium text-[#dc2626]">{errorMessage}</p> : null}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeFormModal}
                  disabled={isSaving}
                  className="hp-btn-secondary text-sm font-medium px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="hp-btn-primary rounded-xl px-4 py-2 text-sm">
                  {isSaving ? 'Saving…' : saveLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deletingService ? (
        <div className="hp-animate-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-[2px]">
          <div className="hp-animate-modal-panel w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Delete service?</h2>
            <p className="mt-2 text-sm font-medium text-slate-400">
              Remove <span className="font-semibold text-slate-900">{deletingService.name}</span> from your catalog.
            </p>
            {errorMessage ? <p className="mt-3 text-sm font-medium text-[#dc2626]">{errorMessage}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !isSaving && setDeletingService(null)}
                disabled={isSaving}
                className="hp-btn-secondary text-sm font-medium px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button type="button" onClick={handleDeleteService} disabled={isSaving} className="hp-btn-danger rounded-xl px-4 py-2 text-sm">
                {isSaving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
