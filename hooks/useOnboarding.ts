// ─── First-time onboarding + monthly foundation revisit (Sprint 2) ──────────
// Shows the OnboardingModal when:
//   1. First launch ever (no PersonalSetup rows + no localStorage flag)
//   2. Start of a new month, once per month (reminder revisit)

import { useCallback, useEffect, useState } from 'react';

import { getPersonalSetups } from '@/db/operations';

const FIRST_RUN_KEY      = 'onboarding.completed.v1';
const MONTH_REVISIT_KEY  = (yyyymm: string) => `onboarding.month-revisit.${yyyymm}`;

export type OnboardingMode = 'first-run' | 'month-revisit' | null;

export function useOnboarding() {
  const [mode, setMode] = useState<OnboardingMode>(null);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    (async () => {
      const setups = await getPersonalSetups();
      const completed = localStorage.getItem(FIRST_RUN_KEY);

      // First-run: never completed AND no foundation data yet
      if (!completed && setups.length === 0) {
        setMode('first-run');
        return;
      }

      // Month-revisit: at start of each new month, once
      const now = new Date();
      const yyyymm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const revisitKey = MONTH_REVISIT_KEY(yyyymm);
      if (!localStorage.getItem(revisitKey) && setups.length > 0) {
        // Only on the 1st-3rd of the month so it's not annoying mid-month
        if (now.getDate() <= 3) {
          setMode('month-revisit');
        }
      }
    })();
  }, []);

  const dismiss = useCallback(() => {
    if (typeof localStorage !== 'undefined') {
      if (mode === 'first-run') {
        localStorage.setItem(FIRST_RUN_KEY, '1');
      } else if (mode === 'month-revisit') {
        const now = new Date();
        const yyyymm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        localStorage.setItem(MONTH_REVISIT_KEY(yyyymm), '1');
      }
    }
    setMode(null);
  }, [mode]);

  return { mode, dismiss };
}
