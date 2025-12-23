import { createClient } from '@supabase/supabase-js'

import { getEnv } from '../env'

export function createSupabaseBrowserClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    getEnv('SUPABASE_URL')

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    getEnv('SUPABASE_ANON_KEY')

  return createClient(supabaseUrl, supabaseAnonKey)
}
