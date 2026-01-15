<script setup lang="ts">
import { ref, computed } from "vue";

interface NavigationItem {
  name: string;
  icon: string;
  onClick: () => void;
}

interface Props {
  title?: string;
  items: NavigationItem[];
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
});

const open = ref(false);
const searchTerm = ref("");

const groups = computed(() => [{
  id: 'items',
  label: props.title,
  items: props.items.map(item => ({
    label: item.name,
    icon: item.icon,
    onSelect: () => {
      item.onClick();
      open.value = false;
      searchTerm.value = "";
    }
  }))
}]);
</script>

<template>
  <USlideover v-model:open="open" :title="title" side="left">
    <UButton
      icon="i-lucide-menu"
      color="neutral"
      variant="subtle"
    />
    <template #content>
      <UCommandPalette
        v-model:search-term="searchTerm"
        :groups="groups"
        :placeholder="title ? `Search ${title.toLowerCase()}...` : 'Search...'"
        class="h-96"
        close
        @update:open="open = $event"
      />
    </template>
  </USlideover>
</template>
