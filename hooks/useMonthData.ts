import { useCallback, useEffect, useState } from 'react';

import { useDatabase } from '@/contexts/DatabaseContext';
import {
  getDayEntriesInMonth,
  getHabitLogsForMonth,
  getHabitsForMonth,
  getMetricLogsForMonth,
  getMonthConfig,
} from '@/db/operations';
import type { DayEntry, Habit, HabitLog, MetricLog, MonthConfig } from '@/db/schema';

export function useMonthData(year: number, month: number) {
  const { refreshKey } = useDatabase();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dayEntries, setDayEntries] = useState<DayEntry[]>([]);
  const [habitLogs, setHabitLogs] = useState<(HabitLog & { date: string })[]>([]);
  const [metricLogs, setMetricLogs] = useState<(MetricLog & { date: string })[]>([]);
  const [config, setConfig] = useState<MonthConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [h, d, hl, ml, c] = await Promise.all([
      getHabitsForMonth(year, month),
      getDayEntriesInMonth(year, month),
      getHabitLogsForMonth(year, month),
      getMetricLogsForMonth(year, month),
      getMonthConfig(year, month),
    ]);
    setHabits(h);
    setDayEntries(d);
    setHabitLogs(hl);
    setMetricLogs(ml);
    setConfig(c);
    setLoading(false);
  }, [year, month, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { habits, dayEntries, habitLogs, metricLogs, config, loading, reload: load };
}
