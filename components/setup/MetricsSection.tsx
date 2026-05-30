import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FONT_BODY, FONT_MONO } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import {
  createMetricDefinition,
  deleteMetricDefinition,
  getMetricDefinitions,
  updateMetricDefinition,
} from '@/db/operations';
import type { MetricDefinition } from '@/db/schema';
import { confirmDestructive, showAlert } from '@/utils/alert';

export function MetricsSection() {
  const t = useTheme();
  const { refreshKey, refresh } = useDatabase();
  const [items, setItems] = useState<MetricDefinition[]>([]);

  // ── Add form ──
  const [name, setName]             = useState('');
  const [description, setDescription] = useState('');
  const [scale, setScale]           = useState<'integer' | 'float'>('integer');
  const [minVal, setMinVal]         = useState('1');
  const [maxVal, setMaxVal]         = useState('10');

  // ── Inline edit state ──
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [editName, setEditName]           = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editScale, setEditScale]         = useState<'integer' | 'float'>('integer');
  const [editMinVal, setEditMinVal]       = useState('');
  const [editMaxVal, setEditMaxVal]       = useState('');

  const startEdit = (m: MetricDefinition) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditDescription(m.description ?? '');
    setEditScale(m.scale);
    setEditMinVal(String(m.minVal));
    setEditMaxVal(String(m.maxVal));
  };

  const cancelEdit = () => setEditingId(null);

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const min = parseFloat(editMinVal);
    const max = parseFloat(editMaxVal);
    if (!editName.trim() || isNaN(min) || isNaN(max) || max <= min) {
      showAlert('Invalid', 'Name required and max must be greater than min.');
      return;
    }
    await updateMetricDefinition(editingId, {
      name: editName.trim(),
      description: editDescription.trim() || null,
      scale: editScale,
      minVal: min,
      maxVal: max,
    });
    setEditingId(null);
    refresh();
  };

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
    await createMetricDefinition({ name: name.trim(), scale, minVal: min, maxVal: max, description: description.trim() || null });
    setName(''); setDescription(''); setMinVal('1'); setMaxVal('10');
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
            { borderBottomColor: t.rule, borderBottomWidth: idx < items.length - 1 ? StyleSheet.hairlineWidth : 0 },
          ]}>
          {editingId === m.id ? (
            // ── Inline edit form ──
            <View style={{ paddingVertical: 10, gap: 8 }}>
              <TextInput
                style={[styles.input, { borderColor: t.rule, borderLeftColor: t.ink.black, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_BODY }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Metric name"
                placeholderTextColor={t.faded}
              />
              <TextInput
                style={[styles.input, { borderColor: t.rule, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_BODY }]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Description (optional)"
                placeholderTextColor={t.faded}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['integer', 'float'] as const).map((s) => {
                  const active = editScale === s;
                  return (
                    <Pressable
                      key={s}
                      onPress={() => setEditScale(s)}
                      style={{ flex: 1, padding: 8, alignItems: 'center', borderWidth: 1.5, borderColor: active ? t.ink.black : t.rule, backgroundColor: active ? t.ink.black : 'transparent' }}>
                      <Text style={{ fontFamily: FONT_MONO, fontSize: 10, fontWeight: '700', letterSpacing: 1, color: active ? t.paper : t.ink.black }}>
                        {s.toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  style={[styles.input, { flex: 1, borderColor: t.rule, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_MONO, textAlign: 'center' }]}
                  value={editMinVal}
                  onChangeText={setEditMinVal}
                  placeholder="Min"
                  placeholderTextColor={t.faded}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={[styles.input, { flex: 1, borderColor: t.rule, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_MONO, textAlign: 'center' }]}
                  value={editMaxVal}
                  onChangeText={setEditMaxVal}
                  placeholder="Max"
                  placeholderTextColor={t.faded}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable onPress={handleSaveEdit} style={{ flex: 1, padding: 10, alignItems: 'center', backgroundColor: t.ink.black }}>
                  <Text style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: '600', color: t.paper }}>SAVE</Text>
                </Pressable>
                <Pressable onPress={cancelEdit} style={{ flex: 1, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: t.rule }}>
                  <Text style={{ fontFamily: FONT_BODY, fontSize: 13, color: t.faded }}>CANCEL</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            // ── Normal display row ──
            <View style={[styles.row]}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT_BODY, fontSize: 15, color: t.ink.black, fontWeight: '600' }}>
                  {m.name}
                </Text>
                <Text style={{ fontFamily: FONT_MONO, fontSize: 10, color: t.accent, marginTop: 2, letterSpacing: 1 }}>
                  {m.scale.toUpperCase()} · {m.minVal}–{m.maxVal}
                </Text>
                {m.description ? (
                  <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 12, color: t.faded, marginTop: 2, lineHeight: 16 }}>
                    {m.description}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={() => startEdit(m)}
                hitSlop={12}
                style={{ paddingHorizontal: 10, paddingVertical: 8 }}>
                <Text style={{ fontFamily: FONT_MONO, fontSize: 10, color: t.ink.blue, letterSpacing: 1, fontWeight: '700' }}>
                  EDIT
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleDelete(m)}
                hitSlop={12}
                style={{ paddingHorizontal: 10, paddingVertical: 8 }}>
                <Text style={{ fontFamily: FONT_MONO, fontSize: 10, color: t.ink.red, letterSpacing: 1, fontWeight: '700' }}>
                  REMOVE
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}

      <View style={{ marginTop: t.sp.md, gap: 8 }}>
        <TextInput
          style={[styles.input, { borderColor: t.rule, borderLeftColor: t.ink.black, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_BODY }]}
          placeholder="Metric name (e.g. Energy)"
          placeholderTextColor={t.faded}
          value={name}
          onChangeText={setName}
          returnKeyType="next"
        />
        <TextInput
          style={[styles.input, { borderColor: t.rule, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_BODY }]}
          placeholder="Description (optional — e.g. Morning Activation 1-10 means…)"
          placeholderTextColor={t.faded}
          value={description}
          onChangeText={setDescription}
          returnKeyType="done"
          onSubmitEditing={handleAdd}
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
