<script setup lang="ts">
import { ref, watch } from "vue";
import { eventBus } from "@/utils/eventBus";
import { file2DataUrl } from "@/utils/file";

const props = defineProps({
  file: File,
  url: String,
});

const fileUrl = ref();
watch(
  () => props.file,
  async (file) => {
    if (file) {
      const attachment = await file2DataUrl(file);
      fileUrl.value = attachment.url;
    }
  },
  { immediate: true }
);
</script>

<template>
  <img
    :src="url || fileUrl"
    @click="eventBus.emit('lightbox', url || fileUrl)"
  />
</template>
