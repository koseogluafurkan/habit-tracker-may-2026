import { useCallback, useEffect, useState } from 'react';

import { useDatabase } from '@/contexts/DatabaseContext';
import {
  addMorningRoutineItem,
  deleteMorningRoutineItem,
  getDayIntention,
  getMorningLogs,
  getMorningRoutineItems,
  setDayIntention,
  toggleMorningLog,
  updateMorningRoutineItem,
} from '@/db/operations';
import type { DayIntention, MorningLog, MorningRoutineItem } from '@/db/schema';
import { toDateKey } from '@/utils/dates';

export function useMorningRoutine(date: Date = new Date()) {
  const { refreshKey, refresh } = useDatabase();
  const [items, setItems] = useState<MorningRoutineItem[]>([]);
  const [logs, setLogs] = useState<MorningLog[]>([]);
  const [intention, setIntentionState] = useState<DayIntention | null>(null);
  const dateKey = toDateKey(date);

  const load = useCallback(async () => {
    const [its, lgs, intent] = await Promise.all([
      getMorningRoutineItems(true),
      getMorningLogs(dateKey),
      getDayIntention(dateKey),
    ]);
    setItems(its);
    setLogs(lgs);
    setIntentionState(intent);
  }, [dateKey, refreshKey]);

  useEffect(() => { load(); }, [load]);

  const toggle = useCallback(async (itemId: string) => {
    await toggleMorningLog(dateKey, itemId);
    refresh();
  }, [dateKey, refresh]);

  const saveIntention = useCallback(async (text: string) => {
    await setDayIntention(dateKey, text || null);
    refresh();
  }, [dateKey, refresh]);

  const addItem = useCallback(async (text: string) => {
    await addMorningRoutineItem(text);
    refresh();
  }, [refresh]);

  const updateItem = useCallback(async (id: string, data: Partial<MorningRoutineItem>) => {
    await updateMorningRoutineItem(id, data);
    refresh();
  }, [refresh]);

  const removeItem = useCallback(async (id: string) => {
    await deleteMorningRoutineItem(id);
    refresh();
  }, [refresh]);

  const isCompleted = (itemId: string) =>
    logs.find((l) => l.itemId === itemId)?.completed === true;

  return { items, logs, intention, isCompleted, toggle, saveIntention, addItem, updateItem, removeItem, reload: load };
}
