<script setup lang="ts">
import { CHAT_ACTIONS } from "@/constants";
import { ref, inject } from "vue";

const emit = defineEmits(["cancel-edit"]);
const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
});

const text = ref(props.content);
const { messages, setMessages, append } = inject(CHAT_ACTIONS);

function saveEdit() {
  const msgList = messages.value;
  const index = msgList.findIndex((msg) => msg.id === props.id);
  if (index !== -1) {
    const oldMessage = msgList[index];
    const newMessage = {
      ...oldMessage,
      parts: undefined,
      id: undefined,
      content: text.value,
    };
    setMessages(msgList.slice(0, index));
    append(newMessage);
  }
  emit("cancel-edit");
}
</script>

<template>
  <section class="w-full max-w-full flex flex-col self-end items-end gap-2">
    <UTextarea class="w-full" v-model="text" />
    <div class="flex gap-2 justify-end">
      <UButton color="neutral" variant="subtle" @click="emit('cancel-edit')"
        >Cancel</UButton
      >
      <UButton @click="saveEdit">Save</UButton>
    </div>
  </section>
</template>
