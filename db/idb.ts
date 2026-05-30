// ─── Supabase-backed snapshot store ────────────────────────────────────────
// Drop-in replacement for the previous IndexedDB module.
// - Loads full snapshot from Supabase once on startup (in-memory cache).
// - updateSnapshot(updater): computes new snapshot, diffs against prev,
//   pushes per-row inserts/updates/deletes to Supabase.
// - Single-user, no auth. RLS policies permit anon write.

import type {
  Countdown,
  DayEntry,
  DayIntention,
  Habit,
  HabitLog,
  MetricDefinition,
  MetricLog,
  MonthConfig,
  MorningLog,
  MorningRoutineItem,
  PersonalSetup,
  StickyReminder,
  UserSettings,
} from './schema';
import { supabase } from './supabase';

export type DatabaseSnapshot = {
  habits: Habit[];
  dayEntries: DayEntry[];
  habitLogs: HabitLog[];
  metricDefinitions: MetricDefinition[];
  metricLogs: MetricLog[];
  monthConfig: MonthConfig[];
  personalSetups: PersonalSetup[];
  stickyReminders: StickyReminder[];
  countdowns: Countdown[];
  userSettings: UserSettings[];
  morningRoutineItems: MorningRoutineItem[];
  morningLogs: MorningLog[];
  dayIntentions: DayIntention[];
};

const emptySnapshot = (): DatabaseSnapshot => ({
  habits: [],
  dayEntries: [],
  habitLogs: [],
  metricDefinitions: [],
  metricLogs: [],
  monthConfig: [],
  personalSetups: [],
  stickyReminders: [],
  countdowns: [],
  userSettings: [],
  morningRoutineItems: [],
  morningLogs: [],
  dayIntentions: [],
});

let memoryCache: DatabaseSnapshot | null = null;
let initPromise: Promise<DatabaseSnapshot> | null = null;

// ─── Row mappers (camelCase ↔ snake_case) ──────────────────────────────────
function habitFromRow(r: any): Habit {
  return { id: r.id, year: r.year, month: r.month, name: r.name, color: r.color, type: r.type, sortOrder: r.sort_order ?? 0, deletedAt: r.deleted_at ?? null };
}
function habitToRow(h: Habit): any {
  return { id: h.id, year: h.year, month: h.month, name: h.name, color: h.color, type: h.type, sort_order: h.sortOrder, deleted_at: h.deletedAt };
}

function dayEntryFromRow(r: any): DayEntry {
  return { id: r.id, date: r.date, memorableMoment: r.memorable_moment, dayReminder: r.day_reminder, sleepHours: r.sleep_hours, sleepScore: r.sleep_score };
}
function dayEntryToRow(d: DayEntry): any {
  return { id: d.id, date: d.date, memorable_moment: d.memorableMoment, day_reminder: d.dayReminder, sleep_hours: d.sleepHours, sleep_score: d.sleepScore };
}

function habitLogFromRow(r: any): HabitLog {
  return { id: r.id, dayEntryId: r.day_entry_id, habitId: r.habit_id, value: r.value, note: r.note ?? null };
}
function habitLogToRow(l: HabitLog): any {
  return { id: l.id, day_entry_id: l.dayEntryId, habit_id: l.habitId, value: l.value, note: l.note };
}

function metricDefFromRow(r: any): MetricDefinition {
  return { id: r.id, name: r.name, scale: r.scale, minVal: Number(r.min_val), maxVal: Number(r.max_val), sortOrder: r.sort_order ?? 0 };
}
function metricDefToRow(m: MetricDefinition): any {
  return { id: m.id, name: m.name, scale: m.scale, min_val: m.minVal, max_val: m.maxVal, sort_order: m.sortOrder };
}

function metricLogFromRow(r: any): MetricLog {
  return { id: r.id, dayEntryId: r.day_entry_id, metricId: r.metric_id, value: Number(r.value) };
}
function metricLogToRow(l: MetricLog): any {
  return { id: l.id, day_entry_id: l.dayEntryId, metric_id: l.metricId, value: l.value };
}

function monthConfigFromRow(r: any): MonthConfig {
  return { id: r.id, year: r.year, month: r.month, nextMonthIdeas: r.next_month_ideas, reminderMessage: r.reminder_message, hyperFocus: r.hyper_focus };
}
function monthConfigToRow(c: MonthConfig): any {
  return { id: c.id, year: c.year, month: c.month, next_month_ideas: c.nextMonthIdeas, reminder_message: c.reminderMessage, hyper_focus: c.hyperFocus };
}

