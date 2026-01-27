<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import Spinner from '@/components/Spinner.vue';

interface PackageInstallEvent {
  package: string;
  status: 'installing' | 'success' | 'already_installed' | 'update_available' | 'upgrading' | 'upgrade_success' | 'error';
  message: string;
  current_version?: string;
  latest_version?: string;
  version?: string;
}

const props = defineProps<{
  agent: string;
}>();

const installStatus = ref<PackageInstallEvent | null>(null);
const isUpgrading = ref(false);
const hasCheckedForUpdates = ref(false);
let unlisten: (() => void) | null = null;

// Watch for changes to installStatus and check for updates when package is installed, already installed, or upgraded
watch(installStatus, async (status) => {
  if (
    status &&
    status.current_version &&
    (status.status === 'already_installed' || status.status === 'success' || status.status === 'upgrade_success') &&
    !hasCheckedForUpdates.value
  ) {
    hasCheckedForUpdates.value = true;
    try {
      await invoke('check_for_updates', {
        agentName: props.agent,
        packageName: status.package,
      });
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }
});

onMounted(async () => {
  // Listen to the specific agent's event
  const eventName = `package_install_status::${props.agent}`;
  unlisten = await listen<PackageInstallEvent>(eventName, (event) => {
    console.log('Package install status:', event.payload);
    installStatus.value = event.payload;

    // Set upgrading state and reset update check flag
    if (event.payload.status === 'upgrading') {
      isUpgrading.value = true;
    } else if (event.payload.status === 'upgrade_success') {
      isUpgrading.value = false;
      hasCheckedForUpdates.value = false;
    } else if (event.payload.status === 'error') {
      isUpgrading.value = false;
    }
  });
});

onUnmounted(() => {
  if (unlisten) {
    unlisten();
  }
});

async function upgrade() {
  if (!installStatus.value || isUpgrading.value) return;

  isUpgrading.value = true;
  hasCheckedForUpdates.value = false;
  try {
    await invoke('upgrade_package', {
      agentName: props.agent,
      packageName: installStatus.value.package,
    });
  } catch (error) {
    console.error('Failed to upgrade package:', error);
    installStatus.value = {
      package: installStatus.value.package,
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to upgrade package',
      current_version: installStatus.value.current_version,
    };
    isUpgrading.value = false;
  }
}
</script>

<template>
  <div v-if="installStatus && (installStatus.status !== 'already_installed' || installStatus.current_version)" class="flex items-center gap-2 text-xs">
    <!-- Loading state -->
    <template v-if="installStatus.status === 'installing' || installStatus.status === 'upgrading'">
      <Spinner size="sm" />
      <span class="text-gray-600 dark:text-gray-300">
        {{ installStatus.status === 'installing' ? 'Installing...' : 'Upgrading...' }}
      </span>
    </template>

    <!-- Error state -->
    <template v-else-if="installStatus.status === 'error'">
      <span class="text-red-600 dark:text-red-400">
        {{ installStatus.message }}
      </span>
    </template>

    <!-- Version display -->
    <template v-else-if="installStatus.current_version">
      <span class="text-gray-500 dark:text-gray-400">{{ agent }}:</span>
      <span class="font-mono text-gray-700 dark:text-gray-300">
        v{{ installStatus.current_version }}
      </span>

      <!-- Upgrade button -->
      <UButton
        v-if="installStatus.status === 'update_available' && installStatus.latest_version"
        size="xs"
        color="primary"
        variant="soft"
        :loading="isUpgrading"
        :disabled="isUpgrading"
        @click="upgrade"
      >
        Upgrade (v{{ installStatus.latest_version }})
      </UButton>
    </template>
  </div>
</template>
