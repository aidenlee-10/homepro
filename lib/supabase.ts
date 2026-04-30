export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export type Job = {
  id: string
  company_id: string
  customer_id?: string | null
  customer_name: string
  address: string
  date: string
  time: string
  service_type: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  price: number
  created_at: string
}

export type Customer = {
  id: string
  company_id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  created_at: string
}