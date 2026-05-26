import { useCallback, useEffect, useState } from 'react';

import { useDatabase } from '@/contexts/DatabaseContext';
import {
  addStickyReminder,
  deleteStickyReminder,
  getStickyReminders,
  updateStickyReminder,
} from '@/db/operations';
import type { StickyReminder } from '@/db/schema';

export function useStickyReminders(opts: { onlyActive?: boolean } = {}) {
  const { refreshKey, refresh } = useDatabase();
  const [items, setItems] = useState<StickyReminder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getStickyReminders();
    setItems(opts.onlyActive ? data.filter((r) => !r.completed) : data);
    setLoading(false);
  }, [refreshKey, opts.onlyActive]);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (text: string, topic: string | null = null, dueDate: string | null = null) => {
    await addStickyReminder(text, topic, dueDate);
    refresh();
  }, [refresh]);

  const update = useCallback(async (id: string, data: Partial<StickyReminder>) => {
    await updateStickyReminder(id, data);
    refresh();
  }, [refresh]);

  const toggleCompleted = useCallback(async (id: string, completed: boolean) => {
    await updateStickyReminder(id, { completed });
    refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteStickyReminder(id);
    refresh();
  }, [refresh]);

  return { items, loading, add, update, toggleCompleted, remove, reload: load };
}
