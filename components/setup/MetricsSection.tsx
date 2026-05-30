import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FONT_BODY, FONT_MONO } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import {
  createMetricDefinition,
  deleteMetricDefinition,
  getMetricDefinitions,
} from '@/db/operations';
import type { MetricDefinition } from '@/db/schema';
import { confirmDestructive, showAlert } from '@/utils/alert';

export function MetricsSection() {
  const t = useTheme();
  const { refreshKey, refresh } = useDatabase();
  const [items, setItems] = useState<MetricDefinition[]>([]);

  const [name, setName]     = useState('');
  const [scale, setScale]   = useState<'integer' | 'float'>('integer');
  const [minVal, setMinVal] = useState('1');
  const [maxVal, setMaxVal] = useState('10');

  const load = useCallback(async () => {
    setItems(await getMetricDefinitions());
  }, [refreshKey]);
  useEffect(() => { load(); }, [load]);

  const bg = t.dark ? 'rgba(255,240,200,0.04)' : 'rgba(255,250,235,0.6)';

  const handleAdd = async () => {
    if (!name.trim()) return;
    const min = parseFloat(minVal);
    const max = parseFloat(maxVal);
    if (isNaN(min) || isNaN(max) || max <= min) {
      showAlert('Invalid range', 'Max must be greater than min.');
      return;
    }
    await createMetricDefinition({ name: name.trim(), scale, minVal: min, maxVal: max });
    setName(''); setMinVal('1'); setMaxVal('10');
    refresh();
  };

  const handleDelete = async (m: MetricDefinition) => {
    const ok = await confirmDestructive(
      'Delete metric?',
      `${m.name} — all logged values will also be deleted.`,
      'Delete',
    );
    if (ok) {
      await deleteMetricDefinition(m.id);
      refresh();
    }
  };

  return (
    <View>
      <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, marginBottom: t.sp.sm, lineHeight: 20 }}>
        Metrics tracked on the Daily journal and visualized in Graphs. Add, remove, and configure.
      </Text>

      {items.map((m, idx) => (
        <View
          key={m.id}
          style={[
            styles.row,
            { borderBottomColor: t.rule, borderBottomWidth: idx < items.length - 1 ? StyleSheet.hairlineWidth : 0 },
          ]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONT_BODY, fontSize: 15, color: t.ink.black, fontWeight: '600' }}>
              {m.name}
            </Text>
            <Text style={{ fontFamily: FONT_MONO, fontSize: 10, color: t.accent, marginTop: 2, letterSpacing: 1 }}>
              {m.scale.toUpperCase()} · {m.minVal}–{m.maxVal}
            </Text>
          </View>
          <Pressable
            onPress={() => handleDelete(m)}
            hitSlop={12}
            style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ fontFamily: FONT_MONO, fontSize: 10, color: t.ink.red, letterSpacing: 1, fontWeight: '700' }}>
              REMOVE
            </Text>
          </Pressable>
        </View>
      ))}

      <View style={{ marginTop: t.sp.md, gap: 8 }}>
        <TextInput
          style={[styles.input, { borderColor: t.rule, borderLeftColor: t.ink.black, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_BODY }]}
          placeholder="Metric name (e.g. Energy)"
          placeholderTextColor={t.faded}
          value={name}
          onChangeText={setName}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['integer', 'float'] as const).map((s) => {
            const active = scale === s;
            return (
              <Pressable
                key={s}
                onPress={() => setScale(s)}
                style={{
                  flex: 1, padding: 10, alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: active ? t.ink.black : t.rule,
                  backgroundColor: active ? t.ink.black : 'transparent',
                }}>
                <Text style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: '700', letterSpacing: 1, color: active ? t.paper : t.ink.black }}>
                  {s.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1, borderColor: t.rule, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_MONO, textAlign: 'center' }]}
            placeholder="Min"
            placeholderTextColor={t.faded}
            value={minVal}
            onChangeText={setMinVal}
            keyboardType="decimal-pad"
          />
          <TextInput
            style={[styles.input, { flex: 1, borderColor: t.rule, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_MONO, textAlign: 'center' }]}
            placeholder="Max"
            placeholderTextColor={t.faded}
            value={maxVal}
            onChangeText={setMaxVal}
            keyboardType="decimal-pad"
          />
        </View>
        <Pressable onPress={handleAdd} style={{ padding: 12, alignItems: 'center', backgroundColor: t.ink.black }}>
          <Text style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: '600', color: t.paper }}>
            + Add Metric
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
