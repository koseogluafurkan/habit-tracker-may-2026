// ─── Baseline Habits (with future-month selection) ─────────────────────────
// Lets the user pick ANY month (current, future, past) and CRUD habits for it.
// Defaults to the current month on mount.

import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { format } from 'date-fns';

import { FONT_BODY, FONT_MONO, HABIT_COLORS, HABIT_TYPES, type HabitColor, type HabitType } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useHabits } from '@/hooks/useHabits';
import { shiftMonth } from '@/utils/dates';

export function BaselineHabitsSection() {
  const t = useTheme();
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { habits, addHabit, removeHabit } = useHabits(year, month);

  const [habitName, setHabitName]   = useState('');
  const [habitColor, setHabitColor] = useState<HabitColor>('black');
  const [habitType, setHabitType]   = useState<HabitType>('boolean');

  const bg = t.dark ? 'rgba(255,240,200,0.04)' : 'rgba(255,250,235,0.6)';

  const changeMonth = (delta: number) => {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  };

  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;
  const isFutureMonth = (year > now.getFullYear()) || (year === now.getFullYear() && month > now.getMonth() + 1);

  const handleAdd = async () => {
    if (!habitName.trim()) return;
    await addHabit(habitName.trim(), habitColor, habitType);
    setHabitName('');
  };

  return (
    <View>
      {/* Month switcher */}
      <View style={[styles.monthRow, { borderColor: t.rule, backgroundColor: bg }]}>
        <Pressable onPress={() => changeMonth(-1)} hitSlop={12} style={styles.monthNav}>
          <Text style={{ fontSize: 22, color: t.accent }}>‹</Text>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontFamily: FONT_MONO, fontSize: 10, color: t.accent, letterSpacing: 1.5 }}>
            EDITING HABITS FOR
          </Text>
          <Text style={{ fontFamily: FONT_BODY, fontSize: 17, color: t.ink.black, fontWeight: '700', marginTop: 2 }}>
            {format(new Date(year, month - 1, 1), 'MMMM yyyy')}
            {isCurrent ? ' (current)' : isFutureMonth ? ' (upcoming)' : ' (past)'}
          </Text>
        </View>
        <Pressable onPress={() => changeMonth(1)} hitSlop={12} style={styles.monthNav}>
          <Text style={{ fontSize: 22, color: t.accent }}>›</Text>
        </Pressable>
      </View>

      <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, marginBottom: t.sp.md, marginTop: 8, lineHeight: 20 }}>
        Black = non-negotiables · Blue = positive · Red = bad habits to acknowledge.
        Max 8 per month. {isFutureMonth ? 'You can set habits up ahead of time — they activate when that month arrives.' : ''}
      </Text>

      {habits.length === 0 ? (
        <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 14, color: t.faded, marginBottom: t.sp.md }}>
          No habits for this month yet.
        </Text>
      ) : (
        habits.map((h, idx) => {
          const penColor = h.color === 'blue' ? t.ink.blue : h.color === 'red' ? t.ink.red : t.ink.black;
          return (
            <View
              key={h.id}
              style={[styles.habitItem, { borderBottomColor: t.rule, borderBottomWidth: idx < habits.length - 1 ? StyleSheet.hairlineWidth : 0 }]}>
              <View style={{ width: 4, height: 28, backgroundColor: penColor, marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONT_BODY, fontSize: t.fs.lead, color: penColor, fontWeight: h.color === 'black' ? '700' : '500' }}>
                  {h.name}
                </Text>
                <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2, textTransform: 'uppercase', color: t.faded, marginTop: 2 }}>
                  {h.type} · {h.color === 'blue' ? 'POSITIVE' : h.color === 'red' ? 'BAD HABIT' : 'NON-NEGOTIABLE'}
                </Text>
              </View>
              <Pressable onPress={() => removeHabit(h.id)} hitSlop={8}>
                <Text style={{ fontFamily: FONT_MONO, fontSize: 11, color: t.ink.red, letterSpacing: 1 }}>
                  REMOVE
                </Text>
              </Pressable>
            </View>
          );
        })
      )}

      {/* Soft warning when >8 habits */}
      {habits.length >= 8 ? (
        <View style={{
          marginTop: t.sp.sm, marginBottom: t.sp.sm, padding: 10,
          borderWidth: 1, borderLeftWidth: 3,
          borderColor: '#C8960C', borderLeftColor: '#C8960C',
          backgroundColor: t.dark ? 'rgba(200,150,12,0.14)' : 'rgba(200,150,12,0.08)',
        }}>
          <Text style={{ fontFamily: FONT_MONO, fontSize: 10, color: '#C8960C', letterSpacing: 1, fontWeight: '700' }}>
            ⚠ {habits.length} HABİT — 8 ÖNERİLEN SINIRI GEÇTİNİZ
          </Text>
          <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 12, color: t.faded, marginTop: 3 }}>
            Daha fazla ekleyebilirsiniz, ama odak için 8'de tutmanız önerilir.
          </Text>
        </View>
      ) : null}

      {/* Add habit form */}
      <View style={[styles.addForm, { borderColor: t.rule, backgroundColor: bg, marginTop: t.sp.md }]}>
        <TextInput
          style={[styles.input, { borderColor: t.rule, borderLeftColor: t.ink.black, color: t.ink.black, fontFamily: FONT_BODY }]}
          placeholder="Habit name (e.g. Exercise)"
          placeholderTextColor={t.faded}
          value={habitName}
          onChangeText={setHabitName}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />

        <View style={[styles.optionRow, { marginBottom: t.sp.sm }]}>
          {HABIT_COLORS.map((c) => {
            const penColor = c.value === 'blue' ? t.ink.blue : c.value === 'red' ? t.ink.red : t.ink.black;
            const active = habitColor === c.value;
            return (
              <Pressable
                key={c.value}
                onPress={() => setHabitColor(c.value)}
                style={{
                  flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, gap: 6,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? penColor : t.rule,
                  backgroundColor: active ? (t.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent',
                }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: penColor }} />
                <Text style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 1, fontWeight: '700', color: active ? penColor : t.ink.black }}>
                  {c.label.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.optionRow, { marginBottom: t.sp.sm }]}>
          {HABIT_TYPES.map((type) => {
            const active = habitType === type.value;
            return (
              <Pressable
                key={type.value}
                onPress={() => setHabitType(type.value)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 8,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? t.ink.black : t.rule,
                  backgroundColor: active ? t.ink.black : 'transparent',
                }}>
                <Text style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 1.2, fontWeight: '700', color: active ? t.paper : t.ink.black }}>
                  {type.label.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={{ padding: 14, alignItems: 'center', backgroundColor: t.ink.black }} onPress={handleAdd}>
          <Text style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: '600', color: t.paper, letterSpacing: 0.3 }}>
            + Add Habit to {format(new Date(year, month - 1, 1), 'MMM yyyy')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  monthRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 8,
    borderWidth: 1,
  },
  monthNav: { paddingHorizontal: 12, paddingVertical: 4 },
  habitItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  addForm: { borderWidth: 1, padding: 14 },
  input: {
    borderWidth: 1, borderLeftWidth: 2,
    padding: 12, fontSize: 15, lineHeight: 22, marginBottom: 12,
  },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
