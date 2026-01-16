<script setup lang="ts">
import type { EditorToolbarItem, EditorEmojiMenuItem, DropdownMenuItem } from '@nuxt/ui';
import type { JSONContent } from '@tiptap/vue-3';
import { computed, ref } from 'vue';
import { upperFirst } from 'scule';
import { mapEditorItems } from '@nuxt/ui/utils/editor';
import { Emoji, gitHubEmojis } from '@tiptap/extension-emoji';
import { TextAlign } from '@tiptap/extension-text-align';
import { CodeBlockShiki } from 'tiptap-extension-code-block-shiki';
import { ImageUpload, FileImageExtension } from './EditorImageUploadExtension';
import { useEditorCompletion } from './EditorUseCompletion';
import EditorLinkPopover from './EditorLinkPopover.vue';
import { readFile } from '@/db-sqlite';
import { downloadFile } from '@/utils/file';

const toast = useToast();

const model = defineModel<string>({
  required: true,
});

const editorRef = ref<any>(null);

const { extension: completionExtension, handlers: aiHandlers, isLoading: aiLoading } = useEditorCompletion(editorRef as any);

const customHandlers: any = {
  imageUpload: {
    canExecute: (editor: any) => editor.can().insertContent({ type: 'imageUpload' }),
    execute: (editor: any) => editor.chain().focus().insertContent({ type: 'imageUpload' }),
    isActive: (editor: any) => editor.isActive('imageUpload'),
    isDisabled: undefined,
  },
  ...aiHandlers,
};

const bubbleToolbarItems = computed(() => [
  [
    {
      icon: 'i-lucide-sparkles',
      label: 'Improve',
      activeColor: 'neutral',
      activeVariant: 'ghost',
      loading: aiLoading.value,
      content: {
        align: 'start',
      },
      items: [
        {
          kind: 'aiFix',
          icon: 'i-lucide-spell-check',
          label: 'Fix spelling & grammar',
        },
        {
          kind: 'aiExtend',
          icon: 'i-lucide-unfold-vertical',
          label: 'Extend text',
        },
        {
          kind: 'aiReduce',
          icon: 'i-lucide-fold-vertical',
          label: 'Reduce text',
        },
        {
          kind: 'aiSimplify',
          icon: 'i-lucide-lightbulb',
          label: 'Simplify text',
        },
        {
          kind: 'aiContinue',
          icon: 'i-lucide-text',
          label: 'Continue sentence',
        },
        {
          kind: 'aiSummarize',
          icon: 'i-lucide-list',
          label: 'Summarize',
        },
        {
          icon: 'i-lucide-languages',
          label: 'Translate',
          children: [
            {
              kind: 'aiTranslate',
              language: 'English',
              label: 'English',
            },
            {
              kind: 'aiTranslate',
              language: 'French',
              label: 'French',
            },
            {
              kind: 'aiTranslate',
              language: 'Spanish',
              label: 'Spanish',
            },
            {
              kind: 'aiTranslate',
              language: 'German',
              label: 'German',
            },
            {
              kind: 'aiTranslate',
              language: 'Chinese',
              label: 'Chinese',
            },
          ],
        },
      ],
    },
  ],
  [
    {
      label: 'Turn into',
      trailingIcon: 'i-lucide-chevron-down',
      activeColor: 'neutral',
      activeVariant: 'ghost',
      tooltip: { text: 'Turn into' },
      content: {
        align: 'start',
      },
      ui: {
        label: 'text-xs',
      },
      items: [
        {
          type: 'label',
          label: 'Turn into',
        },
        {
          kind: 'paragraph',
          label: 'Paragraph',
          icon: 'i-lucide-type',
        },
        {
          kind: 'heading',
          level: 1,
          icon: 'i-lucide-heading-1',
          label: 'Heading 1',
        },
        {
          kind: 'heading',
          level: 2,
          icon: 'i-lucide-heading-2',
          label: 'Heading 2',
        },
        {
          kind: 'heading',
          level: 3,
          icon: 'i-lucide-heading-3',
          label: 'Heading 3',
        },
        {
          kind: 'heading',
          level: 4,
          icon: 'i-lucide-heading-4',
          label: 'Heading 4',
        },
        {
          kind: 'bulletList',
          icon: 'i-lucide-list',
          label: 'Bullet List',
        },
        {
          kind: 'orderedList',
          icon: 'i-lucide-list-ordered',
          label: 'Ordered List',
        },
        {
          kind: 'blockquote',
          icon: 'i-lucide-text-quote',
          label: 'Blockquote',
        },
        {
          kind: 'codeBlock',
          icon: 'i-lucide-square-code',
          label: 'Code Block',
        },
      ],
    },
  ],
  [
    {
      kind: 'mark',
      mark: 'bold',
      icon: 'i-lucide-bold',
      tooltip: { text: 'Bold' },
    },
    {
      kind: 'mark',
      mark: 'italic',
      icon: 'i-lucide-italic',
      tooltip: { text: 'Italic' },
    },
    {
      kind: 'mark',
      mark: 'underline',
      icon: 'i-lucide-underline',
      tooltip: { text: 'Underline' },
    },
    {
      kind: 'mark',
      mark: 'strike',
      icon: 'i-lucide-strikethrough',
      tooltip: { text: 'Strikethrough' },
    },
    {
      kind: 'mark',
      mark: 'code',
      icon: 'i-lucide-code',
      tooltip: { text: 'Code' },
    },
  ],
  [
    {
      slot: 'link' as const,
      icon: 'i-lucide-link',
    },
    {
      kind: 'imageUpload',
      icon: 'i-lucide-image',
      tooltip: { text: 'Image' },
    },
  ],
  [
    {
      icon: 'i-lucide-align-justify',
      tooltip: { text: 'Text Align' },
      content: {
        align: 'end',
      },
      items: [
        {
          kind: 'textAlign',
          align: 'left',
          icon: 'i-lucide-align-left',
          label: 'Align Left',
        },
        {
          kind: 'textAlign',
          align: 'center',
          icon: 'i-lucide-align-center',
          label: 'Align Center',
        },
        {
          kind: 'textAlign',
          align: 'right',
          icon: 'i-lucide-align-right',
          label: 'Align Right',
        },
        {
          kind: 'textAlign',
          align: 'justify',
          icon: 'i-lucide-align-justify',
          label: 'Align Justify',
        },
      ],
    },
  ],
] satisfies EditorToolbarItem<any>[][]);

