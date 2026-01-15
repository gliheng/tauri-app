<script setup lang="ts">
import { useTemplateRef, onMounted, onUnmounted, watch } from 'vue'
import * as monaco from 'monaco-editor'
import loader from '@monaco-editor/loader'

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

const editorContainer = useTemplateRef<HTMLElement>('editorContainer')
let editor: monaco.editor.IStandaloneCodeEditor | null = null
let monacoInstance: typeof monaco | null = null

const getMonacoLanguage = (lang: string): string => {
  switch (lang) {
    case 'py':
      return 'python'
    case 'js':
      return 'javascript'
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'json':
      return 'json'
    default:
      return 'plaintext'
  }
}

const configureMonacoWorkers = () => {
  // Configure workers for production and development
  if (typeof window !== 'undefined') {
    (window as any).MonacoEnvironment = {
      getWorker: function (_: string, label: string) {
        const getWorkerModule = (moduleUrl: string) => {
          return new Worker(new URL(moduleUrl, import.meta.url), {
            type: 'module',
          })
        }

        switch (label) {
          case 'json':
            return getWorkerModule('monaco-editor/esm/vs/language/json/json.worker')
          case 'css':
          case 'scss':
          case 'less':
            return getWorkerModule('monaco-editor/esm/vs/language/css/css.worker')
          case 'html':
          case 'handlebars':
          case 'razor':
            return getWorkerModule('monaco-editor/esm/vs/language/html/html.worker')
          case 'typescript':
          case 'javascript':
            return getWorkerModule('monaco-editor/esm/vs/language/typescript/ts.worker')
          default:
            return getWorkerModule('monaco-editor/esm/vs/editor/editor.worker')
        }
      }
    }
  }
}

const initializeEditor = async () => {
  if (!editorContainer.value) return

  try {
    monacoInstance = await loader.init()
    configureMonacoWorkers()
    
    editor = monacoInstance.editor.create(editorContainer.value, {
      value: props.modelValue || '',
      language: getMonacoLanguage(props.language),
      theme: props.theme === 'dark' ? 'vs-dark' : 'vs',
      readOnly: props.readonly,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      padding: { top: 8, bottom: 8 },
      bracketPairColorization: { enabled: true },
      suggest: {
        showKeywords: true,
        showSnippets: true,
      },
    })

    editor.onDidChangeModelContent(() => {
      const value = editor?.getValue() || ''
      emit('update:modelValue', value)
    })
  } catch (error) {
    console.error('Failed to initialize Monaco Editor:', error)
  }
}

onMounted(() => {
  initializeEditor()
})

onUnmounted(() => {
  editor?.dispose()
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (editor && newValue !== editor.getValue()) {
      editor.setValue(newValue || '')
    }
  }
)

watch(
  [() => props.language, () => props.theme],
  async () => {
    if (editor && monacoInstance) {
      const currentValue = editor.getValue()
      
      // Update language
      const newLanguage = getMonacoLanguage(props.language)
      monacoInstance.editor.setModelLanguage(editor.getModel()!, newLanguage)
      
      // Update theme
      const newTheme = props.theme === 'dark' ? 'vs-dark' : 'vs'
      monacoInstance.editor.setTheme(newTheme)
    }
  }
)
</script>

<template>
  <div ref="editorContainer" class="w-full h-full"></div>
</template>

<style lang="scss" scoped>
.monaco-editor {
  outline: none;
  
  .monaco-scrollable-element {
    overflow: auto;
  }
  
  .monaco-editor-background {
    background-color: var(--vs-editor-background);
  }
}
</style>
