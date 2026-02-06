<script setup lang="ts">
import { computed, watch, reactive } from "vue";
import { nanoid } from "nanoid";
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { McpServer } from "@/types/mcp";

export interface McpServerFormData {
  id: string;
  config: McpServer['config'];
  enabled: boolean;
}

interface Props {
  server?: McpServer;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [server: McpServerFormData | null];
}>();

const toast = useToast();
const isEditing = computed(() => !!props.server);

// Zod schemas for validation
const mcpServerBaseSchema = z.object({
  name: z.string().min(1, 'Server name is required'),
  description: z.string().optional(),
  type: z.enum(['stdio', 'http', 'sse']),
  enabled: z.boolean().default(true)
})

const mcpServerStdioSchema = mcpServerBaseSchema.extend({
  type: z.literal('stdio'),
  command: z.string().min(1, 'Command is required'),
  args: z.array(z.string()).default([]),
  env: z.array(z.object({
    name: z.string().min(1, 'Name is required'),
    value: z.string()
  })).default([])
})

const mcpServerHttpSchema = mcpServerBaseSchema.extend({
  type: z.literal('http'),
  url: z.string().url('Invalid URL format'),
  headers: z.array(z.object({
    name: z.string().min(1, 'Name is required'),
    value: z.string()
  })).default([])
})

const mcpServerSseSchema = mcpServerBaseSchema.extend({
  type: z.literal('sse'),
  url: z.string().url('Invalid URL format'),
  headers: z.array(z.object({
    name: z.string().min(1, 'Name is required'),
    value: z.string()
  })).default([])
})

const mcpServerSchema = z.discriminatedUnion('type', [
  mcpServerStdioSchema,
  mcpServerHttpSchema,
  mcpServerSseSchema
])

type Schema = z.output<typeof mcpServerSchema>

// Form state type that includes all possible fields across all server types
type FormState = {
  type: 'stdio' | 'http' | 'sse'
  name: string
  description?: string
  enabled: boolean
  command: string
  args: string[]
  env: Array<{ name: string; value: string }>
  url: string
  headers: Array<{ name: string; value: string }>
}

// Form state
const state = reactive<FormState>({
  type: props.server?.config.type || 'stdio',
  name: props.server?.config.name || '',
  description: (props.server?.config as any)?.description || '',
  enabled: props.server?.enabled ?? true,
  command: props.server?.config.type === 'stdio' ? props.server.config.command : '',
  args: props.server?.config.type === 'stdio' ? props.server.config.args : [],
  env: props.server?.config.type === 'stdio' ? props.server.config.env : [],
  url: (props.server?.config.type === 'http' || props.server?.config.type === 'sse')
    ? props.server.config.url
    : '',
  headers: (props.server?.config.type === 'http' || props.server?.config.type === 'sse')
    ? (props.server.config.headers || [])
    : []
})

// Handle server type switching
watch(() => state.type, (newType, oldType) => {
  if (oldType && newType !== oldType) {
    // Clear type-specific fields when switching types
    if (newType === 'stdio') {
      state.url = ''
      state.headers = []
    } else {
      state.command = ''
      state.args = []
      state.env = []
    }
  }
})

// Array manipulation functions
const addArg = () => state.args.push('')
const removeArg = (index: number) => state.args.splice(index, 1)

const addEnvVar = () => state.env.push({ name: '', value: '' })
const removeEnvVar = (index: number) => state.env.splice(index, 1)

const addHeader = () => state.headers.push({ name: '', value: '' })
const removeHeader = (index: number) => state.headers.splice(index, 1)

const buildConfig = (): McpServer['config'] => {
  const name = state.name.trim() || 'Untitled'
  const description = state.description?.trim()

  switch (state.type) {
    case 'stdio':
      return {
        type: 'stdio',
        name,
        description,
        command: state.command,
        args: state.args.filter(a => a.trim()),
        env: state.env.filter(e => e.name.trim()),
      }
    case 'http':
      return {
        type: 'http',
        name,
        description,
        url: state.url,
        headers: state.headers.filter(h => h.name.trim()),
      }
    case 'sse':
      return {
        type: 'sse',
        name,
        description,
        url: state.url,
        headers: state.headers.filter(h => h.name.trim()),
      }
  }
}

