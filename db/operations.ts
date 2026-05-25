import type { HabitColor, HabitType } from '@/constants/theme';
import { generateId, toDateKey } from '@/utils/dates';

import { getSnapshot, replaceSnapshot, updateSnapshot } from './idb';
import type {
  DayEntry,
  Habit,
  HabitLog,
  MetricDefinition,
  MetricLog,
  MonthConfig,
  PersonalSetup,
  PersonalSetupType,
} from './schema';

export async function getHabitsForMonth(year: number, month: number): Promise<Habit[]> {
  const snapshot = await getSnapshot();
  return snapshot.habits
    .filter((h) => h.year === year && h.month === month)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createHabit(data: {
  year: number;
  month: number;
  name: string;
  color: HabitColor;
  type: HabitType;
  sortOrder?: number;
}): Promise<Habit> {
  const habit: Habit = {
    id: generateId(),
    year: data.year,
    month: data.month,
    name: data.name,
    color: data.color,
    type: data.type,
    sortOrder: data.sortOrder ?? 0,
  };
  await updateSnapshot((s) => ({ ...s, habits: [...s.habits, habit] }));
  return habit;
}

export async function updateHabit(
  id: string,
  data: Partial<{ name: string; color: HabitColor; type: HabitType; sortOrder: number }>
): Promise<void> {
  await updateSnapshot((s) => ({
    ...s,
    habits: s.habits.map((h) => (h.id === id ? { ...h, ...data } : h)),
  }));
}

export async function deleteHabit(id: string): Promise<void> {
  await updateSnapshot((s) => ({
    ...s,
    habits: s.habits.filter((h) => h.id !== id),
    habitLogs: s.habitLogs.filter((l) => l.habitId !== id),
  }));
}

export async function getOrCreateDayEntry(date: Date): Promise<DayEntry> {
  const dateKey = toDateKey(date);
  const snapshot = await getSnapshot();
  const existing = snapshot.dayEntries.find((e) => e.date === dateKey);
  if (existing) return existing;

  const entry: DayEntry = {
    id: generateId(),
    date: dateKey,
    memorableMoment: null,
    dayReminder: null,
    sleepHours: null,
    sleepScore: null,
  };
  await updateSnapshot((s) => ({ ...s, dayEntries: [...s.dayEntries, entry] }));
  return entry;
}

export async function getDayEntryByDate(date: Date): Promise<DayEntry | null> {
  const dateKey = toDateKey(date);
  const snapshot = await getSnapshot();
  return snapshot.dayEntries.find((e) => e.date === dateKey) ?? null;
}

export async function updateDayEntry(
  id: string,
  data: Partial<{
    memorableMoment: string | null;
    dayReminder: string | null;
    sleepHours: number | null;
    sleepScore: number | null;
  }>
): Promise<void> {
  await updateSnapshot((s) => ({
    ...s,
    dayEntries: s.dayEntries.map((e) => (e.id === id ? { ...e, ...data } : e)),
  }));
}

export async function getDayEntriesInMonth(year: number, month: number): Promise<DayEntry[]> {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = `${year}-${String(month).padStart(2, '0')}-31`;
  const snapshot = await getSnapshot();
  return snapshot.dayEntries
    .filter((e) => e.date >= start && e.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getHabitLogsForDay(dayEntryId: string): Promise<HabitLog[]> {
  const snapshot = await getSnapshot();
  return snapshot.habitLogs.filter((l) => l.dayEntryId === dayEntryId);
}

export async function upsertHabitLog(dayEntryId: string, habitId: string, value: string): Promise<void> {
  await updateSnapshot((s) => {
    const existing = s.habitLogs.find((l) => l.dayEntryId === dayEntryId && l.habitId === habitId);
    if (existing) {
      return {
        ...s,
        habitLogs: s.habitLogs.map((l) => (l.id === existing.id ? { ...l, value } : l)),
      };
    }
    return {
      ...s,
      habitLogs: [...s.habitLogs, { id: generateId(), dayEntryId, habitId, value, note: null }],
    };
  });
}

/** Set or clear the optional per-day-per-habit note. Creates a HabitLog if needed. */
export async function setHabitLogNote(dayEntryId: string, habitId: string, note: string | null): Promise<void> {
  await updateSnapshot((s) => {
    const existing = s.habitLogs.find((l) => l.dayEntryId === dayEntryId && l.habitId === habitId);
    if (existing) {
      return {
        ...s,
        habitLogs: s.habitLogs.map((l) => (l.id === existing.id ? { ...l, note: note || null } : l)),
      };
    }
    // Create a log with empty value but a note; value '' is acceptable so the log exists
    return {
      ...s,
      habitLogs: [...s.habitLogs, { id: generateId(), dayEntryId, habitId, value: '', note: note || null }],
    };
  });
}

export async function deleteHabitLog(dayEntryId: string, habitId: string): Promise<void> {
  await updateSnapshot((s) => ({
    ...s,
    habitLogs: s.habitLogs.filter((l) => !(l.dayEntryId === dayEntryId && l.habitId === habitId)),
  }));
}

export async function getHabitLogsForMonth(year: number, month: number): Promise<(HabitLog & { date: string })[]> {
  const entries = await getDayEntriesInMonth(year, month);
  const snapshot = await getSnapshot();
  const results: (HabitLog & { date: string })[] = [];

  for (const entry of entries) {
    for (const log of snapshot.habitLogs.filter((l) => l.dayEntryId === entry.id)) {
      results.push({ ...log, date: entry.date });
    }
  }
  return results;
}

export async function getMetricDefinitions(): Promise<MetricDefinition[]> {
  const snapshot = await getSnapshot();
  return [...snapshot.metricDefinitions].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createMetricDefinition(data: {
  name: string;
  scale?: 'integer' | 'float';
  minVal?: number;
  maxVal?: number;
}): Promise<MetricDefinition> {
  const existing = await getMetricDefinitions();
  const metric: MetricDefinition = {
    id: generateId(),
    name: data.name,
    scale: data.scale ?? 'integer',
    minVal: data.minVal ?? 1,
    maxVal: data.maxVal ?? 10,
    sortOrder: existing.length,
  };
  await updateSnapshot((s) => ({ ...s, metricDefinitions: [...s.metricDefinitions, metric] }));
  return metric;
}

export async function deleteMetricDefinition(id: string): Promise<void> {
  await updateSnapshot((s) => ({
    ...s,
    metricDefinitions: s.metricDefinitions.filter((m) => m.id !== id),
    metricLogs: s.metricLogs.filter((l) => l.metricId !== id),
  }));
}

export async function getMetricLogsForDay(dayEntryId: string): Promise<MetricLog[]> {
  const snapshot = await getSnapshot();
  return snapshot.metricLogs.filter((l) => l.dayEntryId === dayEntryId);
}

export async function upsertMetricLog(dayEntryId: string, metricId: string, value: number): Promise<void> {
  await updateSnapshot((s) => {
    const existing = s.metricLogs.find((l) => l.dayEntryId === dayEntryId && l.metricId === metricId);
    if (existing) {
      return {
        ...s,
        metricLogs: s.metricLogs.map((l) => (l.id === existing.id ? { ...l, value } : l)),
      };
    }
    return {
      ...s,
      metricLogs: [...s.metricLogs, { id: generateId(), dayEntryId, metricId, value }],
    };
  });
}

export async function getMetricLogsForMonth(
  year: number,
  month: number
): Promise<(MetricLog & { date: string })[]> {
  const entries = await getDayEntriesInMonth(year, month);
  const snapshot = await getSnapshot();
  const results: (MetricLog & { date: string })[] = [];

  for (const entry of entries) {
    for (const log of snapshot.metricLogs.filter((l) => l.dayEntryId === entry.id)) {
      results.push({ ...log, date: entry.date });
    }
  }
  return results;
}

export async function getMonthConfig(year: number, month: number): Promise<MonthConfig | null> {
  const snapshot = await getSnapshot();
  return snapshot.monthConfig.find((c) => c.year === year && c.month === month) ?? null;
}

export async function upsertMonthConfig(
  year: number,
  month: number,
  data: { nextMonthIdeas?: string | null; reminderMessage?: string | null; hyperFocus?: string | null }
): Promise<MonthConfig> {
  const existing = await getMonthConfig(year, month);
  if (existing) {
    const updated = { ...existing, ...data };
    await updateSnapshot((s) => ({
      ...s,
      monthConfig: s.monthConfig.map((c) => (c.id === existing.id ? updated : c)),
    }));
    return updated;
  }

  const config: MonthConfig = {
    id: generateId(),
    year,
    month,
    nextMonthIdeas: data.nextMonthIdeas ?? null,
    reminderMessage: data.reminderMessage ?? null,
    hyperFocus: data.hyperFocus ?? null,
  };
  await updateSnapshot((s) => ({ ...s, monthConfig: [...s.monthConfig, config] }));
  return config;
}

// ─── PersonalSetup CRUD (Sprint 1: My Foundation) ─────────────────────────
export async function getPersonalSetups(type?: PersonalSetupType): Promise<PersonalSetup[]> {
  const snapshot = await getSnapshot();
  const all = [...snapshot.personalSetups].sort((a, b) => a.sortOrder - b.sortOrder);
  return type ? all.filter((p) => p.type === type) : all;
}

export async function addPersonalSetup(
  type: PersonalSetupType,
  text: string,
  opts: { targetDate?: string | null } = {},
): Promise<PersonalSetup> {
  const existing = await getPersonalSetups(type);
  const setup: PersonalSetup = {
    id: generateId(),
    type,
    text,
    sortOrder: existing.length,
    createdAt: new Date().toISOString(),
    targetDate: opts.targetDate ?? null,
    status: 'active',
  };
  await updateSnapshot((s) => ({ ...s, personalSetups: [...s.personalSetups, setup] }));
  return setup;
}

export async function updatePersonalSetup(
  id: string,
  data: Partial<Pick<PersonalSetup, 'text' | 'targetDate' | 'status' | 'sortOrder'>>,
): Promise<void> {
  await updateSnapshot((s) => ({
    ...s,
    personalSetups: s.personalSetups.map((p) => (p.id === id ? { ...p, ...data } : p)),
  }));
}

export async function deletePersonalSetup(id: string): Promise<void> {
  await updateSnapshot((s) => ({
    ...s,
    personalSetups: s.personalSetups.filter((p) => p.id !== id),
  }));
}

// ─── Export / Import ───────────────────────────────────────────────────────
export async function exportAllData() {
  const snapshot = await getSnapshot();
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    habits: snapshot.habits,
    dayEntries: snapshot.dayEntries,
    habitLogs: snapshot.habitLogs,
    metricDefinitions: snapshot.metricDefinitions,
    metricLogs: snapshot.metricLogs,
    monthConfig: snapshot.monthConfig,
    personalSetups: snapshot.personalSetups,
  };
}

export async function importAllData(data: {
  habits?: Habit[];
  dayEntries?: DayEntry[];
  habitLogs?: HabitLog[];
  metricDefinitions?: MetricDefinition[];
  metricLogs?: MetricLog[];
  monthConfig?: MonthConfig[];
  personalSetups?: PersonalSetup[];
}) {
  await replaceSnapshot({
    habits: data.habits ?? [],
    dayEntries: data.dayEntries ?? [],
    habitLogs: (data.habitLogs ?? []).map((l) => ({ ...l, note: l.note ?? null })),
    metricDefinitions: data.metricDefinitions ?? [],
    metricLogs: data.metricLogs ?? [],
    monthConfig: data.monthConfig ?? [],
    personalSetups: data.personalSetups ?? [],
  });
}
