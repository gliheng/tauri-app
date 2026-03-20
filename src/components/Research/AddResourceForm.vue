<script setup lang="ts">
import { ref } from "vue";
import type { ResearchResourceKind } from "@/db";

defineProps({
  isSubmitting: {
    type: Boolean,
    default: false,
  },
});

const resourceMode = ref<ResearchResourceKind>("text");
const textTitle = ref("");
const textContent = ref("");
const urlTitle = ref("");
const urlValue = ref("");

const emit = defineEmits<{
  submit: [data: { kind: ResearchResourceKind; title: string; content?: string; source?: string }];
}>();

const toast = useToast();

function inferUrlTitle(input: string): string {
  try {
    const url = new URL(input);
    const trimmedPath = url.pathname.replace(/\/$/, "").split("/").filter(Boolean).pop();
    if (trimmedPath) {
      return decodeURIComponent(trimmedPath);
    }
    return url.hostname;
  } catch {
    return "Web Resource";
  }
}

function handleSubmit(): void {
  const kind = resourceMode.value;

  if (kind === "text") {
    if (!textContent.value.trim()) {
      toast.add({
        title: "Text is required",
        description: "Add the resource text before saving it.",
        icon: "i-lucide-circle-alert",
        color: "warning",
      });
      return;
    }
    emit("submit", {
      kind: "text",
      title: textTitle.value.trim() || "Text Resource",
      content: textContent.value.trim(),
    });
    textTitle.value = "";
    textContent.value = "";
  } else {
    const normalizedUrl = urlValue.value.trim();
    if (!normalizedUrl) {
      toast.add({
        title: "URL is required",
        description: "Add a source URL before saving it.",
        icon: "i-lucide-circle-alert",
        color: "warning",
      });
      return;
    }
    emit("submit", {
      kind: "url",
      title: urlTitle.value.trim() || inferUrlTitle(normalizedUrl),
      source: normalizedUrl,
    });
    urlTitle.value = "";
    urlValue.value = "";
  }
}
</script>

<template>
  <UCard class="resource-form">
    <template #header>
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-semibold text-base">Add Resource</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Support for file uploads comes later. Start with text or a URL.
            </p>
          </div>
          <UTabs
            v-model="resourceMode"
            :items="[
              { label: 'Text', icon: 'i-lucide-file-text', value: 'text' },
              { label: 'URL', icon: 'i-lucide-link', value: 'url' },
            ]"
            variant="link"
            class="shrink-0"
          />
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <template v-if="resourceMode === 'text'">
        <div class="flex flex-col gap-3">
          <UInput
            v-model="textTitle"
            placeholder="Optional title"
            class="w-full"
          />
          <UTextarea
            v-model="textContent"
            :rows="6"
            placeholder="Paste the text you want inserted into the research database"
            class="w-full"
          />
        </div>
      </template>

      <template v-else>
        <div class="flex flex-col gap-3">
          <UInput
            v-model="urlTitle"
            placeholder="Optional title"
            class="w-full"
          />
          <UInput
            v-model="urlValue"
            placeholder="https://example.com/article"
            class="w-full"
          />
        </div>
      </template>

      <div class="flex justify-end pt-2">
        <UButton
          icon="i-lucide-plus"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          Add And Ingest
        </UButton>
      </div>
    </div>
  </UCard>
</template>
