<script setup lang="ts">
import { useTemplateRef, onMounted, onUnmounted } from "vue";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { schema as baseSchema } from 'prosemirror-schema-basic'
import { addListNodes } from "prosemirror-schema-list";
import { exampleSetup } from "prosemirror-example-setup";

const rootRef = useTemplateRef("root");

const schema = new Schema({
  nodes: addListNodes(baseSchema.spec.nodes, 'paragraph block*', 'block'),
  marks: baseSchema.spec.marks,
});

let view: EditorView;
let state: EditorState;
onMounted(() => {
  state = EditorState.create({
    schema,
    plugins: [
      ...exampleSetup({
        schema,
      }),
    ]
  });
  view = new EditorView(rootRef.value, {
    state,
  });
});

onUnmounted(() => {
  view.destroy();
});
</script>

<template>
  <div class="h-full" ref="root"></div>
</template>

<style src="prosemirror-example-setup/style/style.css" />
<style src="prosemirror-menu/style/menu.css" />
