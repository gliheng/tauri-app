<script setup lang="ts">
import { CHAT_ACTIONS } from "@/constants";
import { ref, inject, PropType } from "vue";
import type { UIMessage } from "ai";

const props = defineProps({
  message: {
    type: Object as PropType<UIMessage>,
    required: true,
  },
});

const emit = defineEmits(["cancel-edit"]);

const text = ref(
  props.message.parts
    ?.filter((p: any) => p.type === "text")
    .map((p: any) => p.text)
    .join('\n') ?? ''
);
const { chat, sendMessage } = inject(CHAT_ACTIONS)!;

function saveEdit() {
  const msgList = chat.messages;
  const index = msgList.findIndex((msg) => msg.id === props.message.id);
  if (index !== -1) {
    const oldMessage = msgList[index];

    // Extract FileParts from the original message
    const files = oldMessage.parts?.filter(
      (part): part is {
        type: "file";
        url: string;
        mediaType: string;
        filename?: string;
      } => part.type === "file"
    );

    const newMessage = {
      text: text.value,
      files,
    };
    chat.messages = msgList.slice(0, index);
    sendMessage(newMessage);
  }
  emit("cancel-edit");
}
</script>

<template>
  <section class="w-full max-w-full flex flex-col self-end items-end gap-2">
    <UTextarea class="w-full" v-model="text" autofocus />
    <div class="flex gap-2 justify-end">
      <UButton color="neutral" variant="subtle" @click="emit('cancel-edit')">Cancel</UButton>
      <UButton @click="saveEdit">Save</UButton>
    </div>
  </section>
</template>
