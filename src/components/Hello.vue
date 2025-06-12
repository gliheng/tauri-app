<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ref, onMounted } from "vue";
import { invoke } from "@tauri-apps/api/core";
greetMsg.value = await invoke("greet", { name: name.value });

</script>

<template>
  <main class="container">
    <form class="row" @submit.prevent="greet">
      <input id="greet-input" v-model="name" placeholder="Enter a name..." />
      <button type="submit">Greet</button>
    </form>
    <p>{{ greetMsg }}</p>
  </main>
</template>

<style scoped>

</style>
