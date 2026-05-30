import { useCallback, useEffect, useState } from 'react';

import { useDatabase } from '@/contexts/DatabaseContext';
import {
  deleteHabitLog,
  getDayEntryByDate,
  getHabitLogsForDay,
  getMetricLogsForDay,
  getOrCreateDayEntry,
  updateDayEntry,
  upsertHabitLog,
  upsertMetricLog,
} from '@/db/operations';
import type { DayEntry, HabitLog, MetricLog } from '@/db/schema';
import { toDateKey } from '@/utils/dates';

export function useDayEntry(date: Date) {
  const { refreshKey, refresh } = useDatabase();
  const [entry, setEntry] = useState<DayEntry | null>(null);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [metricLogs, setMetricLogs] = useState<MetricLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Use stable string key (not the Date object) as dep — callers often pass `new Date()`
  // which creates a new reference every render, causing load to be recreated infinitely.
  const dateKeyStable = toDateKey(date);

  const load = useCallback(async () => {
    setLoading(true);
    const existing = await getDayEntryByDate(date);
    if (existing) {
      setEntry(existing);
      const [hLogs, mLogs] = await Promise.all([
        getHabitLogsForDay(existing.id),
        getMetricLogsForDay(existing.id),
      ]);
      setHabitLogs(hLogs);
      setMetricLogs(mLogs);
    } else {
      setEntry(null);
      setHabitLogs([]);
      setMetricLogs([]);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKeyStable, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  const ensureEntry = useCallback(async () => {
    const e = await getOrCreateDayEntry(date);
    setEntry(e);
    return e;
  }, [date]);

  const saveDayReminder = useCallback(
    async (text: string) => {
      const e = await ensureEntry();
      await updateDayEntry(e.id, { dayReminder: text || null });
      refresh();
    },
    [ensureEntry, refresh]
  );

  const saveMemorableMoment = useCallback(
    async (text: string) => {
      const e = await ensureEntry();
      await updateDayEntry(e.id, { memorableMoment: text || null });
      refresh();
    },
    [ensureEntry, refresh]
  );

  const saveSleep = useCallback(
    async (hours: number | null, score: number | null) => {
      const e = await ensureEntry();
      await updateDayEntry(e.id, { sleepHours: hours, sleepScore: score });
      refresh();
    },
    [ensureEntry, refresh]
  );

  const toggleHabit = useCallback(
    async (habitId: string, currentValue?: string) => {
      const e = await ensureEntry();
      if (currentValue === 'true') {
        await deleteHabitLog(e.id, habitId);
      } else {
        await upsertHabitLog(e.id, habitId, 'true');
      }
      refresh();
    },
    [ensureEntry, refresh]
  );

  const setNumericHabit = useCallback(
    async (habitId: string, value: string) => {
      const e = await ensureEntry();
      if (!value.trim()) {
        await deleteHabitLog(e.id, habitId);
      } else {
        await upsertHabitLog(e.id, habitId, value);
      }
      refresh();
    },
    [ensureEntry, refresh]
  );

  const setMetric = useCallback(
    async (metricId: string, value: number) => {
      const e = await ensureEntry();
      await upsertMetricLog(e.id, metricId, value);
      refresh();
    },
    [ensureEntry, refresh]
  );

  const isComplete = entry !== null && (entry.memorableMoment || habitLogs.length > 0 || entry.sleepHours != null);

  return {
    entry,
    habitLogs,
    metricLogs,
    loading,
    isComplete,
    saveMemorableMoment,
    saveDayReminder,
    saveSleep,
    toggleHabit,
    setNumericHabit,
    setMetric,
    dateKey: toDateKey(date),
    reload: load,
  };
}
