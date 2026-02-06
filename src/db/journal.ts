import { db } from '.';

export interface Journal {
  id: string;
  date: string;
  content?: string;
  createdAt: Date;
  updatedAt: Date;
}

function dateToString(date: Date): string {
  return date.toISOString();
}

function stringToDate(dateString: string): Date {
  return new Date(dateString);
}

export async function writeJournal(data: Journal): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  await db.execute(
    `INSERT OR REPLACE INTO journal (id, date, content, createdAt, updatedAt)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      data.id,
      data.date,
      data.content ?? null,
      dateToString(data.createdAt),
      dateToString(data.updatedAt),
    ]
  );
}

export async function getJournalByDate(date: string): Promise<Journal | undefined> {
  if (!db) throw new Error('Database not initialized');
  const result = await db.select<Journal[]>(
    `SELECT * FROM journal WHERE date = $1`,
    [date]
  );
  if (result.length === 0) return undefined;
  const row = result[0] as any;
  return {
    ...row,
    createdAt: stringToDate(row.createdAt),
    updatedAt: stringToDate(row.updatedAt),
  };
}

export async function getJournalsByDates(dates: string[]): Promise<Journal[]> {
  if (!db) throw new Error('Database not initialized');
  
  if (dates.length === 0) return [];
  
  const placeholders = dates.map((_, i) => `$${i + 1}`).join(',');
  const result = await db.select<Journal[]>(
    `SELECT * FROM journal WHERE date IN (${placeholders}) ORDER BY date DESC`,
    dates
  );
  
  return result.map((row: any) => ({
    ...row,
    createdAt: stringToDate(row.createdAt),
    updatedAt: stringToDate(row.updatedAt),
  }));
}

export async function getAllJournals(): Promise<Journal[]> {
  if (!db) throw new Error('Database not initialized');
  const result = await db.select<Journal[]>(
    `SELECT * FROM journal ORDER BY date DESC`
  );
  return result.map((row: any) => ({
    ...row,
    createdAt: stringToDate(row.createdAt),
    updatedAt: stringToDate(row.updatedAt),
  }));
}

export async function updateJournal(id: string, data: Partial<Journal>): Promise<void> {
  if (!db) throw new Error('Database not initialized');

  const existing = await getJournalByDate(id);
  if (!existing) throw new Error(`Journal with date ${id} not found`);

  const updated = { ...existing, ...data, updatedAt: new Date() };
  await writeJournal(updated);
}

export async function deleteJournal(date: string): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  await db.execute('DELETE FROM journal WHERE date = $1', [date]);
}

export async function getJournalDatesInRange(
  fromDate: string,
  daysBack: number,
  includeEmpty: boolean
): Promise<string[]> {
  if (!db) throw new Error('Database not initialized');
  
  const from = new Date(fromDate);
  const to = new Date(from);
  to.setDate(to.getDate() - daysBack);
  const toISO = dateToString(to);
  
  let query = `
    SELECT date FROM journal 
    WHERE date <= $1 AND date >= $2
  `;
  const params = [fromDate, toISO];
  
  if (!includeEmpty) {
    query += ` AND content IS NOT NULL AND content != ''`;
  }
  
  query += ` ORDER BY date DESC`;
  
  const result = await db.select<{date: string}[]>(query, params);
  return result.map(r => r.date);
}

export async function countJournalsOlderThan(date: string): Promise<number> {
  if (!db) throw new Error('Database not initialized');
  
  const result = await db.select<{count: number}[]>(
    `SELECT COUNT(*) as count FROM journal WHERE date < $1`,
    [date]
  );
  
  return result[0]?.count || 0;
}

export async function getOldestJournalDate(): Promise<string | null> {
  if (!db) throw new Error('Database not initialized');
  
  const result = await db.select<{date: string}[]>(
    `SELECT date FROM journal WHERE content IS NOT NULL AND content != '' ORDER BY date ASC LIMIT 1`
  );
  
  return result[0]?.date || null;
}
