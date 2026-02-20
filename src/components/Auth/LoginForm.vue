<script setup lang="ts">
import { reactive } from 'vue'
import { z } from 'zod'
import { useAuthStore } from '@/stores/auth'
import type { FormSubmitEvent } from '@nuxt/ui'

const emit = defineEmits<{
  success: []
}>()

const authStore = useAuthStore()

const schema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

type Schema = z.infer<typeof schema>

const state = reactive<Partial<Schema>>({
  email: '',
  password: '',
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const result = await authStore.signIn(event.data.email, event.data.password)
  if (result.success) {
    emit('success')
  }
}
</script>

<template>
  <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
    <UFormField label="Email" name="email">
      <UInput
        v-model="state.email"
        class="w-full"
        type="email"
        placeholder="you@example.com"
        size="lg"
        :disabled="authStore.loading"
      />
    </UFormField>
    <UFormField label="Password" name="password">
      <UInput
        v-model="state.password"
        class="w-full"
        type="password"
        placeholder="••••••••"
        size="lg"
        :disabled="authStore.loading"
      />
    </UFormField>
    <UButton
      icon="i-heroicons-arrow-left-on-rectangle"
      type="submit"
      :loading="authStore.loading"
      size="lg"
      block
    >
      Sign In
    </UButton>
  </UForm>
</template>