function personalSetupFromRow(r: any): PersonalSetup {
  return { id: r.id, type: r.type, text: r.text, sortOrder: r.sort_order ?? 0, createdAt: r.created_at ?? new Date().toISOString(), targetDate: r.target_date, status: r.status ?? 'active', goalHorizon: r.goal_horizon ?? null };
}
function personalSetupToRow(p: PersonalSetup): any {
  return { id: p.id, type: p.type, text: p.text, sort_order: p.sortOrder, target_date: p.targetDate, status: p.status, goal_horizon: p.goalHorizon };
}

function stickyReminderFromRow(r: any): StickyReminder {
  return { id: r.id, text: r.text, topic: r.topic, addedDate: r.added_date, dueDate: r.due_date, completed: !!r.completed, sortOrder: r.sort_order ?? 0, createdAt: r.created_at ?? new Date().toISOString() };
}
function stickyReminderToRow(s: StickyReminder): any {
  return { id: s.id, text: s.text, topic: s.topic, added_date: s.addedDate, due_date: s.dueDate, completed: s.completed, sort_order: s.sortOrder };
}

function countdownFromRow(r: any): Countdown {
  return { id: r.id, label: r.label, targetDate: r.target_date, icon: r.icon, sortOrder: r.sort_order ?? 0, createdAt: r.created_at ?? new Date().toISOString() };
}
function countdownToRow(c: Countdown): any {
  return { id: c.id, label: c.label, target_date: c.targetDate, icon: c.icon, sort_order: c.sortOrder };
}

function userSettingsFromRow(r: any): UserSettings {
  return { id: r.id, toneKey: r.tone_key, density: r.density, aesthetic: r.aesthetic, followSystem: !!r.follow_system, updatedAt: r.updated_at ?? new Date().toISOString() };
}
function userSettingsToRow(s: UserSettings): any {
  return { id: s.id, tone_key: s.toneKey, density: s.density, aesthetic: s.aesthetic, follow_system: s.followSystem, updated_at: new Date().toISOString() };
}

function morningRoutineItemFromRow(r: any): MorningRoutineItem {
  return { id: r.id, text: r.text, sortOrder: r.sort_order ?? 0, active: !!r.active, createdAt: r.created_at ?? new Date().toISOString() };
}
function morningRoutineItemToRow(m: MorningRoutineItem): any {
  return { id: m.id, text: m.text, sort_order: m.sortOrder, active: m.active };
}

function morningLogFromRow(r: any): MorningLog {
  return { id: r.id, date: r.date, itemId: r.item_id, completed: !!r.completed };
}
function morningLogToRow(l: MorningLog): any {
  return { id: l.id, date: l.date, item_id: l.itemId, completed: l.completed };
}

function dayIntentionFromRow(r: any): DayIntention {
  return { id: r.id, date: r.date, intention: r.intention, updatedAt: r.updated_at ?? new Date().toISOString() };
}
function dayIntentionToRow(d: DayIntention): any {
  return { id: d.id, date: d.date, intention: d.intention, updated_at: new Date().toISOString() };
}

// ─── Initial fetch ─────────────────────────────────────────────────────────
async function fetchSnapshot(): Promise<DatabaseSnapshot> {
  const [
    habitsR, dayEntriesR, habitLogsR, metricDefsR, metricLogsR, monthConfigR, personalSetupsR,
    stickyR, countdownsR, userSettingsR, morningItemsR, morningLogsR, dayIntentionsR,
  ] = await Promise.all([
    supabase.from('habits').select('*'),
    supabase.from('day_entries').select('*'),
    supabase.from('habit_logs').select('*'),
    supabase.from('metric_definitions').select('*'),
    supabase.from('metric_logs').select('*'),
    supabase.from('month_config').select('*'),
    supabase.from('personal_setups').select('*'),
    supabase.from('sticky_reminders').select('*'),
    supabase.from('countdowns').select('*'),
    supabase.from('user_settings').select('*'),
    supabase.from('morning_routine_items').select('*'),
    supabase.from('morning_logs').select('*'),
    supabase.from('day_intentions').select('*'),
  ]);

  for (const r of [habitsR, dayEntriesR, habitLogsR, metricDefsR, metricLogsR, monthConfigR, personalSetupsR, stickyR, countdownsR, userSettingsR, morningItemsR, morningLogsR, dayIntentionsR]) {
    if (r.error) console.error('Supabase fetch error:', r.error);
  }

  return {
    habits:              (habitsR.data         ?? []).map(habitFromRow),
    dayEntries:          (dayEntriesR.data     ?? []).map(dayEntryFromRow),
    habitLogs:           (habitLogsR.data      ?? []).map(habitLogFromRow),
    metricDefinitions:   (metricDefsR.data     ?? []).map(metricDefFromRow),
    metricLogs:          (metricLogsR.data     ?? []).map(metricLogFromRow),
    monthConfig:         (monthConfigR.data    ?? []).map(monthConfigFromRow),
    personalSetups:      (personalSetupsR.data ?? []).map(personalSetupFromRow),
    stickyReminders:     (stickyR.data         ?? []).map(stickyReminderFromRow),
    countdowns:          (countdownsR.data     ?? []).map(countdownFromRow),
    userSettings:        (userSettingsR.data   ?? []).map(userSettingsFromRow),
    morningRoutineItems: (morningItemsR.data   ?? []).map(morningRoutineItemFromRow),
    morningLogs:         (morningLogsR.data    ?? []).map(morningLogFromRow),
    dayIntentions:       (dayIntentionsR.data  ?? []).map(dayIntentionFromRow),
  };
}

