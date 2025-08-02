<script setup lang="ts">
import { ref } from "vue";

const open = ref(false);
const iconModel = defineModel('icon', { type: String });

const iconList = [
  "i-lucide-user",
  "i-lucide-pyramid",
  "i-lucide-snail",
  "i-lucide-heart",
  "i-lucide-star",
  "i-lucide-cannabis",
  "i-lucide-leaf",
  "i-lucide-circle-dollar-sign",
  "i-lucide-rocket",
  "i-lucide-traffic-cone",
  "i-lucide-life-buoy",
  "i-lucide-target",
  "i-lucide-sailboat",
  "i-lucide-snowflake",
  "i-lucide-school",
  "i-lucide-palette",
];

function selectIcon(event: MouseEvent) {
  const button = (event.target as HTMLElement).closest('button');
  const icon = button?.dataset.icon;
  if (icon) {
    iconModel.value = icon;
    open.value = false;
  }
}
</script>

<template>
  <UPopover v-model:open="open">
    <UButton :icon="iconModel" variant="outline" />
    <template #content>
      <div
        class="size-48 p-4 flex flex-wrap justify-center items-center gap-2"
        @click="selectIcon"
      >
        <UButton
          v-for="icon in iconList"
          :icon="icon"
          variant="outline"
          :data-icon="icon"
        />
      </div>
    </template>
  </UPopover>
</template>