<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSupabaseStore } from '@/stores/supabase'
import AuthModal from '../Auth/AuthModal.vue'

const authStore = useAuthStore()
const syncStore = useSupabaseStore()
const overlay = useOverlay()
const authModal = overlay.create(AuthModal)

function openAuthModal() {
  authModal.open()
}

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
  <div>
    <div v-if="!authStore.isAuthenticated" class="space-y-4 mt-4">
      <div class="text-center py-8">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <span class="text-2xl font-semibold text-gray-400">?</span>
        </div>
        <p class="text-sm text-gray-500 mb-4">Sign in to sync your settings</p>
        <UButton
          icon="i-lucide-circle-user"
          label="Sign In"
          size="lg"
          @click="openAuthModal"
        />
      </div>
    </div>

    <div v-else class="space-y-4 mt-4">
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
        @click="authStore.signOut()"
      >
        Sign Out
      </UButton>

      <p class="text-xs text-center text-gray-500">
        Your settings are synced to the cloud
      </p>
    </div>
  </div>
</template>
