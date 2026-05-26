// ─── CountdownsDock ─────────────────────────────────────────────────────────
// Renders a horizontal scrollable row of countdown chips ABOVE the tab bar.
// Each chip shows icon + label + days remaining (live).
// Tapping a chip opens an edit modal.
// Hidden entirely when there are 0 countdowns.

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FONT_BODY, FONT_MONO } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useCountdowns, formatDaysUntil } from '@/hooks/useCountdowns';
import type { Countdown } from '@/db/schema';

import { CountdownEditModal } from './CountdownEditModal';

type Props = {
  bottomOffset?: number;   // distance above the tab bar (added to safe-area)
};

export function CountdownsDock({ bottomOffset = 0 }: Props) {
  const t = useTheme();
  const { items } = useCountdowns();
  const [editing, setEditing] = useState<Countdown | null>(null);

  if (items.length === 0) return null;

  return (
    <>
      <View
        pointerEvents="box-none"
        style={[
          styles.container,
          {
            bottom: bottomOffset,
            backgroundColor: t.paper,
            borderTopColor: t.rule,
          },
        ]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: 'center' }}>
          {items.map((c) => {
            const daysStr = formatDaysUntil(c.targetDate);
            const isPast = daysStr.endsWith('ago');
            return (
              <Pressable
                key={c.id}
                onPress={() => setEditing(c)}
                style={[
                  styles.chip,
                  {
                    borderColor: isPast ? t.rule : t.ink.blue,
                    backgroundColor: isPast ? 'transparent' : (t.dark ? 'rgba(30,58,138,0.08)' : 'rgba(30,58,138,0.05)'),
                  },
                ]}>
                {c.icon ? (
                  <Text style={{ fontSize: 14 }}>{c.icon}</Text>
                ) : null}
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: 12, fontWeight: '600',
                    color: t.ink.black,
                    maxWidth: 140,
                  }}>
                  {c.label}
                </Text>
                <Text style={{
                  fontFamily: FONT_MONO,
                  fontSize: 11,
                  color: isPast ? t.faded : t.ink.blue,
                  fontWeight: '700',
                  letterSpacing: 0.5,
                }}>
                  {daysStr}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <CountdownEditModal
        visible={editing !== null}
        countdown={editing}
        onClose={() => setEditing(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 50,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 0,
  },
});
