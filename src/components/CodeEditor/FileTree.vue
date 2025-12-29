<script setup lang="ts">
import { ref } from 'vue';

const items = ref([
  {
    label: 'app/',
    defaultExpanded: true,
    children: [
      {
        label: 'composables/',
        children: [
          {
            label: 'useAuth.ts',
            icon: 'i-vscode-icons:file-type-typescript'
          },
          {
            label: 'useUser.ts',
            icon: 'i-vscode-icons:file-type-typescript'
          }
        ]
      },
      {
        label: 'components/',
        defaultExpanded: true,
        children: [
          {
            label: 'Card.vue',
            icon: 'i-vscode-icons:file-type-vue'
          },
          {
            label: 'Button.vue',
            icon: 'i-vscode-icons:file-type-vue'
          }
        ]
      }
    ]
  },
  {
    label: 'app.vue',
    icon: 'i-vscode-icons:file-type-vue'
  },
  {
    label: 'nuxt.config.ts',
    icon: 'i-vscode-icons:file-type-nuxt'
  }
])
</script>

<template>
  <div class="h-full">
    <header class="flex gap-1 p-1">
      <h1 class="text-lg font-semibold truncate">My Project</h1>
      <div class="flex-1"></div>
      <UButton size="sm" icon="i-lucide-file-plus" />
      <UButton size="sm" icon="i-lucide-folder-plus" />
    </header>
    <UTree :items="items" />
  </div>
</template>
