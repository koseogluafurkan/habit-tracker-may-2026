import { useCallback, useEffect, useState } from 'react';

import { useDatabase } from '@/contexts/DatabaseContext';
import type { HabitColor, HabitType } from '@/constants/theme';
import {
  createHabit,
  deleteHabit,
  getHabitsForMonth,
  updateHabit,
} from '@/db/operations';
import type { Habit } from '@/db/schema';

export function useHabits(year: number, month: number) {
  const { refreshKey, refresh } = useDatabase();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getHabitsForMonth(year, month);
    setHabits(data);
    setLoading(false);
  }, [year, month, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  const addHabit = useCallback(
    async (name: string, color: HabitColor, type: HabitType) => {
      await createHabit({ year, month, name, color, type, sortOrder: habits.length });
      refresh();
    },
    [year, month, habits.length, refresh]
  );

  const editHabit = useCallback(
    async (id: string, data: Partial<{ name: string; color: HabitColor; type: HabitType }>) => {
      await updateHabit(id, data);
      refresh();
    },
    [refresh]
  );

  const removeHabit = useCallback(
    async (id: string) => {
      await deleteHabit(id);
      refresh();
    },
    [refresh]
  );

  return { habits, loading, addHabit, editHabit, removeHabit, reload: load };
}
