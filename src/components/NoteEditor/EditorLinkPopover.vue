<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { onMounted, ref } from 'vue';

const props = defineProps<{
  editor: Editor;
  autoOpen?: boolean;
}>();

const open = defineModel<boolean>('open', { default: false });

const url = ref('');
const text = ref('');

function openLinkPopover() {
  const { view, state } = props.editor;
  const { from, to } = state.selection;

  if (from === to) {
    // No selection, get the link at cursor or current text
    const link = props.editor.getAttributes('link');
    if (link.href) {
      url.value = link.href;
      text.value = state.doc.textBetween(from, to);
    } else {
      url.value = '';
      text.value = '';
    }
  } else {
    // Has selection
    const link = props.editor.getAttributes('link');
    url.value = link.href || '';
    text.value = state.doc.textBetween(from, to);
  }

  open.value = true;
}

function setLink() {
  const { editor } = props;

  // empty
  if (url.value === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }

  // update link
  editor
    .chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href: url.value })
    .run();
}

function deleteLink() {
  const { editor } = props;
  editor.chain().focus().extendMarkRange('link').unsetLink().run();
  open.value = false;
}

// Watch for editor selection changes to auto-open
if (props.autoOpen) {
  watch(
    () => props.editor.state.selection,
    () => {
      const { from, to } = props.editor.state.selection;
      if (from !== to) {
        const link = props.editor.getAttributes('link');
        if (link.href) {
          openLinkPopover();
        }
      }
    },
  );
}

onMounted(() => {
  if (props.autoOpen) {
    openLinkPopover();
  }
});

defineExpose({
  openLinkPopover,
});
</script>

<template>
  <UPopover v-model:open="open" :modal="false">
    <template #default>
      <div class="link-popover p-2 min-w-64">
        <UFormField label="URL">
          <UInput v-model="url" placeholder="https://example.com" @keydown.enter="setLink()" />
        </UFormField>
        <div class="flex gap-2 mt-2">
          <UButton size="xs" variant="soft" @click="setLink()">
            Apply
          </UButton>
          <UButton size="xs" color="neutral" variant="ghost" @click="deleteLink()">
            Remove
          </UButton>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
.link-popover {
  background: var(--ui-bg-default);
  border: 1px solid var(--ui-border-muted);
  border-radius: 0.5rem;
}
</style>
