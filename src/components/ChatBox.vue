<script setup lang="ts">
import { ref, computed } from "vue";
import { useChat } from "@/hooks/useChat";
import { modelList } from "@/llm/models";

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const model = ref(modelList[0]);
const { input, status, stop, handleSubmit } = useChat({
  id: props.id,
});

const streaming = computed(
  () => status.value == "submitted" || status.value == "streaming",
);

function send(evt: KeyboardEvent) {
  if (evt.key == "Enter" && evt.shiftKey) return;
  evt.preventDefault();
  handleSubmit(evt, {
    data: {
      model: model.value.value,
    },
  });
}
</script>

<template>
  <div class="mx-auto flex flex-col">
    <form
      class="rounded-md focus-within:outline-none transition-colors bg-default ring ring-inset ring-accented focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary"
      @submit="send"
    >
      <UTextarea
        class="w-full"
        v-model.trim="input"
        placeholder="Start a new chat"
        :rows="3"
        :maxrows="6"
        autoresize
        autofocus
        :ui="{
          base: 'bg-transparent! ring-transparent focus-visible:ring-transparent',
        }"
        @keydown.enter="send"
      />
      <div
        class="w-full p-2 flex items-center gap-1 pointer-none"
        @mousedown.prevent
      >
        <UploadButton />
        <ModelSelector v-model="model" />
        <div class="flex-1"></div>
        <UButton
          v-if="streaming"
          class="rounded-full"
          icon="i-mdi-stop"
          @click="stop"
        />
        <UButton
          v-else
          class="rounded-full"
          :disabled="!input"
          icon="i-mdi-send"
          type="submit"
        />
      </div>
    </form>
  </div>
</template>

<style lang="scss" scoped></style>
