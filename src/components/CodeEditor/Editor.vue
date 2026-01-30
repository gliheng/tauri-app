<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { basicSetup } from 'codemirror'
import { EditorView, ViewUpdate } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { debounce } from 'lodash-es'

interface Props {
  modelValue: string
  language?: string
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

interface SelectionData {
  selection?: { start: number; end: number }
}

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'selection': [data: SelectionData]
  'blur': []
}>()

const editorContainer = ref<HTMLElement>()
let editorView: EditorView | null = null

const getLanguageExtension = async () => {
  switch (props.language) {
    case 'py':
      const pythonLang = await import('@codemirror/lang-python')
      return pythonLang.python()
    case 'js':
    case 'mjs':
      const jsLang = await import('@codemirror/lang-javascript')
      return jsLang.javascript({ typescript: false })
    case 'ts':
    case 'mts':
      const tsLang = await import('@codemirror/lang-javascript')
      return tsLang.javascript({ typescript: true })
    case 'jsx':
      const jsxLang = await import('@codemirror/lang-javascript')
      return jsxLang.javascript({ jsx: true })
    case 'tsx':
      const tsxLang = await import('@codemirror/lang-javascript')
      return tsxLang.javascript({ typescript: true, jsx: true })
    case 'vue':
      const vueLang = await import('@codemirror/lang-vue')
      return vueLang.vue()
    case 'json':
      const jsonLang = await import('@codemirror/lang-json')
      return jsonLang.json()
    case 'html':
      const htmlLang = await import('@codemirror/lang-html')
      return htmlLang.html()
    case 'css':
      const cssLang = await import('@codemirror/lang-css')
      return cssLang.css()
    case 'less':
      const lessLang = await import('@codemirror/lang-less')
      return lessLang.less()
    case 'scss':
    case 'sass':
      const sassLang = await import('@codemirror/lang-sass')
      return sassLang.sass()
    case 'markdown':
      const mdLang = await import('@codemirror/lang-markdown')
      return mdLang.markdown()
    case 'sql':
      const sqlLang = await import('@codemirror/lang-sql')
      return sqlLang.sql()
    case 'cpp':
      const cppLang = await import('@codemirror/lang-cpp')
      return cppLang.cpp()
    case 'java':
      const javaLang = await import('@codemirror/lang-java')
      return javaLang.java()
    case 'rust':
      const rustLang = await import('@codemirror/lang-rust')
      return rustLang.rust()
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

  // Debounced selection update function
  const debouncedSelectionUpdate = debounce(() => {
    if (!editorView) return
    const selection = editorView.state.selection.main

    // Check if there's a text selection
    let selectionRange: { start: number; end: number } | undefined
    if (selection.from !== selection.to) {
      const startLine = editorView.state.doc.lineAt(selection.from)
      const endLine = editorView.state.doc.lineAt(selection.to)
      selectionRange = {
        start: startLine.number,
        end: endLine.number,
      }
    }

    emit('selection', {
      selection: selectionRange
    })
  }, 150)

  const extensions = [
    basicSetup,
    themeExtension,
    EditorView.domEventHandlers({
      blur: () => {
        emit('blur')
      }
    }),
    EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        const newValue = update.state.doc.toString()
        emit('update:modelValue', newValue)
      }
      if (update.selectionSet) {
        debouncedSelectionUpdate()
      }
    }),
    EditorView.theme({
      '&': {
        height: props.height ?? '100%',
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
  <div ref="editorContainer"></div>
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
  font-family: Menlo, Monaco, "Ubuntu Mono", "Courier New", monospace;
}
</style>
