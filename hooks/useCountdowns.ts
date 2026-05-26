import { differenceInCalendarDays } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';

import { useDatabase } from '@/contexts/DatabaseContext';
import {
  addCountdown,
  deleteCountdown,
  getCountdowns,
  updateCountdown,
} from '@/db/operations';
import type { Countdown } from '@/db/schema';

export function useCountdowns() {
  const { refreshKey, refresh } = useDatabase();
  const [items, setItems] = useState<Countdown[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getCountdowns();
    setItems(data);
    setLoading(false);
  }, [refreshKey]);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (label: string, targetDate: string, icon: string | null = null) => {
    await addCountdown(label, targetDate, icon);
    refresh();
  }, [refresh]);

  const update = useCallback(async (id: string, data: Partial<Countdown>) => {
    await updateCountdown(id, data);
    refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteCountdown(id);
    refresh();
  }, [refresh]);

  return { items, loading, add, update, remove, reload: load };
}

/** Returns "in 12d" / "today" / "2d ago" string */
export function formatDaysUntil(targetDate: string): string {
  const target = new Date(targetDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = differenceInCalendarDays(target, today);
  if (days === 0) return 'today';
  if (days > 0) return `${days}d`;
  return `${Math.abs(days)}d ago`;
}
