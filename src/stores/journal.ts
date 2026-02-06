import { ref, computed } from "vue";
import { defineStore } from "pinia";
import moment from "moment";
import { Journal, writeJournal, getJournalByDate, getJournalsByDates, updateJournal, getJournalDatesInRange, countJournalsOlderThan } from "@/db/journal";

export const useJournalStore = defineStore("journal", () => {
  const journals = ref<Record<string, Journal>>({});
  const currentDate = ref<Date>(new Date());
  const loadedDateRanges = ref<{start: Date; end: Date}[]>([]);

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

  async function loadJournalsByDates(dates: Date[]) {
    const dateISOs = dates.map(d => formatDateISO(d));
    const journalsData = await getJournalsByDates(dateISOs);
    
    for (const journal of journalsData) {
      journals.value[journal.date] = journal;
    }
    
    if (dates.length > 0) {
      const start = dates[dates.length - 1];
      const end = dates[0];
      loadedDateRanges.value.push({ start, end });
    }
  }

  async function getDatesWithContent(
    date: Date,
    options: {
      daysBack?: number;
      includeEmpty?: boolean;
      olderThan?: Date;
    } = {}
  ): Promise<Date[]> {
    const { daysBack = 30, includeEmpty = false, olderThan } = options;
    
    const result = await getJournalDatesInRange(
      formatDateISO(date),
      daysBack,
      includeEmpty
    );
    
    const dates = result.map(d => parseISODate(d));
    
    if (olderThan) {
      return dates.filter(d => d < olderThan);
    }
    
    return dates;
  }

  async function hasMoreJournals(): Promise<boolean> {
    const oldestLoaded = getOldestLoadedDate();
    if (!oldestLoaded) return true;
    
    const count = await countJournalsOlderThan(formatDateISO(oldestLoaded));
    return count > 0;
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
    }
  }

  function getOldestLoadedDate(): Date | null {
    if (Object.keys(journals.value).length === 0) return null;
    
    const dates = Object.keys(journals.value).map(d => parseISODate(d));
    return dates.reduce((oldest, current) => 
      current < oldest ? current : oldest
    );
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

  const sortedJournals = computed(() => {
    return Object.values(journals.value).sort(
      (a, b) => moment(b.date).valueOf() - moment(a.date).valueOf()
    );
  });

  const recentJournals = computed(() => {
    return sortedJournals.value.slice(0, 30);
  });

  const loadedDates = computed(() => {
    return Object.keys(journals.value);
  });

  function formatDateISO(date: Date): string {
    return moment(date).format('YYYY-MM-DD');
  }

  function parseISODate(dateStr: string): Date {
    return moment(dateStr).toDate();
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
    await loadJournalByDate(currentDate.value);
    currentDate.value = new Date();
  }

  async function goToDate(date: Date) {
    await loadJournalByDate(date);
    currentDate.value = date;
  }

  return {
    journals,
    currentDate,
    currentJournal,
    sortedJournals,
    recentJournals,
    loadedDates,
    loadedDateRanges,
    loadJournalByDate,
    loadJournalsByDates,
    getDatesWithContent,
    hasMoreJournals,
    loadCurrentJournal,
    updateJournalContent,
    createJournal,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    goToDate,
    formatDateISO,
  };
});