// ─── Diff-sync ─────────────────────────────────────────────────────────────
async function syncTable<T extends { id: string }>(
  tableName: string,
  prev: T[],
  next: T[],
  toRow: (item: T) => any,
): Promise<void> {
  const prevMap = new Map(prev.map((r) => [r.id, r]));
  const nextMap = new Map(next.map((r) => [r.id, r]));

  const toUpsert: T[] = [];
  const toDelete: string[] = [];

  for (const [id, item] of nextMap) {
    const prevItem = prevMap.get(id);
    if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(item)) {
      toUpsert.push(item);
    }
  }
  for (const id of prevMap.keys()) {
    if (!nextMap.has(id)) toDelete.push(id);
  }

  if (toUpsert.length > 0) {
    const { error } = await supabase.from(tableName).upsert(toUpsert.map(toRow));
    if (error) console.error(`Supabase upsert error on ${tableName}:`, error);
  }
  if (toDelete.length > 0) {
    const { error } = await supabase.from(tableName).delete().in('id', toDelete);
    if (error) console.error(`Supabase delete error on ${tableName}:`, error);
  }
}

async function syncSnapshot(prev: DatabaseSnapshot, next: DatabaseSnapshot): Promise<void> {
  // Order matters: parent tables first (day_entries before habit_logs), child deletes via CASCADE
  await syncTable('day_entries',          prev.dayEntries,          next.dayEntries,          dayEntryToRow);
  await syncTable('habits',               prev.habits,              next.habits,              habitToRow);
  await syncTable('metric_definitions',   prev.metricDefinitions,   next.metricDefinitions,   metricDefToRow);
  await syncTable('habit_logs',           prev.habitLogs,           next.habitLogs,           habitLogToRow);
  await syncTable('metric_logs',          prev.metricLogs,          next.metricLogs,          metricLogToRow);
  await syncTable('month_config',         prev.monthConfig,         next.monthConfig,         monthConfigToRow);
  await syncTable('personal_setups',      prev.personalSetups,      next.personalSetups,      personalSetupToRow);
  await syncTable('sticky_reminders',     prev.stickyReminders,     next.stickyReminders,     stickyReminderToRow);
  await syncTable('countdowns',           prev.countdowns,          next.countdowns,          countdownToRow);
  await syncTable('user_settings',        prev.userSettings,        next.userSettings,        userSettingsToRow);
  await syncTable('morning_routine_items',prev.morningRoutineItems, next.morningRoutineItems, morningRoutineItemToRow);
  await syncTable('morning_logs',         prev.morningLogs,         next.morningLogs,         morningLogToRow);
  await syncTable('day_intentions',       prev.dayIntentions,       next.dayIntentions,       dayIntentionToRow);
}

// ─── Public API ────────────────────────────────────────────────────────────
async function readSnapshot(): Promise<DatabaseSnapshot> {
  if (memoryCache) return memoryCache;
  if (initPromise) return initPromise;

  initPromise = fetchSnapshot()
    .then((s) => { memoryCache = s; return s; })
    .catch((e) => { console.error('Snapshot init failed:', e); memoryCache = emptySnapshot(); return memoryCache; });

  return initPromise;
}

export async function initIdb(): Promise<void> {
  await readSnapshot();
}

export async function getSnapshot(): Promise<DatabaseSnapshot> {
  return readSnapshot();
}

export async function updateSnapshot(
  updater: (snapshot: DatabaseSnapshot) => DatabaseSnapshot
): Promise<DatabaseSnapshot> {
  const current = await readSnapshot();
  const next = updater(JSON.parse(JSON.stringify(current)) as DatabaseSnapshot);
  memoryCache = next;
  syncSnapshot(current, next).catch((e) => console.error('Supabase sync failed:', e));
  return next;
}

export async function replaceSnapshot(snapshot: DatabaseSnapshot): Promise<void> {
  const current = await readSnapshot();
  memoryCache = { ...emptySnapshot(), ...snapshot };
  syncSnapshot(current, memoryCache).catch((e) => console.error('Supabase replace failed:', e));
}
