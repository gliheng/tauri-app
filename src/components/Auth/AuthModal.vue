<script setup lang="ts">
import { ref, computed } from 'vue'
import LoginForm from './LoginForm.vue'
import RegisterForm from './RegisterForm.vue'
import { useAuthStore } from '@/stores/auth'
import { useSupabaseStore } from '@/stores/supabase'

const emit = defineEmits<{
  close: []
}>()

const mode = ref<'login' | 'register'>('login')
const authStore = useAuthStore()
const syncStore = useSupabaseStore()

const syncStatusColor = computed(() => {
  if (syncStore.syncError) return 'bg-red-500'
  if (syncStore.isSyncing) return 'bg-blue-500'
  if (!syncStore.isOnline) return 'bg-yellow-500'
  return 'bg-green-500'
})

const syncStatusText = computed(() => {
  if (syncStore.syncError) return 'Sync error'
  if (syncStore.isSyncing) return 'Syncing...'
  if (!syncStore.isOnline) return 'Offline'
  return 'Synced'
})
</script>

<template>
  <UModal :ui="{ content: 'w-[400px] max-w-[400px]' }">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold">
              {{ authStore.isAuthenticated ? 'Account' : (mode === 'login' ? 'Sign In' : 'Create Account') }}
            </h2>
            <UButton
              icon="i-heroicons-x-mark-20-solid"
              color="gray"
              variant="ghost"
              @click="emit('close')"
            />
          </div>
        </template>

        <!-- Not authenticated: show login/register forms -->
        <div v-if="!authStore.isAuthenticated" class="space-y-4">
          <LoginForm v-if="mode === 'login'" @success="emit('close')" />
          <RegisterForm v-else @success="emit('close')" />

          <div class="text-center text-sm text-gray-500">
            <span v-if="mode === 'login'">
              Don't have an account?
              <button
                @click="mode = 'register'"
                class="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign up
              </button>
            </span>
            <span v-else>
              Already have an account?
              <button
                @click="mode = 'login'"
                class="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign in
              </button>
            </span>
          </div>
        </div>

        <!-- Authenticated: show account info -->
        <div v-else class="space-y-4">
          <div class="text-center py-4">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
              <span class="text-2xl font-semibold text-primary-600">
                {{ authStore.userEmail?.[0].toUpperCase() }}
              </span>
            </div>
            <p class="text-lg font-medium">{{ authStore.userEmail }}</p>
            <p class="text-sm text-gray-500 mt-1">Signed in with Supabase</p>
          </div>

          <USeparator />

          <div class="flex items-center justify-between py-2">
            <span class="text-sm">Sync Status</span>
            <div class="flex items-center gap-2">
              <div :class="['w-2 h-2 rounded-full', syncStatusColor]" />
              <span class="text-sm">{{ syncStatusText }}</span>
            </div>
          </div>

          <USeparator />

          <UButton
            icon="i-heroicons-arrow-right-on-rectangle"
            color="red"
            variant="soft"
            block
            :loading="authStore.loading"
            @click="authStore.signOut(); emit('close')"
          >
            Sign Out
          </UButton>

          <p class="text-xs text-center text-gray-500">
            Your settings are synced to the cloud
          </p>
        </div>
      </UCard>
    </template>
  </UModal>
</template>