async function saveServer(event: FormSubmitEvent<Schema>) {
  const data = event.data
  const id = isEditing.value ? props.server!.id : nanoid()

  try {
    const config = buildConfig()

    emit('close', {
      id,
      config,
      enabled: data.enabled,
    })

    toast.add({
      title: isEditing.value ? 'Server Updated' : 'Server Added',
      description: `${data.name} has been ${isEditing.value ? 'updated' : 'added'} successfully.`,
      color: 'success'
    })
  } catch (error) {
    toast.add({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed to save server',
      color: 'error'
    })
  }
}

const cancel = () => {
  emit('close', null)
}
</script>

<template>
  <UModal>
    <template #content>
      <UForm :state="state" :schema="mcpServerSchema" @submit="saveServer" class="size-full p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        <h2 class="text-xl font-semibold">{{ isEditing ? 'Edit' : 'Add' }} MCP Server</h2>

        <!-- Server Type -->
        <UFormField label="Server Type" name="type">
          <USelect
            class="w-full"
            v-model="state.type"
            :items="[
              { label: 'STDIO', value: 'stdio' },
              { label: 'HTTP', value: 'http' },
              { label: 'SSE', value: 'sse' }
            ]"
            option-attribute="value"
            :disabled="isEditing"
          />
        </UFormField>

        <!-- Server Name -->
        <UFormField label="Server Name" name="name" required>
          <UInput v-model="state.name" class="w-full" placeholder="Display name" />
        </UFormField>

        <!-- Description -->
        <UFormField label="Description" name="description">
          <UInput v-model="state.description" class="w-full" placeholder="Optional description" />
        </UFormField>

        <!-- Enabled -->
        <UFormField name="enabled">
          <USwitch v-model="state.enabled" label="Enabled" />
        </UFormField>

        <!-- STDIO Configuration -->
        <template v-if="state.type === 'stdio'">
          <UFormField label="Command" name="command" required>
            <UInput v-model="state.command" class="w-full" placeholder="npx" />
          </UFormField>

          <UFormField label="Arguments" name="args">
            <div class="space-y-2">
              <div
                v-for="(_arg, index) in state.args"
                :key="index"
                class="flex gap-2"
              >
                <UInput v-model="state.args[index]" placeholder="argument" class="flex-1" />
                <UButton
                  icon="i-lucide-x"
                  color="error"
                  variant="ghost"
                  @click="removeArg(index)"
                />
              </div>
              <UButton
                icon="i-lucide-plus"
                label="Add Argument"
                variant="outline"
                size="sm"
                @click="addArg()"
              />
            </div>
          </UFormField>

          <UFormField label="Environment Variables" name="env">
            <div class="space-y-2">
              <div
                v-for="(env, index) in state.env"
                :key="index"
                class="flex gap-2"
              >
                <UInput v-model="env.name" placeholder="NAME" class="flex-1" />
                <UInput v-model="env.value" placeholder="value" class="flex-1" />
                <UButton
                  icon="i-lucide-x"
                  color="error"
                  variant="ghost"
                  @click="removeEnvVar(index)"
                />
              </div>
              <UButton
                icon="i-lucide-plus"
                label="Add Environment Variable"
                variant="outline"
                size="sm"
                @click="addEnvVar()"
              />
            </div>
          </UFormField>
        </template>

        <!-- HTTP/SSE Configuration -->
        <template v-if="state.type === 'http' || state.type === 'sse'">
          <UFormField label="URL" name="url" required>
            <UInput v-model="state.url" class="w-full" placeholder="https://api.example.com/mcp" />
          </UFormField>

          <UFormField label="Headers" name="headers">
            <div class="space-y-2">
              <div
                v-for="(header, index) in state.headers"
                :key="index"
                class="flex gap-2"
              >
                <UInput v-model="header.name" placeholder="Header-Name" class="flex-1" />
                <UInput v-model="header.value" placeholder="value" class="flex-1" />
                <UButton
                  icon="i-lucide-x"
                  color="error"
                  variant="ghost"
                  @click="removeHeader(index)"
                />
              </div>
              <UButton
                icon="i-lucide-plus"
                label="Add Header"
                variant="outline"
                size="sm"
                @click="addHeader()"
              />
            </div>
          </UFormField>
        </template>

        <!-- Actions -->
        <div class="flex justify-end gap-2 mt-6">
          <UButton label="Cancel" variant="outline" @click="cancel" />
          <UButton label="Save" color="primary" type="submit" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
