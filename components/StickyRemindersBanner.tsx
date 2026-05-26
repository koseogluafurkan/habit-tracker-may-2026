// ─── StickyRemindersBanner ──────────────────────────────────────────────────
// Items always visible until manually completed.
// Rendered prominently at the top of Daily (and Month) screens.

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FONT_BODY, FONT_MONO } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useStickyReminders } from '@/hooks/useStickyReminders';

export function StickyRemindersBanner() {
  const t = useTheme();
  const { items, toggleCompleted } = useStickyReminders({ onlyActive: true });

  if (items.length === 0) return null;

  return (
    <View style={[
      styles.container,
      {
        borderColor: t.ink.red,
        backgroundColor: t.dark ? 'rgba(139,26,26,0.10)' : 'rgba(139,26,26,0.06)',
      },
    ]}>
      <Text style={{
        fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 2,
        color: t.ink.red, marginBottom: 6, fontWeight: '700',
      }}>
        ⚑ KEEP IN VIEW · {items.length} ACTIVE
      </Text>

      {items.map((it) => (
        <Pressable
          key={it.id}
          onPress={() => toggleCompleted(it.id, true)}
          style={[styles.row, { borderBottomColor: t.rule }]}>
          <View style={{
            width: 16, height: 16,
            borderWidth: 1.5, borderColor: t.ink.red,
            marginRight: 12, marginTop: 2,
          }} />
          <View style={{ flex: 1 }}>
            <Text style={{
              fontFamily: FONT_BODY, fontSize: 14, color: t.ink.black, lineHeight: 20,
            }}>
              {it.text}
            </Text>
            {it.topic || it.dueDate ? (
              <Text style={{
                fontFamily: FONT_MONO, fontSize: 10, color: t.faded,
                marginTop: 2, letterSpacing: 1,
              }}>
                {[
                  it.topic ? it.topic.toUpperCase() : null,
                  it.dueDate ? `DUE ${it.dueDate}` : null,
                ].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
});
