<script setup lang="ts">
import { ref, onMounted, watch } from "vue";

const props = defineProps({
  content: {
    type: String,
    required: true,
  },
  contentType: {
    type: String,
    default: 'html',
  },
});

const iframeRef = ref<HTMLIFrameElement | null>(null);

function renderContent() {
  if (!iframeRef.value) return;
  
  const iframe = iframeRef.value;
  
  if (props.contentType === 'html') {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;
    
    iframeDoc.open();
    iframeDoc.write(props.content);
    iframeDoc.close();
  } else {
    const mimeType = getMimeType(props.contentType);
    const dataUrl = `data:${mimeType};base64,${btoa(props.content)}`;
    iframe.src = dataUrl;
  }
}

function getMimeType(type: string): string {
  const mimeTypes: Record<string, string> = {
    'text': 'text/plain',
    'json': 'application/json',
    'xml': 'application/xml',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf',
    'markdown': 'text/markdown',
    'css': 'text/css',
    'javascript': 'text/javascript',
  };
  return mimeTypes[type] || 'text/plain';
}

onMounted(() => {
  renderContent();
});

watch(() => props.content, () => {
  renderContent();
});
</script>

<template>
  <div class="h-full w-full bg-white">
    <iframe
      ref="iframeRef"
      class="w-full h-full border-0"
      sandbox="allow-scripts allow-same-origin allow-forms"
    />
  </div>
</template>
