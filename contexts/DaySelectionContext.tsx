import { createContext, useCallback, useContext, useState } from 'react';

import { toDateKey } from '@/utils/dates';

type DaySelectionContextValue = {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  goToDate: (date: Date) => void;
};

const DaySelectionContext = createContext<DaySelectionContextValue | null>(null);

export function DaySelectionProvider({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });

  const goToDate = useCallback((date: Date) => {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    setSelectedDate(next);
  }, []);

  return (
    <DaySelectionContext.Provider value={{ selectedDate, setSelectedDate: goToDate, goToDate }}>
      {children}
    </DaySelectionContext.Provider>
  );
}

export function useDaySelection() {
  const ctx = useContext(DaySelectionContext);
  if (!ctx) throw new Error('useDaySelection must be used within DaySelectionProvider');
  return ctx;
}

export function useOptionalDaySelection() {
  return useContext(DaySelectionContext);
}
