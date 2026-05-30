import type { HabitColor, HabitType } from '@/constants/theme';
import { generateId, toDateKey } from '@/utils/dates';

import { getSnapshot, replaceSnapshot, updateSnapshot } from './idb';
import type {
  Countdown,
  DayEntry,
  DayIntention,
  GoalHorizon,
  Habit,
  HabitLog,
  MetricDefinition,
  MetricLog,
  MonthConfig,
  MorningLog,
  MorningRoutineItem,
  PersonalSetup,
  PersonalSetupType,
  StickyReminder,
  UserSettings,
} from './schema';

/**
 * Returns all habits for a month, including soft-deleted ones that had activity
 * during this month (needed for month-view history).
 * Use `isHabitActiveOn` to determine interactivity per-day.
 */
export async function getHabitsForMonth(year: number, month: number): Promise<Habit[]> {
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const snapshot = await getSnapshot();
  return snapshot.habits
    .filter((h) => {
      if (h.year !== year || h.month !== month) return false;
      // Include active habits AND habits deleted AFTER the month started (history)
      return h.deletedAt === null || h.deletedAt > monthStart;
    })
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
    deletedAt: null,
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

/**
 * Soft-delete a habit: sets deletedAt = today.
 * - Today and future days: habit no longer appears in daily view.
 * - Past days (logs before today): kept as read-only history.
 * - Logs with no value for today+ could be cleaned up later, but for safety
 *   we keep all logs (they'll be filtered in UI by date).
 */
export async function deleteHabit(id: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  await updateSnapshot((s) => ({
    ...s,
    habits: s.habits.map((h) => h.id === id ? { ...h, deletedAt: today } : h),
    // Remove habit logs from today onwards that have NO value (no meaningful data)
    // Logs from past days (before today) are kept as history.
    // We can't check date from HabitLog directly, so we take a conservative approach:
    // keep ALL logs — UI filters by date.
  }));
}

/** Returns true if a habit was active on the given dateKey (YYYY-MM-DD). */
export function isHabitActiveOn(habit: Habit, dateKey: string): boolean {
  if (habit.deletedAt === null) return true;
  // deletedAt is the first day the habit is INACTIVE
  return dateKey < habit.deletedAt;
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
  opts: { targetDate?: string | null; goalHorizon?: GoalHorizon | null } = {},
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
    goalHorizon: opts.goalHorizon ?? null,
  };
  await updateSnapshot((s) => ({ ...s, personalSetups: [...s.personalSetups, setup] }));
  return setup;
}

export async function updatePersonalSetup(
  id: string,
  data: Partial<Pick<PersonalSetup, 'text' | 'targetDate' | 'status' | 'sortOrder' | 'goalHorizon'>>,
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
  stickyReminders?: StickyReminder[];
  countdowns?: Countdown[];
  userSettings?: UserSettings[];
  morningRoutineItems?: MorningRoutineItem[];
  morningLogs?: MorningLog[];
  dayIntentions?: DayIntention[];
}) {
  await replaceSnapshot({
    habits: (data.habits ?? []).map((h) => ({ ...h, deletedAt: h.deletedAt ?? null })),
    dayEntries: data.dayEntries ?? [],
    habitLogs: (data.habitLogs ?? []).map((l) => ({ ...l, note: l.note ?? null })),
    metricDefinitions: data.metricDefinitions ?? [],
    metricLogs: data.metricLogs ?? [],
    monthConfig: data.monthConfig ?? [],
    personalSetups: (data.personalSetups ?? []).map((p) => ({ ...p, goalHorizon: p.goalHorizon ?? null })),
    stickyReminders: data.stickyReminders ?? [],
    countdowns: data.countdowns ?? [],
    userSettings: data.userSettings ?? [],
    morningRoutineItems: data.morningRoutineItems ?? [],
    morningLogs: data.morningLogs ?? [],
    dayIntentions: data.dayIntentions ?? [],
  });
}

// ─── Sticky Reminders CRUD ─────────────────────────────────────────────────
export async function getStickyReminders(): Promise<StickyReminder[]> {
  const s = await getSnapshot();
  return [...s.stickyReminders].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.sortOrder - b.sortOrder;
  });
}

export async function addStickyReminder(text: string, topic: string | null = null, dueDate: string | null = null): Promise<StickyReminder> {
  const existing = await getStickyReminders();
  const r: StickyReminder = {
    id: generateId(),
    text, topic, dueDate,
    addedDate: new Date().toISOString().slice(0, 10),
    completed: false,
    sortOrder: existing.length,
    createdAt: new Date().toISOString(),
  };
  await updateSnapshot((s) => ({ ...s, stickyReminders: [...s.stickyReminders, r] }));
  return r;
}

export async function updateStickyReminder(id: string, data: Partial<Pick<StickyReminder, 'text' | 'topic' | 'dueDate' | 'completed' | 'sortOrder'>>): Promise<void> {
  await updateSnapshot((s) => ({
    ...s,
    stickyReminders: s.stickyReminders.map((r) => (r.id === id ? { ...r, ...data } : r)),
  }));
}

export async function deleteStickyReminder(id: string): Promise<void> {
  await updateSnapshot((s) => ({ ...s, stickyReminders: s.stickyReminders.filter((r) => r.id !== id) }));
}

