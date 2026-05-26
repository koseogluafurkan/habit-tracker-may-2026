import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FONT_BODY, FONT_MONO } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useStickyReminders } from '@/hooks/useStickyReminders';

export function StickyRemindersSection() {
  const t = useTheme();
  const { items, add, toggleCompleted, remove } = useStickyReminders();
  const [text, setText] = useState('');
  const [topic, setTopic] = useState('');
  const [dueDate, setDueDate] = useState('');

  const bg = t.dark ? 'rgba(255,240,200,0.04)' : 'rgba(255,250,235,0.6)';

  const handleAdd = async () => {
    if (!text.trim()) return;
    await add(text.trim(), topic.trim() || null, dueDate.trim() || null);
    setText(''); setTopic(''); setDueDate('');
  };

  return (
    <View>
      <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, marginBottom: t.sp.sm, lineHeight: 20 }}>
        Items that must stay in view. Even past their due date, they remain visible until you check them off.
      </Text>

      {items.length === 0 ? (
        <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, marginBottom: t.sp.sm }}>
          No sticky reminders yet.
        </Text>
      ) : (
        items.map((it, idx) => (
          <View key={it.id} style={[styles.row, { borderBottomColor: t.rule, borderBottomWidth: idx < items.length - 1 ? StyleSheet.hairlineWidth : 0 }]}>
            <Pressable
              onPress={() => toggleCompleted(it.id, !it.completed)}
              hitSlop={6}
              style={{
                width: 18, height: 18, marginRight: 12, marginTop: 2,
                borderWidth: 1.5,
                borderColor: it.completed ? t.faded : t.ink.red,
                backgroundColor: it.completed ? t.faded : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}>
              {it.completed ? <Text style={{ color: t.paper, fontSize: 12, lineHeight: 12 }}>✓</Text> : null}
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontFamily: FONT_BODY, fontSize: 14,
                color: it.completed ? t.faded : t.ink.black,
                textDecorationLine: it.completed ? 'line-through' : 'none',
                lineHeight: 20,
              }}>
                {it.text}
              </Text>
              {it.topic || it.dueDate ? (
                <Text style={{ fontFamily: FONT_MONO, fontSize: 10, color: t.accent, marginTop: 2, letterSpacing: 1 }}>
                  {[it.topic ? it.topic.toUpperCase() : null, it.dueDate ? `DUE ${it.dueDate}` : null].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => Alert.alert('Delete reminder?', it.text, [
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

      {/* Add form */}
      <View style={{ marginTop: t.sp.md, gap: 8 }}>
        <TextInput
          style={[styles.input, { borderColor: t.rule, borderLeftColor: t.ink.red, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_BODY }]}
          placeholder="Reminder text (e.g. Send Q3 review)"
          placeholderTextColor={t.faded}
          value={text}
          onChangeText={setText}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1, borderColor: t.rule, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_MONO }]}
            placeholder="Topic (optional)"
            placeholderTextColor={t.faded}
            value={topic}
            onChangeText={setTopic}
          />
          <TextInput
            style={[styles.input, { flex: 1, borderColor: t.rule, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_MONO }]}
            placeholder="Due (YYYY-MM-DD)"
            placeholderTextColor={t.faded}
            value={dueDate}
            onChangeText={setDueDate}
          />
        </View>
        <Pressable onPress={handleAdd} style={{ padding: 12, alignItems: 'center', backgroundColor: t.ink.red }}>
          <Text style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: '600', color: '#FFF' }}>
            + Pin to Sticky Reminders
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
  input: { borderWidth: 1, borderLeftWidth: 2, padding: 10, fontSize: 14, lineHeight: 20 },
});
