import { getSessionMembership } from '@/lib/company-server'
import { NewCustomerForm } from './new-customer-form'

export default async function NewCustomerPage() {
  const membership = await getSessionMembership()
  return <NewCustomerForm isWorker={Boolean(membership?.isWorker)} />
}
