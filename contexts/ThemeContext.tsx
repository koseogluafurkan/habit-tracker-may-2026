import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import type { AestheticKey, DensityKey, PaperToneKey, ResolvedTheme } from '@/constants/theme';
import { resolveTheme } from '@/constants/theme';
import { getUserSettings, upsertUserSettings } from '@/db/operations';

const STORAGE_KEY = 'journal.theme';

type ThemeSettings = {
  toneKey: PaperToneKey;
  density: DensityKey;
  aesthetic: AestheticKey;
  followSystem: boolean;
};

const DEFAULT_SETTINGS: ThemeSettings = {
  toneKey: 'cream',
  density: 'relaxed',
  aesthetic: 'grid',
  followSystem: true,
};

type ThemeContextValue = {
  theme: ResolvedTheme;
  settings: ThemeSettings;
  setTone: (tone: PaperToneKey) => void;
  setDensity: (density: DensityKey) => void;
  setAesthetic: (aesthetic: AestheticKey) => void;
  setFollowSystem: (follow: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function loadLocalSettings(): ThemeSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<ThemeSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveLocalSettings(settings: ThemeSettings): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  // Start from localStorage for instant first paint, then hydrate from Supabase
  const [settings, setSettings] = useState<ThemeSettings>(loadLocalSettings);
  const [hydratedFromCloud, setHydratedFromCloud] = useState(false);

  // Hydrate from Supabase on mount — cloud settings win over local
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cloud = await getUserSettings();
        if (!cancelled && cloud) {
          const next: ThemeSettings = {
            toneKey: (cloud.toneKey as PaperToneKey) || DEFAULT_SETTINGS.toneKey,
            density: (cloud.density as DensityKey) || DEFAULT_SETTINGS.density,
            aesthetic: (cloud.aesthetic as AestheticKey) || DEFAULT_SETTINGS.aesthetic,
            followSystem: cloud.followSystem,
          };
          setSettings(next);
          saveLocalSettings(next);
        }
      } catch (e) {
        // Cloud unreachable — keep local. Will retry next mount.
      } finally {
        if (!cancelled) setHydratedFromCloud(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const effectiveTone: PaperToneKey = settings.followSystem
    ? systemScheme === 'dark' ? 'midnight' : 'cream'
    : settings.toneKey;

  const theme = resolveTheme(effectiveTone, settings.density, settings.aesthetic);

  const update = useCallback((patch: Partial<ThemeSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveLocalSettings(next);
      // Fire-and-forget cloud sync — don't block UI
      upsertUserSettings(next).catch((e) => console.warn('Theme cloud sync failed:', e));
      return next;
    });
  }, []);

  const setTone         = useCallback((toneKey: PaperToneKey)  => update({ toneKey, followSystem: false }), [update]);
  const setDensity      = useCallback((density: DensityKey)     => update({ density }), [update]);
  const setAesthetic    = useCallback((aesthetic: AestheticKey) => update({ aesthetic }), [update]);
  const setFollowSystem = useCallback((followSystem: boolean)   => update({ followSystem }), [update]);

  return (
    <ThemeContext.Provider value={{ theme, settings, setTone, setDensity, setAesthetic, setFollowSystem }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ResolvedTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx.theme;
}

export function useThemeSettings() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeSettings must be used within ThemeProvider');
  return ctx;
}
