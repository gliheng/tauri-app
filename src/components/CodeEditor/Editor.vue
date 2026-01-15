<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { basicSetup } from 'codemirror'
import { EditorView, ViewUpdate } from '@codemirror/view'
import { EditorState } from '@codemirror/state'

interface Props {
  modelValue: string
  language?: 'py' | 'js' | 'ts' | 'tsx' | 'json'
  theme?: 'light' | 'dark'
  height?: string
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  language: 'py',
  theme: 'light',
  height: '200px',
  readonly: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorContainer = ref<HTMLElement>()
let editorView: EditorView | null = null

const getLanguageExtension = async () => {
  switch (props.language) {
    case 'py':
      const pythonLang = await import('@codemirror/lang-python')
      return pythonLang.python()
    case 'js':
      const jsLang = await import('@codemirror/lang-javascript')
      return jsLang.javascript({ typescript: false })
    case 'ts':
      const tsLang = await import('@codemirror/lang-javascript')
      return tsLang.javascript({ typescript: true })
    case 'tsx':
      const tsxLang = await import('@codemirror/lang-javascript')
      return tsxLang.javascript({ typescript: true, jsx: true })
    case 'json':
      const jsonLang = await import('@codemirror/lang-json')
      return jsonLang.json()
    default:
      return null
  }
}

const getThemeExtension = async () => {
  if (props.theme === 'dark') {
    const { oneDark } = await import('@codemirror/theme-one-dark')
    return oneDark
  }
  return []
}

const initializeEditor = async () => {
  if (!editorContainer.value) return

  const [languageExtension, themeExtension] = await Promise.all([
    getLanguageExtension(),
    getThemeExtension(),
  ])

  const extensions = [
    basicSetup,
    themeExtension,
    EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        const newValue = update.state.doc.toString()
        emit('update:modelValue', newValue)
      }
    }),
    EditorView.theme({
      '&': {
        height: '100%',
      },
    }),
  ]

  if (languageExtension) {
    extensions.push(languageExtension);
  }

  if (props.readonly) {
    extensions.push(EditorState.readOnly.of(true))
  }

  const startState = EditorState.create({
    doc: props.modelValue || '',
    extensions,
  })

  editorView = new EditorView({
    state: startState,
    parent: editorContainer.value,
  })
}

onMounted(() => {
  initializeEditor()
})

onUnmounted(() => {
  if (editorView) {
    editorView.destroy()
  }
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (editorView && newValue !== editorView.state.doc.toString()) {
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: newValue || '',
        },
      })
    }
  }
)

watch(
  [() => props.language, () => props.theme],
  () => {
    if (editorView) {
      const currentValue = editorView.state.doc.toString()
      editorView.destroy()
      initializeEditor().then(() => {
        if (editorView && currentValue !== props.modelValue) {
          editorView.dispatch({
            changes: {
              from: 0,
              to: editorView.state.doc.length,
              insert: currentValue,
            },
          })
        }
      })
    }
  }
)
</script>

<template>
  <div ref="editorContainer" class="w-full h-full"></div>
</template>

<style lang="scss" scoped>
:deep(.cm-editor.cm-focused) {
  outline: none;
}

:deep(.cm-scroller) {
  overflow: auto;
}

:deep(.cm-content) {
  padding: 8px;
  font-family: Monaco, Menlo, "Ubuntu Mono", monospace;
}
</style>
