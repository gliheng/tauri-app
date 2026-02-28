<script setup lang="ts">
import { ref, useTemplateRef, onMounted, onUnmounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useTabsStore } from "@/stores/tabs";
import { eventBus } from "@/utils/eventBus";

const router = useRouter();
const route = useRoute();
const store = useTabsStore();
const { closeTab, reorderTab, createNewChat, setNotification } = store;
const { tabs } = storeToRefs(store);
const tabContainerRef = useTemplateRef("tabContainer");

const dragging = ref(false);
const dragData = ref();
const offset = ref(0);
const currentIndex = ref(-1);
const showScrollButtons = ref(false);

let startX = 0;
let posList: number[]; // TOOD: update this when reordering tabs

function calcPosList() {
  const containerRect = tabContainerRef.value!.getBoundingClientRect();
  posList = Array.from(
    tabContainerRef.value!.querySelectorAll("[data-idx]") ?? [],
  ).map((e) => {
    const rect = e.getBoundingClientRect();
    return rect.left + rect.width / 2 - containerRect.left;
  });
}

const mutationObserver = new MutationObserver(
  (mutationList: MutationRecord[]) => {
    for (const mutation of mutationList) {
      if (mutation.type === "childList") {
        calcPosList();
        calcScroll();
        // Scroll to new tab
        if (mutation.addedNodes.length) {
          const newTab = mutation.addedNodes[0];
          if (newTab instanceof HTMLElement) {
            const scroller = newTab.parentElement!;
            const maxScroll = scroller.scrollWidth - scroller.clientWidth;
            scroller.scrollTo({ left: maxScroll, behavior: "smooth" });
          }
        }
      }
    }
  },
);

const resizeObserver = new ResizeObserver(() => {
  calcScroll();
});

function calcScroll() {
  const container = tabContainerRef.value!;
  canScrollLeft.value = container.scrollLeft > 0.5;
  canScrollRight.value =
    container.scrollLeft < container.scrollWidth - container.clientWidth - 0.5;
  showScrollButtons.value = canScrollLeft.value || canScrollRight.value;
}

onMounted(() => {
  mutationObserver.observe(tabContainerRef.value!, {
    attributes: false,
    childList: true,
    subtree: false,
  });
  resizeObserver.observe(tabContainerRef.value!);
  calcPosList();
  calcScroll();
});

eventBus.on("tab_notify", ({ path }) => {
  if (route.path !== path) {
    setNotification(path, true);
  }
});

onUnmounted(() => {
  mutationObserver.disconnect();
  resizeObserver.disconnect();
});

watch(() => route.path, (newPath) => {
  setNotification(newPath, false);
});

function startDrag(evt: PointerEvent) {
  if (evt.button != 0) return;

  evt.preventDefault();

  const el = evt.currentTarget as HTMLElement;
  const id = el.dataset.id;
  if (!id) return;
  router.push({ path: id });
  currentIndex.value = parseInt(el.dataset.idx!);
  dragData.value = tabs.value.find((e) => e.path === id);
  startX = evt.clientX - el.offsetLeft + tabContainerRef.value!.scrollLeft;
  document.body.addEventListener("pointermove", move);
  document.body.addEventListener("pointerup", stopDrag);
}

function move(evt: PointerEvent) {
  if (!dragging.value) {
    // Prevent accidental moves
    if (Math.abs(evt.movementX) < 2) return;
    dragging.value = true;
  }

  let left = evt.clientX - startX;
  offset.value = left;
  let i = bisect(posList, left);
  i = Math.max(0, Math.min(i, tabs.value.length - 1));
  if (currentIndex.value != i) {
    reorderTab(currentIndex.value, i);
    currentIndex.value = i;
  }
}

function stopDrag() {
  dragging.value = false;
  dragData.value = undefined;
  offset.value = 0;
  currentIndex.value = -1;
  document.body.removeEventListener("pointermove", move);
  document.body.removeEventListener("pointerup", stopDrag);
}

