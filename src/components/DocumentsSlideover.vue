<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useDocumentsStore } from "@/stores/documents";
import { useTabsStore } from "@/stores/tabs";
import { useRouter } from "vue-router";

const documentsStore = useDocumentsStore();
const tabsStore = useTabsStore();
const router = useRouter();

const open = ref(false);
const searchTerm = ref("");

onMounted(() => {
  documentsStore.loadDocuments();
});

const groups = computed(() => [{
  id: 'documents',
  label: 'Documents',
  items: documentsStore.documents.map(document => ({
    label: document.name,
    icon: document.icon,
    slot: 'document-item',
    type: document.type,
    onSelect: () => {
      tabsStore.openTab(`/${document.type}/${document.id}`, document.name);
      router.push({
        name: document.type,
        params: { id: document.id },
      });
      open.value = false;
      searchTerm.value = "";
    }
  }))
}]);
</script>

<template>
  <USlideover v-model:open="open" title="Documents" side="right">
    <UButton
      icon="i-lucide-menu"
      color="neutral"
      variant="subtle"
    />
    <template #content>
      <UCommandPalette
        v-model:search-term="searchTerm"
        :groups="groups"
        placeholder="Search documents..."
        class="h-96"
        close
        @update:open="open = $event"
      >
        <template #document-item-trailing="{ item }">
          <UBadge
            :color="item.type === 'note' ? 'primary' : 'warning'"
            :icon="item.type === 'note' ? 'i-lucide-notebook-text' : 'i-lucide-git-compare'"
            variant="soft"
            size="xs"
          >
            {{ item.type }}
          </UBadge>
        </template>
      </UCommandPalette>
    </template>
  </USlideover>
</template>
