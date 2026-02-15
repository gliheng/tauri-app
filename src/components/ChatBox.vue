<script setup lang="ts">
import { ref, computed, PropType, nextTick, onMounted, onBeforeUnmount, watch } from "vue";
import { file2DataUrl, type FileAttachment } from "@/utils/file";
import { useSettingsStore } from "@/stores/settings";
import FileImage from "./FileImage.vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import HardBreak from "@tiptap/extension-hard-break";

const props = defineProps({
  status: String,
  addons: {
    type: Array as PropType<string[]>,
    required: false,
  },
  extensions: {
    type: Array as PropType<any[]>,
    default: () => [],
  },
});

const input = defineModel<string>({ default: '' });

const emit = defineEmits<{
  submit: [data: {
    text: string;
    attachments?: FileAttachment[];
    body?: { model: string },
  }];
  stop: [];
}>();

const nonInteractive = computed(
  () => props.status == "submitted" || props.status == "streaming",
);

const editor = useEditor({
  extensions: [
    Document,
    Paragraph,
    Text,
    HardBreak,
    ...props.extensions,
  ],
  content: "",
  editorProps: {
    attributes: {
      class: "outline-none min-h-[4.5rem] max-h-[9rem] overflow-y-auto px-3 py-2",
    },
    handleKeyDown: (_view, event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        submitForm();
        return true;
      }
      return false;
    },
  },
  onUpdate: ({ editor }) => {
    input.value = editor.getText();
  },
});

onMounted(() => {
  if (editor.value) {
    editor.value.commands.setContent(input.value || "");
  }
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});

watch(input, (newValue) => {
  if (editor.value && newValue !== editor.value.getText()) {
    const currentPos = editor.value.state.selection.from;
    editor.value.commands.setContent(newValue || "", { emitUpdate: false });
    editor.value.commands.focus(currentPos);
  }
});

async function submitForm() {
  let fileParts: FileAttachment[] = [];
  if (files.value.length) {
    fileParts = await Promise.all(files.value.map(file2DataUrl));
  }
  files.value = [];
  emit('submit', {
    text: input.value,
    attachments: fileParts.length > 0 ? fileParts : undefined,
  });
}

const files = ref<File[]>([]);

function appendFiles(newFiles: FileList) {
  files.value = [...files.value, ...newFiles];
}

function insertText(text: string) {
  if (editor.value) {
    editor.value.commands.insertContent(text);
    editor.value.commands.focus();
  }
}

function setInput(value: string) {
  input.value = value;
  nextTick(() => {
    editor.value?.commands.focus();
  });
}

defineExpose({
  insertText,
  setInput,
  get editor() {
    return editor.value;
  },
});

</script>

<template>
  <div class="mx-auto flex flex-col relative">
    <form
      class="rounded-md focus-within:outline-none transition-colors bg-default ring ring-inset ring-accented focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary"
      @submit.prevent="submitForm"
    >
      <section v-if="files.length" class="flex flex-wrap gap-2 p-2">
        <div
          v-for="(file, i) in files"
          class="w-30 h-20 bg-elevated rounded relative flex items-center"
          :key="file.name"
          :data-type="file.type"
        >
          <div v-if="file.type.startsWith('image/')" class="flex items-center">
            <FileImage :file="file" class="absolute size-full object-cover" />
            <span
              class="absolute bottom-0 px-2 whitespace-nowrap text-ellipsis overflow-hidden w-full pointer-events-none"
              >{{ file.name }}</span
            >
          </div>
          <p v-else class="px-2 line-clamp">
            {{ file.name }}
          </p>
          <UButton
            class="absolute right-1 top-1 cursor-pointer rounded-full"
            size="sm"
            variant="subtle"
            icon="i-lucide-trash"
            @click="files.splice(i, 1)"
          />
        </div>
      </section>
      <EditorContent
        :editor="editor"
        class="w-full bg-transparent focus:outline-none"
      />
      <div
        class="w-full p-2 flex items-center gap-1 pointer-none"
        @mousedown.prevent
      >
        <UploadButton :disabled="nonInteractive" @select-file="appendFiles" />

        <slot name="left-addons" />

        <template v-for="addon of addons">
          <ModelSelector v-if="addon == 'model-select'" key="model-select" />
        </template>
        <div class="flex-1"></div>
        <UButton
          v-if="nonInteractive"
          class="rounded-full"
          icon="i-mdi-stop"
          @click="emit('stop')"
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

<style lang="scss">
.tiptap {
  :first-child {
    margin-top: 0;
  }
}
</style>

<style lang="scss" scoped>
.line-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 3;
}
</style>
