import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Job = {
  id: string
  customer_name: string
  address: string
  date: string
  time: string
  service_type: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  price: number
  created_at: string
}