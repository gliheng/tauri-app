<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useAppUpdateStore } from "@/stores/appUpdate";

const appUpdateStore = useAppUpdateStore();
const {
  availableUpdate,
  currentVersion,
  downloaded,
  error,
  isBusy,
  isSupported,
  lastCheckedAt,
  progressPercent,
  status,
} = storeToRefs(appUpdateStore);

const statusColor = computed(() => {
  switch (status.value) {
    case "available":
      return "warning";
    case "downloading":
    case "installing":
      return "primary";
    case "upToDate":
      return "success";
    case "error":
      return "error";
    default:
      return "neutral";
  }
});

const statusLabel = computed(() => {
  switch (status.value) {
    case "checking":
      return "Checking";
    case "available":
      return "Update available";
    case "downloading":
      return "Downloading";
    case "installing":
      return "Installing";
    case "upToDate":
      return "Up to date";
    case "error":
      return "Error";
    default:
      return "Idle";
  }
});

const downloadSummary = computed(() => {
  if (!downloaded.value) {
    return "";
  }

  return `${(downloaded.value / 1024 / 1024).toFixed(1)} MB downloaded`;
});

const lastCheckedLabel = computed(() => {
  if (!lastCheckedAt.value) {
    return "Never";
  }

  return lastCheckedAt.value.toLocaleString();
});

async function checkForUpdates(): Promise<void> {
  await appUpdateStore.manualCheckForUpdates();
}

async function installUpdate(): Promise<void> {
  await appUpdateStore.installUpdate();
}
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-1">
          <p class="text-sm text-gray-500">
            Raven checks for signed releases on startup and can install them in-app.
          </p>
        </div>
        <UBadge :color="statusColor" variant="subtle">
          {{ statusLabel }}
        </UBadge>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
          <p class="text-xs uppercase tracking-wide text-gray-500">Current version</p>
          <p class="mt-1 font-mono text-sm">{{ currentVersion || "Unknown" }}</p>
        </div>
        <div class="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
          <p class="text-xs uppercase tracking-wide text-gray-500">Last checked</p>
          <p class="mt-1 text-sm">{{ lastCheckedLabel }}</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <UButton
          icon="i-lucide-refresh-cw"
          :loading="status === 'checking'"
          :disabled="!isSupported || isBusy"
          @click="checkForUpdates"
        >
          Check for updates
        </UButton>
        <UButton
          v-if="availableUpdate"
          color="primary"
          icon="i-lucide-download"
          :loading="status === 'downloading' || status === 'installing'"
          :disabled="isBusy"
          @click="installUpdate"
        >
          Install v{{ availableUpdate.version }}
        </UButton>
      </div>

      <UAlert
        v-if="!isSupported"
        color="warning"
        variant="subtle"
        title="Updater disabled in development"
        description="Build the desktop app to test the updater against signed releases."
      />

      <UAlert
        v-else-if="error"
        color="error"
        variant="subtle"
        title="Update error"
        :description="error"
      />

      <div v-if="status === 'downloading' || status === 'installing'" class="space-y-2">
        <div class="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          <div
            class="h-full rounded-full bg-primary transition-all"
            :style="{ width: `${progressPercent ?? 15}%` }"
          />
        </div>
        <p class="text-sm text-gray-500">
          <span v-if="status === 'downloading'">
            Downloading update{{ progressPercent !== null ? ` (${progressPercent}%)` : "" }}.
          </span>
          <span v-else>
            Installing update.
          </span>
          <span v-if="downloadSummary"> {{ downloadSummary }}</span>
        </p>
      </div>
    </div>

    <div v-if="availableUpdate" class="space-y-3">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="text-base font-semibold">Available version</h3>
          <p class="text-sm text-gray-500">
            {{ availableUpdate.version }}
            <span v-if="availableUpdate.pubDate">
              • {{ new Date(availableUpdate.pubDate).toLocaleString() }}
            </span>
          </p>
        </div>
        <UBadge color="warning" variant="subtle">New</UBadge>
      </div>

      <p v-if="availableUpdate.notes" class="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">
        {{ availableUpdate.notes }}
      </p>
      <p v-else class="text-sm text-gray-500">
        No release notes were published for this update.
      </p>
    </div>
  </div>
</template>
