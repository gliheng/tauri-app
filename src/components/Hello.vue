<script setup lang="ts">
import { ref } from "vue";
import { invoke } from "@tauri-apps/api/core";

const name = ref("");
const greetMsg = ref("");

async function greet() {
  greetMsg.value = await invoke("greet", { name: name.value });
}
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

<style scoped></style>
