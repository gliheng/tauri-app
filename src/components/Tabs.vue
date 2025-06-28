<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { nanoid } from "nanoid";
import { storeToRefs } from "pinia";
import { useTabsStore } from "@/stores/tabs";
import { useRouter } from "vue-router";

const router = useRouter();
const store = useTabsStore();
const { closeTab, openTab, reorderTab } = store;
const { tabs } = storeToRefs(store);
const tabContainerRef = useTemplateRef("tabContainer");

const dragging = ref(false);
const dragData = ref();
const offset = ref(0);
const currentIndex = ref(-1);

let startX = 0;
let posList: number[];

function startDrag(evt: PointerEvent) {
  if (evt.button != 0) return;

  evt.preventDefault();

  const el = evt.currentTarget as HTMLElement;
  const id = el.dataset.id;
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
    if (Math.abs(evt.movementX) < 1) return;
    dragging.value = true;
    const containerRect = tabContainerRef.value!.getBoundingClientRect();
    posList = Array.from(tabContainerRef.value!.children ?? []).map((e) => {
      const rect = e.getBoundingClientRect();
      return rect.left + rect.width / 2 - containerRect.left;
    });
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
      <div class="flex flex-row gap-1" ref="tabContainer">
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
          ><span class="block overflow-hidden text-ellipsis">{{
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
        @click="
          () => {
            const id = nanoid();
            openTab(`/chat/${id}`, 'New chat');
            $router.push({ name: 'chat', params: { id } });
          }
        "
      />
      <div class="flex-1 min-h-full" />
      <slot name="extra"></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
