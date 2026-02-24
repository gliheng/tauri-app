<script setup lang="ts">
import { ref, computed } from "vue";

const open = ref(false);
const iconModel = defineModel('icon', { type: String });

const iconList = [
  "i-lucide-user",
  "i-lucide-heart",
  "i-lucide-star",
  "i-lucide-leaf",
  "i-lucide-rocket",
  "i-lucide-life-buoy",
  "i-lucide-sailboat",
  "i-lucide-snowflake",
  "i-lucide-school",
  "i-lucide-palette",
  "i-lucide-bolt",
  "i-lucide-flame",
  "i-lucide-flame-kindling",
  "i-lucide-sun",
  "i-lucide-sun-dim",
  "i-lucide-moon",
  "i-lucide-moon-star",
  "i-lucide-gem",
  "i-lucide-crown",
  "i-lucide-medal",
  "i-lucide-award",
  "i-lucide-trophy",
  "i-lucide-cake",
  "i-lucide-cake-slice",
  "i-lucide-pizza",
  "i-lucide-coffee",
  "i-lucide-beer",
  "i-lucide-wine",
  "i-lucide-gift",
  "i-lucide-party-popper",
  "i-lucide-cherry",
  "i-lucide-apple",
  "i-lucide-banana",
  "i-lucide-carrot",
  "i-lucide-beef",
  "i-lucide-paw-print",
  "i-lucide-cat",
  "i-lucide-dog",
  "i-lucide-bird",
  "i-lucide-fish",
  "i-lucide-bug",
  "i-lucide-ghost",
  "i-lucide-zap",
  "i-lucide-sparkle",
  "i-lucide-sparkles",
  "i-lucide-wand",
  "i-lucide-wand-sparkles",
  "i-lucide-hat-glasses",
  "i-lucide-baby",
  "i-lucide-music",
  "i-lucide-piano",
  "i-lucide-guitar",
  "i-lucide-mic",
  "i-lucide-speaker",
  "i-lucide-radio",
  "i-lucide-headphones",
  "i-lucide-gamepad",
  "i-lucide-joystick",
  "i-lucide-dice-1",
  "i-lucide-dice-2",
  "i-lucide-dice-3",
  "i-lucide-dice-4",
  "i-lucide-dice-5",
  "i-lucide-dice-6",
  "i-lucide-dices",
  "i-lucide-puzzle",
  "i-lucide-bot",
  "i-lucide-cpu",
  "i-lucide-hard-drive",
  "i-lucide-microchip",
  "i-lucide-code",
  "i-lucide-terminal",
  "i-lucide-database",
  "i-lucide-server",
  "i-lucide-cloud",
  "i-lucide-cloud-sun",
  "i-lucide-cloud-rain",
  "i-lucide-cloud-lightning",
  "i-lucide-plane",
  "i-lucide-ship",
  "i-lucide-car",
  "i-lucide-bike",
  "i-lucide-train-front",
  "i-lucide-bus",
  "i-lucide-house",
  "i-lucide-building",
  "i-lucide-building-2",
  "i-lucide-lollipop",
  "i-lucide-castle",
  "i-lucide-tent",
  "i-lucide-trees",
  "i-lucide-tree-pine",
  "i-lucide-tree-palm",
  "i-lucide-flower",
  "i-lucide-flower-2",
  "i-lucide-rose",
  "i-lucide-clover",
  "i-lucide-mountain",
  "i-lucide-mountain-snow",
  "i-lucide-waves",
  "i-lucide-cloud-rain",
  "i-lucide-cloud-snow",
  "i-lucide-rainbow",
  "i-lucide-diamond",
  "i-lucide-diamond-plus",
  "i-lucide-square",
  "i-lucide-circle",
  "i-lucide-hexagon",
  "i-lucide-octagon",
  "i-lucide-triangle",
  "i-lucide-box",
  "i-lucide-package",
  "i-lucide-shopping-cart",
  "i-lucide-shopping-basket",
  "i-lucide-shopping-bag",
  "i-lucide-tag",
  "i-lucide-wallet",
  "i-lucide-coins",
  "i-lucide-banknote",
  "i-lucide-piggy-bank",
];

const pageSize = 20;
const currentPage = ref(0);

const totalPages = computed(() => Math.ceil(iconList.length / pageSize));

const paginatedIcons = computed(() => {
  const start = currentPage.value * pageSize;
  return iconList.slice(start, start + pageSize);
});

function selectIcon(event: MouseEvent) {
  const button = (event.target as HTMLElement).closest('button');
  const icon = button?.dataset.icon;
  if (icon) {
    iconModel.value = icon;
    open.value = false;
  }
}

function prevPage() {
  if (currentPage.value > 0) {
    currentPage.value--;
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value - 1) {
    currentPage.value++;
  }
}
</script>

<template>
  <UPopover v-model:open="open">
    <UButton :icon="iconModel" variant="outline" />
    <template #content>
      <div class="p-4 min-w-64">
        <div
          class="grid grid-cols-4 gap-2 mb-3"
          @click="selectIcon"
        >
          <UButton
            v-for="icon in paginatedIcons"
            :key="icon"
            :icon="icon"
            variant="outline"
            :data-icon="icon"
            size="sm"
            class="justify-self-center"
          />
        </div>
        <div class="flex items-center justify-between gap-2">
          <UButton
            icon="i-lucide-chevron-left"
            variant="ghost"
            size="xs"
            :disabled="currentPage === 0"
            @click="prevPage"
          />
          <span class="text-xs text-gray-500">
            {{ currentPage + 1 }} / {{ totalPages }}
          </span>
          <UButton
            icon="i-lucide-chevron-right"
            variant="ghost"
            size="xs"
            :disabled="currentPage === totalPages - 1"
            @click="nextPage"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>