// ─── Countdowns CRUD ───────────────────────────────────────────────────────
export async function getCountdowns(): Promise<Countdown[]> {
  const s = await getSnapshot();
  return [...s.countdowns].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function addCountdown(label: string, targetDate: string, icon: string | null = null): Promise<Countdown> {
  const existing = await getCountdowns();
  const c: Countdown = {
    id: generateId(),
    label, targetDate, icon,
    sortOrder: existing.length,
    createdAt: new Date().toISOString(),
  };
  await updateSnapshot((s) => ({ ...s, countdowns: [...s.countdowns, c] }));
  return c;
}

export async function updateCountdown(id: string, data: Partial<Pick<Countdown, 'label' | 'targetDate' | 'icon' | 'sortOrder'>>): Promise<void> {
  await updateSnapshot((s) => ({
    ...s,
    countdowns: s.countdowns.map((c) => (c.id === id ? { ...c, ...data } : c)),
  }));
}

export async function deleteCountdown(id: string): Promise<void> {
  await updateSnapshot((s) => ({ ...s, countdowns: s.countdowns.filter((c) => c.id !== id) }));
}

// ─── User Settings (single-row) ────────────────────────────────────────────
export async function getUserSettings(): Promise<UserSettings | null> {
  const s = await getSnapshot();
  return s.userSettings.find((u) => u.id === 'singleton') ?? null;
}

export async function upsertUserSettings(data: Partial<Omit<UserSettings, 'id' | 'updatedAt'>>): Promise<UserSettings> {
  const existing = await getUserSettings();
  const next: UserSettings = {
    id: 'singleton',
    toneKey: data.toneKey ?? existing?.toneKey ?? 'cream',
    density: data.density ?? existing?.density ?? 'relaxed',
    aesthetic: data.aesthetic ?? existing?.aesthetic ?? 'grid',
    followSystem: data.followSystem ?? existing?.followSystem ?? true,
    updatedAt: new Date().toISOString(),
  };
  await updateSnapshot((s) => ({
    ...s,
    userSettings: existing
      ? s.userSettings.map((u) => (u.id === 'singleton' ? next : u))
      : [...s.userSettings, next],
  }));
  return next;
}

// ─── Morning Routine ───────────────────────────────────────────────────────
export async function getMorningRoutineItems(activeOnly = false): Promise<MorningRoutineItem[]> {
  const s = await getSnapshot();
  const items = [...s.morningRoutineItems].sort((a, b) => a.sortOrder - b.sortOrder);
  return activeOnly ? items.filter((i) => i.active) : items;
}

export async function addMorningRoutineItem(text: string): Promise<MorningRoutineItem> {
  const existing = await getMorningRoutineItems();
  const item: MorningRoutineItem = {
    id: generateId(),
    text, active: true,
    sortOrder: existing.length,
    createdAt: new Date().toISOString(),
  };
  await updateSnapshot((s) => ({ ...s, morningRoutineItems: [...s.morningRoutineItems, item] }));
  return item;
}

export async function updateMorningRoutineItem(id: string, data: Partial<Pick<MorningRoutineItem, 'text' | 'active' | 'sortOrder'>>): Promise<void> {
  await updateSnapshot((s) => ({
    ...s,
    morningRoutineItems: s.morningRoutineItems.map((i) => (i.id === id ? { ...i, ...data } : i)),
  }));
}

export async function deleteMorningRoutineItem(id: string): Promise<void> {
  await updateSnapshot((s) => ({
    ...s,
    morningRoutineItems: s.morningRoutineItems.filter((i) => i.id !== id),
    morningLogs: s.morningLogs.filter((l) => l.itemId !== id),
  }));
}

export async function getMorningLogs(date: string): Promise<MorningLog[]> {
  const s = await getSnapshot();
  return s.morningLogs.filter((l) => l.date === date);
}

export async function toggleMorningLog(date: string, itemId: string): Promise<void> {
  await updateSnapshot((s) => {
    const existing = s.morningLogs.find((l) => l.date === date && l.itemId === itemId);
    if (existing) {
      return {
        ...s,
        morningLogs: s.morningLogs.map((l) =>
          l.id === existing.id ? { ...l, completed: !l.completed } : l
        ),
      };
    }
    return {
      ...s,
      morningLogs: [...s.morningLogs, { id: generateId(), date, itemId, completed: true }],
    };
  });
}

// ─── Day Intentions ────────────────────────────────────────────────────────
export async function getDayIntention(date: string): Promise<DayIntention | null> {
  const s = await getSnapshot();
  return s.dayIntentions.find((d) => d.date === date) ?? null;
}

export async function setDayIntention(date: string, intention: string | null): Promise<void> {
  await updateSnapshot((s) => {
    const existing = s.dayIntentions.find((d) => d.date === date);
    const next: DayIntention = {
      id: existing?.id ?? generateId(),
      date,
      intention: intention?.trim() || null,
      updatedAt: new Date().toISOString(),
    };
    return {
      ...s,
      dayIntentions: existing
        ? s.dayIntentions.map((d) => (d.id === existing.id ? next : d))
        : [...s.dayIntentions, next],
    };
  });
}

// ─── Metric Definition (update + reorder) ──────────────────────────────────
export async function updateMetricDefinition(id: string, data: Partial<Pick<MetricDefinition, 'name' | 'scale' | 'minVal' | 'maxVal' | 'sortOrder'>>): Promise<void> {
  await updateSnapshot((s) => ({
    ...s,
    metricDefinitions: s.metricDefinitions.map((m) => (m.id === id ? { ...m, ...data } : m)),
  }));
}
