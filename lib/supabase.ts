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
  assigned_to?: string | null
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

export type Worker = {
  id: string
  company_id: string
  user_id: string
  name: string | null
  email: string | null
  role: string
  created_at?: string
}

export type Invite = {
  id: string
  company_id: string
  email: string
  token: string
  used: boolean
  created_at?: string
}

export type Service = {
  id: string
  company_id: string
  name: string
  default_price: number
  created_at?: string
}