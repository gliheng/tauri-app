<script setup lang="ts">
import { RouterView } from "vue-router";
import DefaultLayout from "./layouts/DefaultLayout.vue";
</script>

<template>
  <UApp>
    <DefaultLayout>
      <RouterView v-slot="{ Component, route }">
        <KeepAlive>
          <component :is="Component" :key="route.path" />
        </KeepAlive>
      </RouterView>
    </DefaultLayout>
  </UApp>
</template>

<style lang="scss" scoped></style>