const imageToolbarItems = (editor: any): EditorToolbarItem[][] => {
  return [
    [
      {
        icon: 'i-lucide-download',
        tooltip: { text: 'Download' },
        onClick: async () => {
          const { state } = editor;
          const { selection } = state;
          const pos = selection.from;
          const node = state.doc.nodeAt(pos);

          if (node && node.type.name === 'image') {
            const src = node.attrs.src;
            if (src?.startsWith('file://')) {
              const id = Number(src.slice('file://'.length));
              try {
                const result = await readFile(id);
                if (result?.file) {
                  downloadFile(result.file);
                  toast.add({
                    title: 'Image downloaded',
                    description: `${result.file.name} has been downloaded`,
                    icon: 'i-lucide-download',
                    color: 'success'
                  });
                }
              } catch (err) {
                toast.add({
                  title: 'Failed to download image',
                  description: err instanceof Error ? err.message : 'An error occurred while downloading the image',
                  icon: 'i-lucide-alert-circle',
                  color: 'error'
                });
              }
            }
          }
        },
      },
      {
        icon: 'i-lucide-refresh-cw',
        tooltip: { text: 'Replace' },
        onClick: () => {
          const { state } = editor;
          const { selection } = state;

          const pos = selection.from;
          const node = state.doc.nodeAt(pos);

          if (node && node.type.name === 'image') {
            editor
              .chain()
              .focus()
              .deleteRange({ from: pos, to: pos + node.nodeSize })
              .insertContentAt(pos, { type: 'imageUpload' })
              .run();
          }
        },
      },
    ],
    [
      {
        icon: 'i-lucide-trash',
        tooltip: { text: 'Delete' },
        onClick: () => {
          const { state } = editor;
          const { selection } = state;

          const pos = selection.from;
          const node = state.doc.nodeAt(pos);

          if (node && node.type.name === 'image') {
            editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
          }
        },
      },
    ],
  ];
};

