import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';

import { DoubleRule } from '@/components/journal/atoms/DoubleRule';
import { GridOverlay } from '@/components/journal/atoms/GridOverlay';
import { MyFoundationSection } from '@/components/setup/MyFoundationSection';
import {
  FONT_BODY,
  FONT_HEADING,
  FONT_MONO,
  HABIT_COLORS,
  HABIT_TYPES,
  PAPER_TONES,
  getPenColor,
  type AestheticKey,
  type DensityKey,
  type HabitColor,
  type HabitType,
  type PaperToneKey,
} from '@/constants/theme';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useTheme, useThemeSettings } from '@/contexts/ThemeContext';
import { upsertMonthConfig } from '@/db/operations';
import { useHabits } from '@/hooks/useHabits';
import { useMonthData } from '@/hooks/useMonthData';
import { useBottomPadding } from '@/hooks/useBottomPadding';
import { useResponsive } from '@/hooks/useResponsive';
import { exportDataToFile, importDataFromFile } from '@/utils/export';
import { formatMonthYear } from '@/utils/dates';

// ── Section label (matches journal.tsx page label style) ────────────────────
function SectionLabel({ children, color, borderColor }: { children: React.ReactNode; color: string; borderColor: string }) {
  return (
    <View style={[styles.sectionLabel, { borderBottomColor: borderColor }]}>
      <Text style={[styles.sectionLabelText, { fontFamily: FONT_MONO, color }]}>
        {children}
      </Text>
    </View>
  );
}

