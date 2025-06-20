<script setup lang="ts">
import { ref } from "vue";
import { RouterView } from "vue-router";
import VueEasyLightbox from "vue-easy-lightbox";
import DefaultLayout from "./layouts/DefaultLayout.vue";
import Spinner from "./components/Spinner.vue";
import { eventBus } from "@/utils/eventBus";

const visibleRef = ref(false);
const indexRef = ref(0);
const imgsRef = ref<string[]>([]);
eventBus.on("lightbox", (src: string | string[]) => {
  imgsRef.value = Array.isArray(src) ? src : [src];
  visibleRef.value = true;
});

const onHide = () => (visibleRef.value = false);
</script>

<template>
  <UApp>
    <DefaultLayout>
      <RouterView v-slot="{ Component, route }">
        <KeepAlive>
          <Suspense>
            <component v-if="Component" :is="Component" :key="route.path" />
            <template #fallback>
              <div class="size-full flex items-center justify-center">
                <Spinner />
              </div>
            </template>
          </Suspense>
        </KeepAlive>
      </RouterView>
    </DefaultLayout>
  </UApp>
  <vue-easy-lightbox
    :visible="visibleRef"
    :imgs="imgsRef"
    :index="indexRef"
    @hide="onHide"
  ></vue-easy-lightbox>
</template>

<style lang="scss" scoped></style>