const selectedNode = ref<{ node: JSONContent; pos: number }>();

const handleItems = (editor: any): DropdownMenuItem[][] => {
  if (!selectedNode.value?.node?.type) {
    return [];
  }

  return mapEditorItems(
    editor,
    [
      [
        {
          type: 'label',
          label: upperFirst(selectedNode.value.node.type),
        },
        {
          label: 'Turn into',
          icon: 'i-lucide-repeat-2',
          children: [
            { kind: 'paragraph', label: 'Paragraph', icon: 'i-lucide-type' },
            { kind: 'heading', level: 1, label: 'Heading 1', icon: 'i-lucide-heading-1' },
            { kind: 'heading', level: 2, label: 'Heading 2', icon: 'i-lucide-heading-2' },
            { kind: 'heading', level: 3, label: 'Heading 3', icon: 'i-lucide-heading-3' },
            { kind: 'heading', level: 4, label: 'Heading 4', icon: 'i-lucide-heading-4' },
            { kind: 'bulletList', label: 'Bullet List', icon: 'i-lucide-list' },
            { kind: 'orderedList', label: 'Ordered List', icon: 'i-lucide-list-ordered' },
            { kind: 'blockquote', label: 'Blockquote', icon: 'i-lucide-text-quote' },
            { kind: 'codeBlock', label: 'Code Block', icon: 'i-lucide-square-code' },
          ],
        },
        {
          kind: 'clearFormatting',
          pos: selectedNode.value?.pos,
          label: 'Reset formatting',
          icon: 'i-lucide-rotate-ccw',
        },
      ],
      [
        {
          kind: 'duplicate',
          pos: selectedNode.value?.pos,
          label: 'Duplicate',
          icon: 'i-lucide-copy',
        },
        {
          label: 'Copy to clipboard',
          icon: 'i-lucide-clipboard',
          onSelect: async () => {
            if (!selectedNode.value) return;

            const pos = selectedNode.value.pos;
            const node = editor.state.doc.nodeAt(pos);
            if (node) {
              await navigator.clipboard.writeText(node.textContent);
            }
          },
        },
      ],
      [
        {
          kind: 'moveUp',
          pos: selectedNode.value?.pos,
          label: 'Move up',
          icon: 'i-lucide-arrow-up',
        },
        {
          kind: 'moveDown',
          pos: selectedNode.value?.pos,
          label: 'Move down',
          icon: 'i-lucide-arrow-down',
        },
      ],
      [
        {
          kind: 'delete',
          pos: selectedNode.value?.pos,
          label: 'Delete',
          icon: 'i-lucide-trash',
        },
      ],
    ],
    customHandlers,
  ) as DropdownMenuItem[][];
};

const suggestionItems = [
  [
    {
      type: 'label',
      label: 'AI',
    },
    {
      kind: 'aiContinue',
      label: 'Continue writing',
      icon: 'i-lucide-sparkles',
    },
  ],
  [
    {
      type: 'label',
      label: 'Style',
    },
    {
      kind: 'paragraph',
      label: 'Paragraph',
      icon: 'i-lucide-type',
    },
    {
      kind: 'heading',
      level: 1,
      label: 'Heading 1',
      icon: 'i-lucide-heading-1',
    },
    {
      kind: 'heading',
      level: 2,
      label: 'Heading 2',
      icon: 'i-lucide-heading-2',
    },
    {
      kind: 'heading',
      level: 3,
      label: 'Heading 3',
      icon: 'i-lucide-heading-3',
    },
    {
      kind: 'bulletList',
      label: 'Bullet List',
      icon: 'i-lucide-list',
    },
    {
      kind: 'orderedList',
      label: 'Numbered List',
      icon: 'i-lucide-list-ordered',
    },
    {
      kind: 'blockquote',
      label: 'Blockquote',
      icon: 'i-lucide-text-quote',
    },
    {
      kind: 'codeBlock',
      label: 'Code Block',
      icon: 'i-lucide-square-code',
    },
  ],
  [
    {
      type: 'label',
      label: 'Insert',
    },
    {
      kind: 'emoji',
      label: 'Emoji',
      icon: 'i-lucide-smile-plus',
    },
    {
      kind: 'imageUpload',
      label: 'Image',
      icon: 'i-lucide-image',
    },
    {
      kind: 'horizontalRule',
      label: 'Horizontal Rule',
      icon: 'i-lucide-separator-horizontal',
    },
  ],
] as any;

