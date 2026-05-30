// ─── CustomTabBar ───────────────────────────────────────────────────────────
// Replaces expo-router's default tab bar so countdown chips can render
// inline ALONGSIDE the standard tabs (not in a separate dock).
//
// Navigation uses expo-router's `router.navigate` — more reliable than the
// internal React Navigation `navigation.navigate` inside expo-router.

import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FONT_BODY, FONT_MONO } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useCountdowns, formatDaysUntil } from '@/hooks/useCountdowns';
import type { Countdown } from '@/db/schema';

import { CountdownEditModal } from './countdowns/CountdownEditModal';

// Map each tab name → its expo-router path
const TAB_PATH: Record<string, string> = {
  morning: '/(tabs)/morning',
  index:   '/(tabs)/',
  journal: '/(tabs)/journal',
  graphs:  '/(tabs)/graphs',
  setup:   '/(tabs)/setup',
};

const TAB_ICONS: Record<string, string> = {
  morning: '☀',
  index:   '✎',
  journal: '◧',
  graphs:  '◢',
  setup:   '⚙',
};

const TAB_TITLES: Record<string, string> = {
  morning: 'MORNING',
  index:   'DAILY',
  journal: 'MONTH',
  graphs:  'GRAPHS',
  setup:   'SETUP',
};

// Detect which tab is currently active from the URL path
function isTabActive(routeName: string, pathname: string): boolean {
  if (routeName === 'index') return pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/';
  return pathname.endsWith(`/${routeName}`);
}

// expo-router doesn't re-export BottomTabBarProps; we only use `state.routes`.
type TabBarProps = {
  state: { routes: Array<{ key: string; name: string }>; index: number };
};

export function CustomTabBar({ state }: TabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { items: countdowns } = useCountdowns();
  const [editing, setEditing] = useState<Countdown | null>(null);

  const safeBottom = Platform.OS === 'web'
    ? Math.max(insets.bottom, 16)
    : Math.max(insets.bottom, 6);

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: t.paper,
          borderTopColor: t.rule,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: safeBottom + 4,
          alignItems: 'stretch',
        }}>

        {/* Standard tabs */}
        {state.routes.map((route) => {
          const focused = isTabActive(route.name, pathname);
          const icon    = TAB_ICONS[route.name]  ?? '•';
          const label   = TAB_TITLES[route.name] ?? route.name.toUpperCase();
          const path    = TAB_PATH[route.name];

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={() => {
                if (!focused && path) {
                  router.navigate(path as any);
                }
              }}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingHorizontal: 2,
                borderTopWidth: 2.5,
                borderTopColor: focused ? t.accent : 'transparent',
                marginTop: -8,
                paddingTop: 6,
              }}>
              <Text style={{ fontSize: 18, lineHeight: 22, color: focused ? t.accent : t.ink.black }}>
                {icon}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 10,
                  letterSpacing: 1.2,
                  marginTop: 2,
                  color: focused ? t.accent : t.ink.black,
                  fontWeight: '700',
                  opacity: focused ? 1 : 0.75,
                }}>
                {label}
              </Text>
            </Pressable>
          );
        })}

        {/* Countdown chips — flex:1 so spacing is dynamic */}
        {countdowns.map((c) => {
          const days = formatDaysUntil(c.targetDate);
          const isPast = days.endsWith('ago');
          return (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`${c.label}, ${days}`}
              onPress={() => setEditing(c)}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingHorizontal: 2,
                borderTopWidth: 2.5,
                borderTopColor: isPast ? t.rule : t.ink.blue,
                marginTop: -8,
                paddingTop: 6,
              }}>
              <Text style={{ fontSize: 16, lineHeight: 22 }}>
                {c.icon || '⏳'}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 10,
                  fontWeight: '700',
                  marginTop: 2,
                  color: t.ink.black,
                  maxWidth: '95%',
                }}>
                {c.label}
              </Text>
              <Text style={{
                fontFamily: FONT_MONO,
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 0.5,
                color: isPast ? t.faded : t.ink.blue,
                marginTop: 1,
              }}>
                {days}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <CountdownEditModal
        visible={editing !== null}
        countdown={editing}
        onClose={() => setEditing(null)}
      />
    </>
  );
}
