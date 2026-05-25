import { useCallback, useEffect, useState } from 'react';

import { getDayEntryByDate } from '@/db/operations';
import { getRitualDefaultDate, toDateKey } from '@/utils/dates';

export function useMorningRevisit() {
  const yesterday = getRitualDefaultDate();
  const storageKey = `morning-revisit-${toDateKey(new Date())}`;

  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    if (localStorage.getItem(storageKey)) return;

    getDayEntryByDate(yesterday).then((entry) => {
      const incomplete = !entry || !entry.memorableMoment;
      if (incomplete) setShouldShow(true);
    });
  }, [storageKey]);

  const dismiss = useCallback(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(storageKey, '1');
    }
    setShouldShow(false);
  }, [storageKey]);

  return { shouldShow, yesterday, dismiss };
}
