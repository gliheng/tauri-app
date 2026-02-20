import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Store } from '@tauri-apps/plugin-store'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/constants";

const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
}

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

/**
 * Custom storage adapter for Supabase using Tauri's secure Store.
 * This persists auth tokens in the system's secure storage instead of localStorage.
 */
export async function createTauriStorage() {
  const store = await Store.load('supabase_auth')

  return {
    getItem: async (key: string): Promise<string | null> => {
      const value = await store.get<string>(key)
      // Convert undefined to null for Supabase compatibility
      return value ?? null
    },
    setItem: async (key: string, value: string): Promise<void> => {
      await store.set(key, value)
    },
    removeItem: async (key: string): Promise<void> => {
      await store.delete(key)
    },
  }
}
