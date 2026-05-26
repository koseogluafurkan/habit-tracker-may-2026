import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FONT_BODY, FONT_MONO } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useMorningRoutine } from '@/hooks/useMorningRoutine';

export function MorningRoutineSection() {
  const t = useTheme();
  const { items, addItem, updateItem, removeItem } = useMorningRoutine();
  const [draft, setDraft] = useState('');

  const bg = t.dark ? 'rgba(255,240,200,0.04)' : 'rgba(255,250,235,0.6)';

  const handleAdd = async () => {
    if (!draft.trim()) return;
    await addItem(draft.trim());
    setDraft('');
  };

  return (
    <View>
      <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, marginBottom: t.sp.sm, lineHeight: 20 }}>
        Items in the Morning tab checklist. Toggle "active" to keep an item in the system but hide it from today's list.
      </Text>

      {items.length === 0 ? (
        <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, marginBottom: t.sp.sm }}>
          No morning routine items yet.
        </Text>
      ) : (
        items.map((it, idx) => (
          <View key={it.id} style={[styles.row, { borderBottomColor: t.rule, borderBottomWidth: idx < items.length - 1 ? StyleSheet.hairlineWidth : 0 }]}>
            <Pressable
              onPress={() => updateItem(it.id, { active: !it.active })}
              hitSlop={6}
              style={{
                width: 16, height: 16, marginRight: 12,
                borderWidth: 1.5, borderColor: it.active ? t.ink.blue : t.faded,
                backgroundColor: it.active ? t.ink.blue : 'transparent',
              }} />
            <Text style={{
              flex: 1, fontFamily: FONT_BODY, fontSize: 15,
              color: it.active ? t.ink.black : t.faded,
              lineHeight: 22,
            }}>
              {it.text}
            </Text>
            <Pressable
              onPress={() => Alert.alert('Delete morning item?', it.text, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => removeItem(it.id) },
              ])}
              hitSlop={6}
              style={{ paddingHorizontal: 6 }}>
              <Text style={{ fontFamily: FONT_MONO, fontSize: 14, color: t.ink.red }}>×</Text>
            </Pressable>
          </View>
        ))
      )}

      <View style={{ marginTop: t.sp.md, gap: 8 }}>
        <TextInput
          style={[styles.input, { borderColor: t.rule, borderLeftColor: t.ink.blue, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_BODY }]}
          placeholder="Morning item (e.g. Medication + breakfast)"
          placeholderTextColor={t.faded}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable onPress={handleAdd} style={{ padding: 12, alignItems: 'center', backgroundColor: t.ink.blue }}>
          <Text style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: '600', color: '#FFF' }}>
            + Add Morning Item
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
