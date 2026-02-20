import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { User, AuthError } from '@supabase/supabase-js'

interface AuthResult {
  success: true
}

interface AuthErrorResult {
  success: false
  error: AuthError
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<AuthError | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const userEmail = computed(() => user.value?.email ?? '')

  async function initialize() {
    loading.value = true
    try {
      const { data: { session } } = await supabase.auth.getSession()
      user.value = session?.user ?? null

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        user.value = session?.user ?? null
      })
    } catch (err) {
      error.value = err as AuthError
    } finally {
      loading.value = false
    }
  }

  async function signUp(email: string, password: string): Promise<AuthResult | AuthErrorResult> {
    loading.value = true
    error.value = null
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })
      if (signUpError) throw signUpError
      user.value = data.user
      return { success: true }
    } catch (err) {
      const authError = err as AuthError
      error.value = authError
      return { success: false, error: authError }
    } finally {
      loading.value = false
    }
  }

  async function signIn(email: string, password: string): Promise<AuthResult | AuthErrorResult> {
    loading.value = true
    error.value = null
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError
      user.value = data.user
      return { success: true }
    } catch (err) {
      const authError = err as AuthError
      error.value = authError
      return { success: false, error: authError }
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    loading.value = true
    try {
      await supabase.auth.signOut()
      user.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    userEmail,
    initialize,
    signUp,
    signIn,
    signOut,
  }
})
