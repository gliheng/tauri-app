<script setup lang="ts">
import moment from "moment";
import type { Journal } from "@/db/journal";

defineProps<{
  recentJournals: Journal[];
}>();

const emit = defineEmits<{
  dateSelect: [date: Date];
}>();

function formatDate(dateString: string): string {
  const date = moment(dateString);
  const today = moment();
  const yesterday = moment().subtract(1, 'day');

  if (date.isSame(today, 'day')) {
    return 'Today';
  } else if (date.isSame(yesterday, 'day')) {
    return 'Yesterday';
  } else {
    const format = date.year() === today.year()
      ? 'MMM D'
      : 'MMM D, YYYY';
    return date.format(format);
  }
}

function getPreviewText(content: string): string {
  if (!content) return 'No content';
  const text = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return text.length > 50 ? text.substring(0, 50) + '...' : text;
}

function handleJournalClick(journal: Journal) {
  emit('dateSelect', moment(journal.date).toDate());
}
</script>

<template>
  <div class="p-4">
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent journals</h3>
    
    <ul v-if="recentJournals.length > 0" class="space-y-2">
      <li v-for="journal in recentJournals" :key="journal.id">
        <button
          @click="handleJournalClick(journal)"
          class="w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ formatDate(journal.date) }}
            </span>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
            {{ getPreviewText(journal.content || '') }}
          </p>
        </button>
      </li>
    </ul>
    
    <div v-else class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
      No recent journals
    </div>
  </div>
</template>
