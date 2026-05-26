import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FONT_BODY, FONT_MONO } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useCountdowns, formatDaysUntil } from '@/hooks/useCountdowns';

export function CountdownsSection() {
  const t = useTheme();
  const { items, add, remove } = useCountdowns();
  const [label, setLabel] = useState('');
  const [date, setDate]   = useState('');
  const [icon, setIcon]   = useState('');

  const bg = t.dark ? 'rgba(255,240,200,0.04)' : 'rgba(255,250,235,0.6)';

  const handleAdd = async () => {
    if (!label.trim() || !date.trim()) return;
    await add(label.trim(), date.trim(), icon.trim() || null);
    setLabel(''); setDate(''); setIcon('');
  };

  return (
    <View>
      <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, marginBottom: t.sp.sm, lineHeight: 20 }}>
        Pin custom countdowns. Each one appears as a live chip above the tab bar on every screen.
        When none exist, the dock is hidden — no wasted space.
      </Text>

      {items.length === 0 ? (
        <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, marginBottom: t.sp.sm }}>
          No countdowns. Add one below.
        </Text>
      ) : (
        items.map((it, idx) => (
          <View
            key={it.id}
            style={[styles.row, { borderBottomColor: t.rule, borderBottomWidth: idx < items.length - 1 ? StyleSheet.hairlineWidth : 0 }]}>
            {it.icon ? (
              <Text style={{ fontSize: 18, width: 30, textAlign: 'center' }}>{it.icon}</Text>
            ) : <View style={{ width: 30 }} />}
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT_BODY, fontSize: 15, color: t.ink.black, fontWeight: '600' }}>
                {it.label}
              </Text>
              <Text style={{ fontFamily: FONT_MONO, fontSize: 10, color: t.accent, marginTop: 2, letterSpacing: 1 }}>
                {it.targetDate.toUpperCase()} · {formatDaysUntil(it.targetDate).toUpperCase()}
              </Text>
            </View>
            <Pressable
              onPress={() => Alert.alert('Delete countdown?', it.label, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => remove(it.id) },
              ])}
              hitSlop={6}
              style={{ paddingHorizontal: 6 }}>
              <Text style={{ fontFamily: FONT_MONO, fontSize: 14, color: t.ink.red }}>×</Text>
            </Pressable>
          </View>
        ))
      )}

      <View style={{ marginTop: t.sp.md, gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1, borderColor: t.rule, borderLeftColor: t.ink.blue, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_BODY }]}
            placeholder="Label (e.g. Mid-year review)"
            placeholderTextColor={t.faded}
            value={label}
            onChangeText={setLabel}
          />
          <TextInput
            style={[styles.input, { width: 60, borderColor: t.rule, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_BODY, textAlign: 'center' }]}
            placeholder="🎯"
            placeholderTextColor={t.faded}
            value={icon}
            onChangeText={setIcon}
            maxLength={4}
          />
        </View>
        <TextInput
          style={[styles.input, { borderColor: t.rule, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_MONO }]}
          placeholder="Target date (YYYY-MM-DD)"
          placeholderTextColor={t.faded}
          value={date}
          onChangeText={setDate}
        />
        <Pressable onPress={handleAdd} style={{ padding: 12, alignItems: 'center', backgroundColor: t.ink.blue }}>
          <Text style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: '600', color: '#FFF' }}>
            + Add Countdown
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  input: { borderWidth: 1, borderLeftWidth: 2, padding: 10, fontSize: 14, lineHeight: 20 },
});
