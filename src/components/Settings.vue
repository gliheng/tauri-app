<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings";

const tabItems = [
  {
    label: "Models",
    icon: "i-mdi-form-select",
    slot: "models" as const,
  },
  {
    label: "MCP",
    icon: "i-mdi-server",
    slot: "mcp" as const,
  },
] satisfies TabsItem[];

const providerItems = [
  {
    label: "OpenRouter",
    value: "openrouter",
  },
  {
    label: "Deepseek",
    value: "deepseek",
  },
  {
    label: "Silliconflow",
    value: "silliconflow",
  },
] satisfies TabsItem[];

const { modelSettings } = storeToRefs(useSettingsStore());
</script>

<template>
  <UTabs :items="tabItems" class="gap-4 w-full">
    <template #models="{ item }">
      <div class="mx-4 mb-4 flex flex-col gap-2">
        <UTabs
          orientation="vertical"
          variant="link"
          class="w-full"
          default-value="openrouter"
          :items="providerItems"
        >
          <template #content="{ item }">
            <UForm :state="modelSettings" class="flex flex-col relative">
              <p class="text-center">{{ item.label }}</p>
              <USwitch
                class="absolute top-0 right-0"
                v-model="modelSettings[item.value].enabled"
              />
              <UFormField label="Api Key" name="apiKey">
                <UInput
                  v-model.trim="modelSettings[item.value].apiKey"
                  class="w-full"
                />
              </UFormField>
            </UForm>
          </template>
        </UTabs>
      </div>
    </template>
    <template #mcp="{ item }">
      <div class="mx-4 mb-4 flex flex-col gap-2">
        <p class="text-muted">
          {{ item.description }}
        </p>
      </div>
    </template>
  </UTabs>
</template>

<style lang="scss" scoped></style>
