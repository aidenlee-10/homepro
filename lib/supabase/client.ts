'use client'

import { createBrowserClient } from '@supabase/ssr'
import { supabaseAnonKey, supabaseUrl } from '../supabase'

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
