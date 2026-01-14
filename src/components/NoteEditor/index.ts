// Main editor component
export { default as NoteEditor } from './Editor.vue';

// Extensions
export { ImageUpload, createFileImagePlugin } from './EditorImageUploadExtension';
export { default as EditorImageUploadExtension } from './EditorImageUploadExtension';
export { Completion, completionPluginKey } from './EditorCompletionExtension';
export { default as EditorCompletionExtension } from './EditorCompletionExtension';

// Composables
export { useEditorCompletion } from './EditorUseCompletion';

// Components
export { default as EditorLinkPopover } from './EditorLinkPopover.vue';
export { default as EditorImageUploadNode } from './EditorImageUploadNode.vue';
