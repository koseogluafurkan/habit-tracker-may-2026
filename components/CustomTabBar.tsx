// ─── CustomTabBar ───────────────────────────────────────────────────────────
// Replaces expo-router's default tab bar so countdown chips can render
// inline ALONGSIDE the standard tabs (not in a separate dock).
//
// Layout: standard tabs + countdowns, all `flex: 1` → equal share, dynamic spacing.
// When 0 countdowns, the 5 tabs get full width each.
// When N countdowns are added, all 5 + N items share the row.

import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FONT_BODY, FONT_MONO } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useCountdowns, formatDaysUntil } from '@/hooks/useCountdowns';
import type { Countdown } from '@/db/schema';

import { CountdownEditModal } from './countdowns/CountdownEditModal';

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

// expo-router doesn't re-export the BottomTabBarProps type; structurally we only
// need state + navigation. Keep loose typing here.
type TabBarProps = {
  state: { routes: Array<{ key: string; name: string }>; index: number };
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
    navigate: (name: never) => void;
  };
};

export function CustomTabBar({ state, navigation }: TabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { items: countdowns } = useCountdowns();
  const [editing, setEditing] = useState<Countdown | null>(null);

  const safeBottom = Platform.OS === 'web' ? Math.max(insets.bottom, 16) : Math.max(insets.bottom, 6);

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
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const icon  = TAB_ICONS[route.name]  ?? '•';
          const label = TAB_TITLES[route.name] ?? route.name.toUpperCase();

          // Active tab gets a top accent line for clarity
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name as never);
                }
              }}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingHorizontal: 2,
                borderTopWidth: 2,
                borderTopColor: focused ? t.accent : 'transparent',
                marginTop: -8,
                paddingTop: 6,
              }}>
              <Text
                style={{
                  fontSize: 18,
                  lineHeight: 22,
                  color: focused ? t.accent : t.ink.black,
                }}>
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
                  fontWeight: focused ? '700' : '600',
                  // a11y: never below 60% opacity for inactive
                  opacity: focused ? 1 : 0.82,
                }}>
                {label}
              </Text>
            </Pressable>
          );
        })}

        {/* Countdown chips — flex:1 like regular tabs so spacing is dynamic */}
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
                borderTopWidth: 2,
                borderTopColor: isPast ? t.rule : t.ink.blue,
                marginTop: -8,
                paddingTop: 6,
              }}>
              <Text style={{ fontSize: 16, lineHeight: 22, color: t.ink.black }}>
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
              <Text
                style={{
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

// (StyleSheet kept for potential future shared styles)
const styles = StyleSheet.create({});
void styles;
