<script setup lang="ts">
import { ref, computed } from "vue";
import { useChat } from "@/hooks/useChat";
import { modelList } from "@/llm/models";
import { Attachment, experimental_createMCPClient } from "ai";

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

async function send(evt: KeyboardEvent) {
  if (evt.key == "Enter" && evt.shiftKey) return;
  evt.preventDefault();
  let attachments: Attachment[] = [];
  if (files.value.length) {
    attachments = await Promise.all(files.value.map(file2DataUrl)),
  }
  handleSubmit(evt, {
    data: {
      model: model.value.value,
    },
    experimental_attachments: attachments,
  });
}

function file2DataUrl(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      contentType: file.type,
      url: reader.result as string,
    });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const files = ref<File[]>([]);
function appendFiles(newFiles: FileList) {
  files.value = [...files.value, ...newFiles];
}
</script>

<template>
  <div class="mx-auto flex flex-col">
    <form
      class="rounded-md focus-within:outline-none transition-colors bg-default ring ring-inset ring-accented focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary"
      @submit="send"
    >
      <section v-if="files.length" class="flex flex-wrap gap-2 p-2">
        <div v-for="(file, i) in files"
          :key="file.name"
          class="w-30 h-20 bg-elevated rounded relative px-2 flex items-center"
        >
          <UButton
            class="absolute right-1 top-1 cursor-pointer rounded-full"
            size="sm"
            variant="subtle"
            icon="i-lucide-trash"
            @click="files.splice(i, 1)"
          />
          <p class="line-clamp">{{ file.name }}</p>
        </div>
      </section>
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
        <UploadButton @select-file="appendFiles" />
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

<style lang="scss" scoped>
.line-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}
</style>
