<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useJournalStore } from "@/stores/journal";

const props = defineProps<{
  currentDate: Date;
}>();

const emit = defineEmits<{
  dateSelect: [date: Date];
}>();

const journalStore = useJournalStore();

const visibleDates = ref<Date[]>([]);
const loading = ref(false);
const hasMore = ref(true);

onMounted(async () => {
  await loadInitialJournals();
});

async function loadInitialJournals() {
  loading.value = true;
  const today = new Date();
  const dates = getLast30DaysWithContent(today);
  visibleDates.value = dates;
  
  await journalStore.loadJournalsByDates(dates);
  
  loading.value = false;
  hasMore.value = await journalStore.hasMoreJournals();
}

function getLast30DaysWithContent(date: Date): Date[] {
  const dates: Date[] = [];
  const today = new Date(date);
  
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    
    const dateISO = formatDateISO(d);
    if (journalStore.journals[dateISO]) {
      dates.push(d);
    }
  }
  
  return dates;
}

function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isCurrentDate(date: Date): boolean {
  const currentISO = formatDateISO(props.currentDate);
  const dateISO = formatDateISO(date);
  return dateISO === currentISO;
}

function hasContent(date: Date): boolean {
  const dateISO = formatDateISO(date);
  const journal = journalStore.journals[dateISO];
  return !!(journal && journal.content && journal.content.trim().length > 0);
}

function getWordCount(date: Date): number {
  const dateISO = formatDateISO(date);
  const journal = journalStore.journals[dateISO];
  if (!journal || !journal.content) return 0;
  return journal.content.split(/\s+/).filter(w => w.trim().length > 0).length;
}

function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  });
}

function selectDate(date: Date) {
  emit('dateSelect', date);
}
</script>

<template>
  <div class="p-4 h-full flex flex-col">
    <h3 class="text-sm font-semibold mb-4 text-[var(--ui-color-highlighted)] uppercase tracking-wider">
      Recent Journals
    </h3>

    <div class="flex-1 overflow-y-auto flex flex-col gap-1">
      <div v-for="date in visibleDates" :key="date.toISOString()" class="shrink-0">
        <UButton
          :variant="isCurrentDate(date) ? 'solid' : 'ghost'"
          :color="isCurrentDate(date) ? 'primary' : 'neutral'"
          class="flex justify-between items-center px-3 py-2"
          @click="selectDate(date)"
          block
        >
          <span class="font-medium">{{ formatDate(date) }}</span>
          <UBadge v-if="hasContent(date)" size="xs" variant="soft" color="neutral">
            {{ getWordCount(date) }} words
          </UBadge>
        </UButton>
      </div>

      <div v-if="loading" class="p-4 flex items-center justify-center gap-2 text-sm text-[var(--ui-color-muted)]">
        <Spinner size="sm" />
        <span>Loading more entries...</span>
      </div>

      <div v-if="!hasMore && visibleDates.length > 0" class="p-4 flex items-center justify-center gap-2 text-sm text-[var(--ui-color-muted)]">
        All entries loaded
      </div>

      <div v-if="visibleDates.length === 0 && !loading" class="py-8">
        <UEmpty>
          <template #icon>
            <UIcon name="i-lucide-book-open" size="xl" />
          </template>
          <template #headline>No journal entries yet</template>
          <template #description>Start writing your first journal entry</template>
        </UEmpty>
      </div>
    </div>
  </div>
</template>
