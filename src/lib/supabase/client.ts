import { createClient } from '@supabase/supabase-js'
import { supabaseConfig } from './config'
import { createTauriStorage } from './storage'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null
let initPromise: Promise<SupabaseClient> | null = null

/**
 * Initialize Supabase client with Tauri secure storage
 */
export async function initSupabase(): Promise<SupabaseClient> {
  if (supabaseInstance) {
    return supabaseInstance
  }

  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    const storage = await createTauriStorage()

    const client = createClient(
      supabaseConfig.url,
      supabaseConfig.anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage,
        },
      }
    )

    supabaseInstance = client
    return client
  })()

  return initPromise
}

/**
 * Get Supabase client (must be initialized first)
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    throw new Error('Supabase client not initialized. Call initSupabase() first.')
  }
  return supabaseInstance
}

// Legacy export for backward compatibility (will be initialized)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!supabaseInstance) {
      throw new Error('Supabase client not initialized. Call initSupabase() first.')
    }
    return supabaseInstance[prop as keyof SupabaseClient]
  }
})

// Database row types
export interface UserSettingRow {
  id: string
  user_id: string
  type: string
  key: string
  value: string
  updated_at: string
  created_at: string
}
