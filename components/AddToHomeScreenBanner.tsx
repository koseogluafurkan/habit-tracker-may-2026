import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { JournalTheme } from '@/constants/theme';

function isStandalonePwa() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isMobileWeb() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent);
}

export function AddToHomeScreenBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (!dismissed && isMobileWeb() && !isStandalonePwa()) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const isIos = typeof window !== 'undefined' && /iPhone|iPad|iPod/i.test(window.navigator.userAgent);

  return (
    <View style={styles.banner}>
      <Text style={styles.title}>Install Habit Journal</Text>
      <Text style={styles.body}>
        {isIos
          ? 'Tap Share, then “Add to Home Screen” for a full-screen app experience.'
          : 'Add this page to your home screen for an app-like experience.'}
      </Text>
      <Pressable
        style={styles.dismiss}
        onPress={() => {
          localStorage.setItem('pwa-banner-dismissed', '1');
          setVisible(false);
        }}>
        <Text style={styles.dismissText}>Got it</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 14,
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: JournalTheme.accent,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: JournalTheme.text,
    marginBottom: 4,
  },
  body: {
    fontSize: 13,
    color: JournalTheme.textMuted,
    lineHeight: 18,
    marginBottom: 10,
  },
  dismiss: {
    alignSelf: 'flex-start',
    backgroundColor: JournalTheme.accent,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  dismissText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },
});