const emojiItems: EditorEmojiMenuItem[] = gitHubEmojis.filter((emoji) => !emoji.name.startsWith('regional_indicator_'));
</script>

<template>
  <UEditor
    ref="editorRef"
    v-slot="{ editor, handlers }"
    v-model="model"
    content-type="markdown"
    :extensions="[
      Emoji,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ImageUpload,
      FileImageExtension,
      CodeBlockShiki.configure({
        defaultTheme: 'material-theme',
        themes: {
          light: 'material-theme-lighter',
          dark: 'material-theme-palenight',
        },
      }),
      completionExtension,
    ] as any"
    :handlers="customHandlers"
    placeholder="Type '/' for commands..."
    :ui="{ base: 'p-4 sm:px-8 py-6 min-h-96' }"
    class="w-full"
  >
    <!-- Bubble toolbar for text selection -->
    <UEditorToolbar
      :editor="editor"
      :items="bubbleToolbarItems"
      layout="bubble"
      :should-show="({ editor, view, state }) => {
        if (editor.isActive('imageUpload') || editor.isActive('image')) {
          return false;
        }
        const { selection } = state;
        return view.hasFocus() && !selection.empty;
      }"
    >
      <template #link>
        <EditorLinkPopover :editor="editor" />
      </template>
    </UEditorToolbar>

    <!-- Bubble toolbar for images -->
    <UEditorToolbar
      :editor="editor"
      :items="imageToolbarItems(editor)"
      layout="bubble"
      :should-show="({ editor, view }) => {
        return editor.isActive('image') && view.hasFocus();
      }"
    />

    <!-- Drag handle for blocks -->
    <UEditorDragHandle v-slot="{ ui, onClick }" :editor="editor" @node-change="selectedNode = $event">
      <UButton
        icon="i-lucide-plus"
        color="neutral"
        variant="ghost"
        size="sm"
        :class="ui.handle()"
        @click="
          (e) => {
            e.stopPropagation();

            const selected = onClick();
            handlers.suggestion?.execute(editor, { pos: selected?.pos }).run();
          }
        "
      />

      <UDropdownMenu
        v-slot="{ open }"
        :modal="false"
        :items="handleItems(editor)"
        :content="{ side: 'left' }"
        :ui="{ content: 'w-48', label: 'text-xs' }"
        @update:open="editor.chain().setMeta('lockDragHandle', $event).run()"
      >
        <UButton
          color="neutral"
          variant="ghost"
          active-variant="soft"
          size="sm"
          icon="i-lucide-grip-vertical"
          :active="open"
          :class="ui.handle()"
        />
      </UDropdownMenu>
    </UEditorDragHandle>

    <!-- Suggestion menu (slash commands) -->
    <UEditorSuggestionMenu :editor="editor" :items="suggestionItems" />

    <!-- Emoji menu -->
    <UEditorEmojiMenu :editor="editor" :items="emojiItems" />
  </UEditor>
</template>

<style>
html.dark .tiptap .shiki,
html.dark .tiptap .shiki span {
  color: var(--shiki-dark) !important;
  background-color: var(--ui-bg-muted) !important;
}

.tiptap {
  padding: 0;
}
</style>
