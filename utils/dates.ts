import {
  addDays,
  addMonths,
  format,
  getDaysInMonth,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
} from 'date-fns';

export function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function fromDateKey(key: string): Date {
  return parseISO(key);
}

export function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function getDaysInMonthCount(year: number, month: number): number {
  return getDaysInMonth(new Date(year, month - 1, 1));
}

export function getMonthDays(year: number, month: number): number[] {
  const count = getDaysInMonthCount(year, month);
  return Array.from({ length: count }, (_, i) => i + 1);
}

export function getDateForDay(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

export function getRitualDefaultDate(now = new Date()): Date {
  return subDays(now, 1);
}

export function isEvening(now = new Date()): boolean {
  return now.getHours() >= 17;
}

export function formatDisplayDate(date: Date): string {
  return format(date, 'EEEE, MMMM d');
}

export function formatMonthYear(year: number, month: number): string {
  return format(new Date(year, month - 1, 1), 'MMMM yyyy');
}

export function shiftMonth(year: number, month: number, delta: number) {
  const next = addMonths(startOfMonth(new Date(year, month - 1, 1)), delta);
  return { year: next.getFullYear(), month: next.getMonth() + 1 };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function startOfToday(now = new Date()): Date {
  return startOfDay(now);
}

export function isToday(date: Date, now = new Date()): boolean {
  return isSameDay(date, now);
}

export function isFutureDate(date: Date, now = new Date()): boolean {
  return isAfter(startOfDay(date), startOfDay(now));
}

export function isPastDate(date: Date, now = new Date()): boolean {
  return isBefore(startOfDay(date), startOfDay(now));
}

export function shiftDay(date: Date, delta: number): Date {
  return addDays(date, delta);
}

export function getDaysAround(center: Date, before = 7, after = 7): Date[] {
  const days: Date[] = [];
  for (let i = -before; i <= after; i++) {
    days.push(addDays(center, i));
  }
  return days;
}

export function formatShortDay(date: Date): string {
  return format(date, 'EEE d');
}

export function formatDayNumber(date: Date): string {
  return format(date, 'd');
}
