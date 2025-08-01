<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { throttle } from "lodash-es";
import { getNote, writeNote, updateNote } from "@/db";
import { MilkdownProvider } from "@milkdown/vue";
import MilkdownEditor from "@/components/MilkdownEditor.vue";

const route = useRoute();
const initialData = await getNote(route.params.id as string);
const model = ref(initialData?.content ?? "");

let created = !!initialData;

watch(model, throttle(async (value) => {
  if (!created) {
    await writeNote({
      id: route.params.id as string,
      name: "New Note",
      content: value,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    created = true;
  } else {
    await updateNote(
      route.params.id as string,
      {
        content: value,
        updatedAt: new Date(),
      },
    );
  }
}, 1000));
</script>

<template>
  <MilkdownProvider>
    <MilkdownEditor v-model="model" />
  </MilkdownProvider>
</template>
