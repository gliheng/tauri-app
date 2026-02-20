import { Store } from '@tauri-apps/plugin-store'

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