export default function SetupScreen() {
  const t = useTheme();
  const { settings, setTone, setDensity, setAesthetic, setFollowSystem } = useThemeSettings();
  const insets = useSafeAreaInsets();
  const bottomPadding = useBottomPadding();
  const { columns } = useResponsive();
  const isDesktop = columns === 2;
  const { refresh } = useDatabase();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const { habits, addHabit, removeHabit } = useHabits(year, month);
  const { config } = useMonthData(year, month);

  const [habitName, setHabitName] = useState('');
  const [habitColor, setHabitColor] = useState<HabitColor>('black');
  const [habitType, setHabitType] = useState<HabitType>('boolean');
  const [nextMonthIdeas, setNextMonthIdeas] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [hyperFocus, setHyperFocus] = useState('');

  useEffect(() => {
    setNextMonthIdeas(config?.nextMonthIdeas ?? '');
    setReminderMessage(config?.reminderMessage ?? '');
    setHyperFocus(config?.hyperFocus ?? '');
  }, [config]);

  const handleAddHabit = async () => {
    if (!habitName.trim()) return;
    if (habits.length >= 8) {
      Alert.alert('Keep it focused', 'Track no more than 8 habits per month.');
      return;
    }
    await addHabit(habitName.trim(), habitColor, habitType);
    setHabitName('');
  };

  const handleSaveMonthConfig = async () => {
    await upsertMonthConfig(year, month, {
      nextMonthIdeas: nextMonthIdeas || null,
      reminderMessage: reminderMessage || null,
      hyperFocus: hyperFocus || null,
    });
    refresh();
    Alert.alert('Saved', 'Month settings updated.');
  };

  const handleExport = async () => {
    try {
      await exportDataToFile();
    } catch (e) {
      Alert.alert('Export failed', String(e));
    }
  };

  const handleImport = async () => {
    try {
      const ok = await importDataFromFile();
      if (ok) refresh();
    } catch (e) {
      Alert.alert('Import failed', String(e));
    }
  };

  const bg = t.dark ? 'rgba(255,240,200,0.04)' : 'rgba(255,250,235,0.6)';

  return (
    <View style={[styles.container, { backgroundColor: t.paper, paddingTop: insets.top + 8 }]}>
      <GridOverlay />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingHorizontal: 20 }]}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontFamily: FONT_MONO,
            fontSize: t.fs.meta,
            letterSpacing: 2.2,
            textTransform: 'uppercase',
            color: t.accent,
            marginBottom: 4,
          }}>
            Configuration
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{
              fontFamily: FONT_HEADING,
              fontSize: isDesktop ? 38 : 28,
              fontWeight: '700',
              color: t.ink.black,
              letterSpacing: -0.5,
            }}>
              Setup{' '}
            </Text>
            <Text style={{
              fontFamily: FONT_HEADING,
              fontSize: isDesktop ? 38 : 28,
              fontWeight: '400',
              fontStyle: 'italic',
              color: t.accent,
              letterSpacing: -0.5,
            }}>
              {formatMonthYear(year, month)}
            </Text>
          </View>
        </View>
      </View>

      <DoubleRule marginTop={8} color={t.ink.black} />

      {/* ── Body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        keyboardShouldPersistTaps="handled">

        {/* §I Baseline Habits */}
        <SectionLabel color={t.faded} borderColor={t.rule}>
          {`§I · BASELINE HABITS · ${format(new Date(year, month - 1, 1), 'MMM yyyy').toUpperCase()}`}
        </SectionLabel>

        <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, marginBottom: t.sp.md, lineHeight: 20 }}>
          Keep it minimal. Black = non-negotiables, Blue = positive, Red = bad habits to acknowledge.
          Maximum 8 per month.
        </Text>

        {habits.length === 0 ? (
          <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 14, color: t.faded, marginBottom: t.sp.md }}>
            No habits yet. Add your first baseline habit below.
          </Text>
        ) : (
          habits.map((h, idx) => {
            const penColor = h.color === 'blue' ? t.ink.blue : h.color === 'red' ? t.ink.red : t.ink.black;
            return (
              <View
                key={h.id}
                style={[
                  styles.habitItem,
                  {
                    borderBottomColor: t.rule,
                    borderBottomWidth: idx < habits.length - 1 ? StyleSheet.hairlineWidth : 0,
                  },
                ]}>
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

        {/* Add habit form */}
        <View style={[styles.addForm, { borderColor: t.rule, backgroundColor: bg, marginTop: t.sp.md }]}>
          <TextInput
            style={[styles.input, { borderColor: t.rule, borderLeftColor: t.ink.black, color: t.ink.black, fontFamily: FONT_BODY, backgroundColor: 'transparent' }]}
            placeholder="Habit name (e.g. Exercise)"
            placeholderTextColor={t.faded}
            value={habitName}
            onChangeText={setHabitName}
            onSubmitEditing={handleAddHabit}
            returnKeyType="done"
          />

          {/* Color picker */}
          <View style={[styles.optionRow, { marginBottom: t.sp.sm }]}>
            {HABIT_COLORS.map((c) => {
              const penColor = c.value === 'blue' ? t.ink.blue : c.value === 'red' ? t.ink.red : t.ink.black;
              const active = habitColor === c.value;
              return (
                <Pressable
                  key={c.value}
                  onPress={() => setHabitColor(c.value)}
                  style={[
                    styles.colorBtn,
                    {
                      borderColor: active ? penColor : t.rule,
                      backgroundColor: active ? (t.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'transparent',
                    },
                  ]}>
                  <View style={[styles.colorDot, { backgroundColor: penColor }]} />
                  <Text style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 1, color: active ? penColor : t.faded }}>
                    {c.label.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Type picker */}
          <View style={[styles.optionRow, { marginBottom: t.sp.sm }]}>
            {HABIT_TYPES.map((type) => {
              const active = habitType === type.value;
              return (
                <Pressable
                  key={type.value}
                  onPress={() => setHabitType(type.value)}
                  style={[
                    styles.typeBtn,
                    {
                      borderColor: active ? t.ink.black : t.rule,
                      backgroundColor: active ? t.ink.black : 'transparent',
                      borderWidth: active ? 2 : 1,
                    },
                  ]}>
                  <Text style={{
                    fontFamily: FONT_MONO,
                    fontSize: 11,
                    letterSpacing: 1.2,
                    fontWeight: '700',
                    // High-contrast: active = paper-on-black, inactive = black-on-paper (not faded)
                    color: active ? t.paper : t.ink.black,
                  }}>
                    {type.label.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={[styles.addBtn, { backgroundColor: t.ink.black }]}
            onPress={handleAddHabit}>
            <Text style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: '600', color: t.paper, letterSpacing: 0.3 }}>
              + Add Habit
            </Text>
          </Pressable>
        </View>

        {/* §II My Foundation */}
        <SectionLabel color={t.faded} borderColor={t.rule}>
          §II · MY FOUNDATION · ANTI-GOALS · BELIEFS · 3-YEAR
        </SectionLabel>
        <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, marginBottom: t.sp.sm, lineHeight: 20 }}>
          The bedrock. Revisited at the start of each month.
        </Text>
        <MyFoundationSection />

        {/* §III Month Notes */}
        <SectionLabel color={t.faded} borderColor={t.rule}>
          §III · MONTH NOTES · FOCUS + INTENTIONS
        </SectionLabel>

        <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2, textTransform: 'uppercase', color: t.accent, marginBottom: 4 }}>
          Hyper-Focus
        </Text>
        <TextInput
          style={[styles.inputField, { borderColor: t.rule, borderLeftColor: t.ink.blue, color: t.ink.black, fontFamily: FONT_BODY, backgroundColor: bg }]}
          placeholder='e.g. "Ship the product"'
          placeholderTextColor={t.faded}
          value={hyperFocus}
          onChangeText={setHyperFocus}
        />

        <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2, textTransform: 'uppercase', color: t.accent, marginBottom: 4, marginTop: t.sp.md }}>
          Reminder Message
        </Text>
        <TextInput
          style={[styles.inputField, { borderColor: t.rule, borderLeftColor: t.ink.black, color: t.ink.black, fontFamily: FONT_BODY, backgroundColor: bg }]}
          placeholder='e.g. "Stay present"'
          placeholderTextColor={t.faded}
          value={reminderMessage}
          onChangeText={setReminderMessage}
        />

        <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2, textTransform: 'uppercase', color: t.accent, marginBottom: 4, marginTop: t.sp.md }}>
          Ideas for Next Month
        </Text>
        <TextInput
          style={[styles.inputField, styles.textArea, { borderColor: t.rule, borderLeftColor: t.ink.black, color: t.ink.black, fontFamily: FONT_BODY, backgroundColor: bg }]}
          multiline
          placeholder="Habits to add, things to change..."
          placeholderTextColor={t.faded}
          value={nextMonthIdeas}
          onChangeText={setNextMonthIdeas}
        />

        <Pressable
          style={[styles.saveBtn, { backgroundColor: t.ink.black, marginTop: t.sp.md }]}
          onPress={handleSaveMonthConfig}>
          <Text style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: '600', color: t.paper, letterSpacing: 0.3 }}>
            Save Month Settings
          </Text>
        </Pressable>

        {/* §IV Appearance */}
        <SectionLabel color={t.faded} borderColor={t.rule}>
          §IV · APPEARANCE
        </SectionLabel>

        {/* Follow system */}
        <View style={[styles.switchRow, { borderBottomColor: t.rule }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONT_BODY, fontSize: t.fs.body, color: t.ink.black }}>
              Follow system theme
            </Text>
            <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, color: t.faded, marginTop: 2, letterSpacing: 1 }}>
              AUTO-SELECTS CREAM (LIGHT) OR MIDNIGHT (DARK)
            </Text>
          </View>
          <Switch
            value={settings.followSystem}
            onValueChange={setFollowSystem}
            trackColor={{ true: t.accent, false: t.rule }}
            thumbColor={t.paper}
          />
        </View>

        {/* Paper tone */}
        {!settings.followSystem && (
          <View style={{ marginBottom: t.sp.md }}>
            <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2, textTransform: 'uppercase', color: t.accent, marginBottom: t.sp.sm }}>
              Paper Tone
            </Text>
            <View style={styles.optionRow}>
              {(Object.entries(PAPER_TONES) as [PaperToneKey, typeof PAPER_TONES[PaperToneKey]][]).map(([key, tone]) => {
                const active = settings.toneKey === key && !settings.followSystem;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setTone(key)}
                    style={[
                      styles.toneBtn,
                      {
                        backgroundColor: tone.paper,
                        borderColor: active ? t.accent : t.rule,
                        borderWidth: active ? 2 : 1,
                      },
                    ]}>
                    <Text style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 1.5, color: tone.text, textTransform: 'uppercase' }}>
                      {tone.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Density */}
        <View style={{ marginBottom: t.sp.md }}>
          <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2, textTransform: 'uppercase', color: t.accent, marginBottom: t.sp.sm }}>
            Density
          </Text>
          <View style={styles.optionRow}>
            {(['relaxed', 'compact'] as DensityKey[]).map((d) => {
              const active = settings.density === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => setDensity(d)}
                  style={[
                    styles.typeBtn,
                    {
                      borderColor: active ? t.ink.black : t.rule,
                      backgroundColor: active ? t.ink.black : 'transparent',
                    },
                  ]}>
                  <Text style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 1, fontWeight: '700', color: active ? t.paper : t.ink.black }}>
                    {d.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Aesthetic */}
        <View style={{ marginBottom: t.sp.xl }}>
          <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2, textTransform: 'uppercase', color: t.accent, marginBottom: t.sp.sm }}>
            Background Pattern
          </Text>
          <View style={styles.optionRow}>
            {([
              { key: 'grid', label: 'Graph paper' },
              { key: 'notebook', label: 'Notebook' },
              { key: 'bound', label: 'Plain' },
            ] as { key: AestheticKey; label: string }[]).map(({ key, label }) => {
              const active = settings.aesthetic === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setAesthetic(key)}
                  style={[
                    styles.typeBtn,
                    {
                      borderColor: active ? t.ink.black : t.rule,
                      backgroundColor: active ? t.ink.black : 'transparent',
                    },
                  ]}>
                  <Text style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 1, fontWeight: '700', color: active ? t.paper : t.ink.black }}>
                    {label.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* §V Data */}
        <SectionLabel color={t.faded} borderColor={t.rule}>
          §V · DATA BACKUP
        </SectionLabel>

        <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, marginBottom: t.sp.md, lineHeight: 20 }}>
          All data lives in your browser's local storage. Export regularly to keep a backup.
        </Text>

        <Pressable
          style={[styles.saveBtn, { backgroundColor: t.ink.blue, marginBottom: t.sp.sm }]}
          onPress={handleExport}>
          <Text style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: '600', color: '#FFF', letterSpacing: 0.3 }}>
            Export JSON Backup
          </Text>
        </Pressable>

        <Pressable
          style={[styles.outlineBtn, { borderColor: t.ink.blue }]}
          onPress={handleImport}>
          <Text style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: '600', color: t.ink.blue, letterSpacing: 0.3 }}>
            Import JSON Backup
          </Text>
        </Pressable>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  header: {
    paddingVertical: 12,
  },
  scroll: { flex: 1 },
  content: { padding: 20 },
  sectionLabel: {
    paddingBottom: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    marginTop: 28,
  },
  sectionLabelText: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  addForm: {
    borderWidth: 1,
    padding: 14,
  },
  input: {
    borderWidth: 1,
    borderLeftWidth: 2,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  inputField: {
    borderWidth: 1,
    borderLeftWidth: 2,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 0,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 6,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  typeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  toneBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addBtn: {
    padding: 14,
    alignItems: 'center',
  },
  saveBtn: {
    padding: 14,
    alignItems: 'center',
  },
  outlineBtn: {
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
});
