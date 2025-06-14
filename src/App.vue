<script setup lang="ts">
import { RouterView } from "vue-router";
import DefaultLayout from "./layouts/DefaultLayout.vue";
import Spinner from "./components/Spinner.vue";
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
</template>

<style lang="scss" scoped></style>
