import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { confirm } from "@tauri-apps/plugin-dialog";
import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { eventBus } from "@/utils/eventBus";

const APP_UPDATE_PROGRESS_EVENT = "app_update_progress";

export type AppUpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "installing"
  | "upToDate"
  | "error";

export interface AppUpdateMetadata {
  version: string;
  currentVersion: string;
  notes: string | null;
  pubDate: string | null;
}

export interface AppUpdateProgressPayload {
  event: "started" | "progress" | "finished" | "installed";
  contentLength?: number | null;
  chunkLength?: number | null;
  downloaded?: number | null;
}

interface CheckForUpdatesOptions {
  promptIfAvailable?: boolean;
  showNoUpdateToast?: boolean;
  showErrorToast?: boolean;
}

function formatUpdatePrompt(update: AppUpdateMetadata): string {
  const lines = [
    `Version ${update.version} is available for install.`,
  ];

  if (update.notes?.trim()) {
    lines.push("");
    lines.push(update.notes.trim());
  }

  lines.push("");
  lines.push("Install the update now?");
  return lines.join("\n");
}

export const useAppUpdateStore = defineStore("appUpdate", () => {
  const currentVersion = ref<string>("");
  const status = ref<AppUpdateStatus>("idle");
  const availableUpdate = ref<AppUpdateMetadata | null>(null);
  const lastCheckedAt = ref<Date | null>(null);
  const error = ref<string | null>(null);
  const contentLength = ref<number | null>(null);
  const downloaded = ref<number>(0);
  const initialized = ref<boolean>(false);
  let unlistenProgress: UnlistenFn | null = null;

  const isSupported = computed<boolean>(() => !import.meta.env.DEV);
  const isBusy = computed<boolean>(() =>
    ["checking", "downloading", "installing"].includes(status.value),
  );
  const progressPercent = computed<number | null>(() => {
    if (!contentLength.value || contentLength.value <= 0) {
      return null;
    }

    return Math.min(
      100,
      Math.round((downloaded.value / contentLength.value) * 100),
    );
  });

  async function initialize(): Promise<void> {
    if (initialized.value) {
      return;
    }

    try {
      currentVersion.value = await getVersion();
    } catch (err) {
      console.error("[Updater] Failed to read app version:", err);
    }

    if (!isSupported.value) {
      initialized.value = true;
      return;
    }

    unlistenProgress = await listen<AppUpdateProgressPayload>(
      APP_UPDATE_PROGRESS_EVENT,
      ({ payload }) => {
        switch (payload.event) {
          case "started":
            status.value = "downloading";
            contentLength.value = payload.contentLength ?? null;
            downloaded.value = payload.downloaded ?? 0;
            error.value = null;
            break;
          case "progress":
            status.value = "downloading";
            contentLength.value = payload.contentLength ?? contentLength.value;
            downloaded.value = payload.downloaded ?? downloaded.value;
            error.value = null;
            break;
          case "finished":
            status.value = "installing";
            break;
          case "installed":
            status.value = "installing";
            eventBus.emit("toast", {
              title: "Installing update",
              description: "Raven will restart after the update finishes.",
              icon: "i-lucide-download",
              color: "primary",
            });
            break;
        }
      },
    );

    initialized.value = true;
    await checkForUpdates({
      promptIfAvailable: true,
      showErrorToast: false,
    });
  }

  async function dispose(): Promise<void> {
    if (unlistenProgress) {
      unlistenProgress();
      unlistenProgress = null;
    }
  }

  async function checkForUpdates(
    options: CheckForUpdatesOptions = {},
  ): Promise<AppUpdateMetadata | null> {
    if (!isSupported.value) {
      return null;
    }

    status.value = "checking";
    error.value = null;
    contentLength.value = null;
    downloaded.value = 0;

    try {
      const update = await invoke<AppUpdateMetadata | null>("check_app_update");
      lastCheckedAt.value = new Date();
      availableUpdate.value = update;

      if (!update) {
        status.value = "upToDate";
        if (options.showNoUpdateToast) {
          eventBus.emit("toast", {
            title: "Raven is up to date",
            description: currentVersion.value
              ? `You are running version ${currentVersion.value}.`
              : "No update is currently available.",
            icon: "i-lucide-badge-check",
            color: "success",
          });
        }
        return null;
      }

      status.value = "available";

      if (options.promptIfAvailable) {
        const shouldInstall = await confirm(formatUpdatePrompt(update), {
          title: "Update available",
          okLabel: "Install",
          cancelLabel: "Later",
        });

        if (shouldInstall) {
          await installUpdate();
        }
      }

      return update;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to check for updates";
      status.value = "error";
      error.value = message;

      if (options.showErrorToast ?? true) {
        eventBus.emit("toast", {
          title: "Update check failed",
          description: message,
          icon: "i-lucide-alert-circle",
          color: "error",
        });
      }

      return null;
    }
  }

  async function installUpdate(): Promise<void> {
    if (!availableUpdate.value || isBusy.value) {
      return;
    }

    status.value = "downloading";
    error.value = null;
    contentLength.value = null;
    downloaded.value = 0;

    try {
      await invoke("install_app_update");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to install update";
      status.value = "error";
      error.value = message;
      eventBus.emit("toast", {
        title: "Update install failed",
        description: message,
        icon: "i-lucide-alert-circle",
        color: "error",
      });
    }
  }

  async function manualCheckForUpdates(): Promise<void> {
    await checkForUpdates({
      promptIfAvailable: false,
      showNoUpdateToast: true,
      showErrorToast: true,
    });
  }

  return {
    availableUpdate,
    contentLength,
    currentVersion,
    downloaded,
    error,
    initialize,
    initialized,
    installUpdate,
    isBusy,
    isSupported,
    lastCheckedAt,
    manualCheckForUpdates,
    progressPercent,
    status,
    dispose,
  };
});
