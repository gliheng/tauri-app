<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/stores/settings";

const { webSearchSettings } = storeToRefs(useSettingsStore());
</script>

<template>
  <UForm :state="webSearchSettings" class="flex flex-col gap-4">
    <UFormField label="API Key" name="apiKey">
      <UInput
        v-model.trim="webSearchSettings.apiKey"
        placeholder="tvly-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        class="w-full"
      />
    </UFormField>
    <p class="text-sm text-muted">
      Enter your Tavily API key to enable web search in chat.
      Get your API key from <a href="https://tavily.com" target="_blank" class="text-primary underline">tavily.com</a>
    </p>
  </UForm>
</template>
