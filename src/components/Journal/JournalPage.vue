<script setup lang="ts">
import { toRefs, computed } from "vue";
import { useJournalStore } from "@/stores/journal";
import { NoteEditor } from "@/components/NoteEditor";
import JournalToolbar from "./JournalToolbar.vue";
import JournalCalendar from "./JournalCalendar.vue";
import JournalDateList from "./JournalDateList.vue";
import { throttle } from "lodash-es";

const journalStore = useJournalStore();
const { currentDate, currentJournal } = toRefs(journalStore);

await journalStore.loadCurrentJournal();

function goToPreviousDay() {
  journalStore.goToPreviousDay();
}

function goToNextDay() {
  journalStore.goToNextDay();
}

function goToToday() {
  journalStore.goToToday();
}

function selectDate(date: Date) {
  journalStore.goToDate(date);
}

const throttledSave = throttle(async (content: string) => {
  const dayDate = currentDate.value;
  await journalStore.updateJournalContent(dayDate, content);
}, 1000);

const currentJournalContent = computed({
  get: () => currentJournal.value?.content || '',
  set: (content: string) => {
    throttledSave(content);
  },
});
</script>

<template>
  <div class="flex h-full overflow-hidden">
    <div class="flex-1 flex-col min-w-0 overflow-hidden">
      <JournalToolbar
        :current-date="currentDate"
        @previous="goToPreviousDay"
        @next="goToNextDay"
        @today="goToToday"
      />
      
      <div class="day-editor flex-1 min-h-0 overflow-y-auto mx-10">
        <NoteEditor
          v-if="currentJournal"
          :key="currentDate.toISOString()"
          v-model="currentJournalContent"
          :date="currentDate"
        />
        
        <div v-else class="flex flex-1 items-center justify-center">
          <USpinner size="lg" />
        </div>
      </div>
    </div>
    
    <div class="w-[320px] min-w-[320px] border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden lg:flex hidden">
      <JournalCalendar
        :current-date="currentDate"
        :highlighted-dates="journalStore.loadedDates"
        @date-select="selectDate"
      />
      
      <JournalDateList
        :current-date="currentDate"
        @date-select="selectDate"
      />
    </div>
  </div>
</template>