function onWheel(evt: WheelEvent) {
  evt.preventDefault();
  const container = tabContainerRef.value!;
  container.scrollLeft += evt.deltaX;
}

function onScroll() {
  calcScroll();
}

const canScrollLeft = ref(false);
const canScrollRight = ref(false);

function onScrollLeft() {
  const container = tabContainerRef.value!;
  container.scrollBy({
    left: -300,
    behavior: "smooth",
  });
}

function onScrollRight() {
  const container = tabContainerRef.value!;
  container.scrollBy({
    left: 300,
    behavior: "smooth",
  });
}

function bisect(nums: number[], n: number) {
  let lo = 0,
    hi = nums.length;
  while (lo < hi) {
    let m = Math.floor((lo + hi) / 2);
    if (nums[m] >= n) {
      hi = m;
    } else {
      lo = m + 1;
    }
  }
  return lo;
}
</script>

<template>
  <div class="flex items-center gap-2 flex-col w-full relative">
    <div
      class="relative flex p-1 items-center w-full gap-1 whitespace-nowrap"
      data-tauri-drag-region
    >
      <div
        class="flex flex-row gap-1 min-w-0 overflow-hidden"
        ref="tabContainer"
        @wheel="onWheel"
        @scroll="onScroll"
      >
        <UButton
          class="sticky min-h-full top-0 left-0 px-0 rounded-none shadow -mr-1 disabled:text-zinc-300 dark:disabled:text-slate-600"
          icon="i-lucide-chevron-left"
          color="neutral"
          variant="soft"
          size="sm"
          :hidden="!showScrollButtons"
          :disabled="!canScrollLeft"
          @click="onScrollLeft"
        />  
        <UButton
          v-for="(tab, i) in tabs"
          :key="tab.path"
          class="max-w-40"
          variant="soft"
          color="neutral"
          active-color="primary"
          active-variant="solid"
          :style="{
            visibility: dragging && i == currentIndex ? 'hidden' : 'visible',
          }"
          :active="$route.path === tab.path"
          :to="{ path: tab.path }"
          :data-id="tab.path"
          :data-idx="i"
          @pointerdown="startDrag"
          >
          <UBadge
            v-if="tab.showNotification"
            class="rounded-full"
            icon="i-lucide-bell"
            color="warning"
            variant="solid"
            size="sm"
          />
          <span class="block overflow-hidden text-ellipsis">{{
            tab.title
          }}</span>
          <UButton
            slot="trailing"
            class="-mr-1 -my-1"
            icon="i-mdi-close"
            size="xs"
            color="neutral"
            variant="ghost"
            @pointerdown.stop.prevent
            @click.stop.prevent="closeTab(tab.path)"
          />
        </UButton>
        <UButton
          class="sticky min-h-full top-0 right-0 px-0 rounded-none bg-elevated shadow -ml-1 disabled:text-zinc-300 dark:disabled:text-slate-600"
          icon="i-lucide-chevron-right"
          color="neutral"
          variant="ghost"
          size="sm"
          :hidden="!showScrollButtons"
          :disabled="!canScrollRight"
          @click="onScrollRight"
        />
      </div>
      <UButton
        v-if="dragging && dragData"
        key="__dragging_item"
        class="max-w-40 pointer-events-none absolute"
        variant="soft"
        color="neutral"
        active-color="primary"
        active-variant="solid"
        :style="{ left: `${offset}px` }"
        :active="true"
        ><span class="block overflow-hidden text-ellipsis">{{
          dragData.title
        }}</span>
        <UButton
          slot="trailing"
          class="-mr-1 -my-1"
          icon="i-mdi-close"
          size="xs"
          color="neutral"
          variant="ghost"
        />
      </UButton>
      <UButton
        icon="i-mdi-plus"
        size="sm"
        color="neutral"
        variant="subtle"
        @click="createNewChat"
      />
      <div class="flex-1 min-h-full" />
      <slot name="extra"></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
