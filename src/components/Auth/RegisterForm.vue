<script setup lang="ts">
import { reactive } from 'vue'
import { z } from 'zod'
import { useAuthStore } from '@/stores/auth'
import type { FormSubmitEvent, FormError } from '@nuxt/ui'

const emit = defineEmits<{
  success: []
}>()

const authStore = useAuthStore()

const schema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

type Schema = z.infer<typeof schema>

const state = reactive<Partial<Schema>>({
  email: '',
  password: '',
  confirmPassword: '',
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const result = await authStore.signUp(event.data.email, event.data.password)
  if (result.success) {
    emit('success')
  } else {
    const errors: FormError[] = []
    errors.push({
      name: 'email',
      message: result.error?.message ?? 'Registration failed'
    })
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
    <UFormField label="Confirm Password" name="confirmPassword">
      <UInput
        v-model="state.confirmPassword"
        class="w-full"
        type="password"
        placeholder="••••••••"
        size="lg"
        :disabled="authStore.loading"
      />
    </UFormField>
    <UButton
      icon="i-heroicons-user-plus"
      type="submit"
      :loading="authStore.loading"
      size="lg"
      color="primary"
      block
    >
      Create Account
    </UButton>
  </UForm>
</template>
