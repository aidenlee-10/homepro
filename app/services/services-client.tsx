'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Service } from '@/lib/supabase'

const supabase = createClient()

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
  const saveLabel = editingService ? 'Save Changes' : 'Add Service'

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Services</h1>
            <p className="text-sm text-slate-400">Manage your company&apos;s service catalog</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/"
              className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Back
            </Link>
            <button
              type="button"
              onClick={openAddModal}
              className="text-xs font-medium px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Add Service
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-3">
        {sortedServices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
            <p className="text-4xl mb-2">🧰</p>
            <p className="font-medium">No services yet</p>
            <button
              type="button"
              onClick={openAddModal}
              className="mt-3 text-sm text-blue-600 font-medium hover:text-blue-700"
            >
              Add your first service →
            </button>
          </div>
        ) : (
          sortedServices.map(service => (
            <div key={service.id} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{service.name}</p>
                  <p className="text-sm text-slate-500 mt-1">Default price: ${service.default_price}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(service)}
                    className="text-xs text-slate-600 font-medium hover:text-slate-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('')
                      setDeletingService(service)
                    }}
                    className="text-xs text-red-600 font-medium hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">{formTitle}</h2>
              <button type="button" onClick={closeFormModal} className="text-sm text-slate-500 hover:text-slate-700">
                Close
              </button>
            </div>
            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label htmlFor="serviceName" className="text-sm font-medium text-slate-700">
                  Service name
                </label>
                <input
                  id="serviceName"
                  type="text"
                  value={nameInput}
                  onChange={event => setNameInput(event.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Window Cleaning"
                />
              </div>
              <div>
                <label htmlFor="defaultPrice" className="text-sm font-medium text-slate-700">
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
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="150"
                />
              </div>
              {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeFormModal}
                  disabled={isSaving}
                  className="text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="text-sm font-medium px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  {isSaving ? 'Saving…' : saveLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deletingService ? (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-100 p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Delete service?</h2>
            <p className="text-sm text-slate-600 mt-2">
              Remove <span className="font-medium text-slate-900">{deletingService.name}</span> from your service list.
            </p>
            {errorMessage ? <p className="text-sm text-red-600 mt-3">{errorMessage}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !isSaving && setDeletingService(null)}
                disabled={isSaving}
                className="text-sm font-medium px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteService}
                disabled={isSaving}
                className="text-sm font-medium px-4 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                {isSaving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
