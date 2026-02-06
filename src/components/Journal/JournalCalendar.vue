<script setup lang="ts">
import { computed } from "vue";
import { CalendarDate, getLocalTimeZone } from '@internationalized/date';

const props = defineProps<{
  currentDate: Date;
  highlightedDates: string[];
}>();

const emit = defineEmits<{
  dateSelect: [date: Date];
}>();

const calendarDate = computed(() => {
  const d = props.currentDate;
  return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
});

function handleDateSelect(value: any) {
  if (value && typeof value.toDate === 'function') {
    const date = value.toDate(getLocalTimeZone());
    if (date instanceof Date) {
      emit('dateSelect', date);
    }
  }
}

function hasJournalEntry(date: any): boolean {
  if (!date || typeof date !== 'object') return false;
  const year = date.year;
  const month = String(date.month).padStart(2, '0');
  const day = String(date.day).padStart(2, '0');
  const dateISO = `${year}-${month}-${day}`;
  return props.highlightedDates.includes(dateISO);
}

function isCurrent(date: any): boolean {
  if (!date || typeof date !== 'object') return false;
  const currentISO = `${props.currentDate.getFullYear()}-${String(props.currentDate.getMonth() + 1).padStart(2, '0')}-${String(props.currentDate.getDate()).padStart(2, '0')}`;
  const year = date.year;
  const month = String(date.month).padStart(2, '0');
  const day = String(date.day).padStart(2, '0');
  const dateISO = `${year}-${month}-${day}`;
  return dateISO === currentISO;
}
</script>

<template>
  <div class="p-4">
    <UCalendar 
      v-model="calendarDate"
      @update:model-value="handleDateSelect"
    >
      <template #day="{ day }">
        <UChip
          v-if="hasJournalEntry(day)"
          size="2xs"
          color="primary"
          variant="subtle"
        >
          {{ day.day }}
        </UChip>
        
        <span
          v-else-if="isCurrent(day)"
          class="font-semibold"
        >
          {{ day.day }}
        </span>
        
        <span v-else>
          {{ day.day }}
        </span>
      </template>
    </UCalendar>
  </div>
</template>
