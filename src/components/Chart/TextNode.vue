<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';
import { NodeResizer } from '@vue-flow/node-resizer';
import { useTemplateRef, watch } from 'vue';

defineOptions({
  inheritAttrs: false
});

const props = defineProps<{
  id: string;
  data: { label: string; content: string };
  selected: boolean;
}>();

const editorRef = useTemplateRef('editor');

const handleMouseDownCapture = (event: MouseEvent) => {
  if (props.selected) {
    event.stopPropagation();
  }
};

const handleClickCapture = (event: MouseEvent) => {
  if (props.selected) {
    event.stopPropagation();
  }
};

function onClick() {
  editorRef.value?.editor?.view.focus();
}
</script>

<template>
  <NodeResizer v-if="selected" :min-width="120" :min-height="32" />
  <Handle id="top" :position="Position.Top" />
  <Handle id="bottom" :position="Position.Bottom" />
  <Handle id="left" :position="Position.Left" />
  <Handle id="right" :position="Position.Right" />
  <div
    class="min-w-20 min-h-8 overflow-auto px-4 py-2 size-full overflow-auto"
    >
    <div
      @click.stop="onClick"
      @mousedown.stop
      @keydown.stop
      @keypress.stop
      @keyup.stop
    >
      <UEditor
        ref="editor"
        v-model="data.content"
        content-type="markdown"
        placeholder="Type here..."
      />
    </div>
  </div>
</template>

<style>
@import '@vue-flow/node-resizer/dist/style.css'
</style>
