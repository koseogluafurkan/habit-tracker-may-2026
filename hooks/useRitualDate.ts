import { useMemo, useState } from 'react';

import { getRitualDefaultDate, isEvening } from '@/utils/dates';

export type RitualDateMode = 'yesterday' | 'today' | 'custom';

export function useRitualDate() {
  const [mode, setMode] = useState<RitualDateMode>('yesterday');
  const [customDate, setCustomDate] = useState<Date>(() => getRitualDefaultDate());

  const ritualDate = useMemo(() => {
    if (mode === 'today') return new Date();
    if (mode === 'custom') return customDate;
    return getRitualDefaultDate();
  }, [mode, customDate]);

  const showEveningChoice = isEvening();

  return {
    ritualDate,
    mode,
    setMode,
    customDate,
    setCustomDate,
    showEveningChoice,
    defaultIsYesterday: true,
  };
}
