import { Platform } from 'react-native';

import { JournalTheme } from './theme';

export const MOBILE_WEB = {
  maxContentWidth: 720,
  tabBarHeight: Platform.OS === 'web' ? 64 : 56,
  safeAreaBottom: Platform.OS === 'web' ? 'env(safe-area-inset-bottom)' : 0,
};

export const pwaMeta = {
  themeColor: JournalTheme.accent,
  backgroundColor: JournalTheme.background,
  appName: 'Habit Journal',
  shortName: 'Journal',
};

export function registerServiceWorker() {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  });
}
