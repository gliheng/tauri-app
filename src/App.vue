<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { RouterView } from "vue-router";
import VueEasyLightbox from "vue-easy-lightbox";
import { eventBus } from "@/utils/eventBus";
import { useAppUpdateStore } from "@/stores/appUpdate";

const toast = useToast();
const appUpdateStore = useAppUpdateStore();

const visibleRef = ref(false);
const indexRef = ref(0);
const imgsRef = ref<string[]>([]);
eventBus.on("lightbox", (src: string | string[]) => {
  imgsRef.value = Array.isArray(src) ? src : [src];
  visibleRef.value = true;
});

eventBus.on("toast", (data) => {
  toast.add(data);
});

const onHide = () => (visibleRef.value = false);

onMounted(async () => {
  await appUpdateStore.initialize();
});

onUnmounted(async () => {
  await appUpdateStore.dispose();
});
</script>

<template>
  <UApp>
    <RouterView />
  </UApp>
  <vue-easy-lightbox
    :visible="visibleRef"
    :imgs="imgsRef"
    :index="indexRef"
    @hide="onHide"
  ></vue-easy-lightbox>
</template>

<style lang="scss" scoped></style>
