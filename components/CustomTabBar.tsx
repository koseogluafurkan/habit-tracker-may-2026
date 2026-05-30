// ─── CustomTabBar ───────────────────────────────────────────────────────────
// Uses the React Navigation `navigation` prop (which expo-router passes to
// custom tab bars). Emitting `tabPress` then calling navigation.navigate is
// the canonical way to switch tabs — router.navigate() was doing a stack
// *push* inside the navigator instead of switching the selected tab.

import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
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

type Route = { key: string; name: string };

// Loose props type — expo-router passes the full React Navigation props
// but we only need state + navigation.
type Props = {
  state: { routes: Route[]; index: number };
  navigation: any;
};

export function CustomTabBar({ state, navigation }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { items: countdowns } = useCountdowns();
  const [editing, setEditing] = useState<Countdown | null>(null);

  const safeBottom = Platform.OS === 'web'
    ? Math.max(insets.bottom, 16)
    : Math.max(insets.bottom, 6);

  return (
    <>
      <View style={{
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
          const icon    = TAB_ICONS[route.name]  ?? '•';
          const label   = TAB_TITLES[route.name] ?? route.name.toUpperCase();

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={() => {
                // Emit tabPress so expo-router/React Navigation can handle
                // it correctly (focus, scroll-to-top, etc.)
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
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

        {/* Countdown chips */}
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
              <Text numberOfLines={1} style={{
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
