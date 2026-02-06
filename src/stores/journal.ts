import { ref, computed, watch } from "vue";
import { defineStore } from "pinia";
import moment from "moment";
import { Journal, writeJournal, getJournalByDate, updateJournal, getJournalDatesInMonth } from "@/db/journal";

export const useJournalStore = defineStore("journal", () => {
  const journals = ref<Record<string, Journal>>({});
  const currentDate = ref<Date>(new Date());
  const currentMonthDates = ref<Set<string>>(new Set());

  async function loadJournalByDate(date: Date) {
    const dateISO = formatDateISO(date);
    
    if (journals.value[dateISO]) {
      return journals.value[dateISO];
    }
    
    const journal = await getJournalByDate(dateISO);
    if (journal) {
      journals.value[dateISO] = journal;
    }
    
    return journal;
  }

  async function loadMonthDates(date: Date) {
    const year = moment(date).year();
    const month = moment(date).month() + 1;
    const dates = await getJournalDatesInMonth(year, month);
    currentMonthDates.value = new Set(dates);
  }

  function cleanUpOldJournals() {
    const dateISOs = Object.keys(journals.value);
    dateISOs.forEach(dateISO => {
      if (!currentMonthDates.value.has(dateISO)) {
        delete journals.value[dateISO];
      }
    });
  }

  async function loadCurrentJournal() {
    await loadJournalByDate(currentDate.value);
  }

  async function createJournal(date: Date, content = '') {
    const { nanoid } = await import('nanoid');
    const id = nanoid();
    
    const journal: Journal = {
      id,
      date: formatDateISO(date),
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await writeJournal(journal);
    journals.value[journal.date] = journal;
    currentMonthDates.value.add(journal.date);
    
    return journal;
  }

  async function updateJournalContent(date: Date, content: string) {
    const dateISO = formatDateISO(date);
    
    if (!journals.value[dateISO]) {
      await createJournal(date, content);
    } else {
      await updateJournal(dateISO, { content, updatedAt: new Date() });
      journals.value[dateISO].content = content;
      journals.value[dateISO].updatedAt = new Date();
      currentMonthDates.value.add(dateISO);
    }
  }

  const currentJournal = computed(() => {
    const dateISO = formatDateISO(currentDate.value);
    return journals.value[dateISO] || {
      id: '',
      date: dateISO,
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  function formatDateISO(date: Date): string {
    return moment(date).format('YYYY-MM-DD');
  }

  async function goToPreviousDay() {
    const newDate = moment(currentDate.value).subtract(1, 'day').toDate();
    await loadJournalByDate(newDate);
    currentDate.value = newDate;
  }

  async function goToNextDay() {
    const newDate = moment(currentDate.value).add(1, 'day').toDate();
    await loadJournalByDate(newDate);
    currentDate.value = newDate;
  }

  async function goToToday() {
    const today = new Date();
    await loadJournalByDate(today);
    currentDate.value = today;
  }

  async function goToDate(date: Date) {
    await loadJournalByDate(date);
    currentDate.value = date;
  }

  watch(currentDate, async (newDate, oldDate) => {
    let isNewMonth = true;
    if (oldDate) {
      isNewMonth = moment(newDate).month() !== moment(oldDate).month() || 
                          moment(newDate).year() !== moment(oldDate).year();
    }
    if (isNewMonth) {
      await loadMonthDates(newDate);
      cleanUpOldJournals();
    }
  }, {
    immediate: true,
  });

  return {
    journals,
    currentDate,
    currentJournal,
    currentMonthDates,
    loadJournalByDate,
    loadCurrentJournal,
    loadMonthDates,
    updateJournalContent,
    createJournal,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    goToDate,
    formatDateISO,
  };
});
