import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/contexts/ThemeContext';
import { useDayEntry } from '@/hooks/useDayEntry';
import { useHabits } from '@/hooks/useHabits';
import { useResponsive } from '@/hooks/useResponsive';
import { FONT_BODY, FONT_HEADING, FONT_MONO } from '@/constants/theme';
import { formatDisplayDate } from '@/utils/dates';

import { InkCheck } from './atoms/InkCheck';
import { SectionHeader } from './atoms/SectionHeader';
import { DoubleRule } from './atoms/DoubleRule';
import { GridOverlay } from './atoms/GridOverlay';

type Props = {
  visible: boolean;
  yesterday: Date;
  onDismiss: () => void;
};

export function MorningRevisitModal({ visible, yesterday, onDismiss }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { columns } = useResponsive();
  const isPhone = columns === 1;

  const year  = yesterday.getFullYear();
  const month = yesterday.getMonth() + 1;

  const { habits } = useHabits(year, month);
  const { entry, habitLogs, saveMemorableMoment, saveSleep, toggleHabit } =
    useDayEntry(yesterday);

  const [moment,     setMoment]     = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [sleepScore, setSleepScore] = useState('');

  useEffect(() => {
    setMoment(entry?.memorableMoment ?? '');
    setSleepHours(entry?.sleepHours != null ? String(entry.sleepHours) : '');
    setSleepScore(entry?.sleepScore != null ? String(entry.sleepScore) : '');
  }, [entry]);

  const getHabitValue = (id: string) => habitLogs.find((l) => l.habitId === id)?.value;

  const handleDone = async () => {
    await saveMemorableMoment(moment);
    await saveSleep(
      sleepHours ? parseFloat(sleepHours) : null,
      sleepScore ? parseInt(sleepScore, 10) : null,
    );
    onDismiss();
  };

  const booleanHabits = habits.filter((h) => h.type === 'boolean');
  const now = new Date();
  const timeStr = format(now, 'HH:mm');

  const bg = t.dark ? 'rgba(255,240,200,0.04)' : 'rgba(255,250,235,0.6)';

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[styles.container, { backgroundColor: t.paper, paddingTop: insets.top + 12 }]}>
        <GridOverlay />

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: t.rule, paddingHorizontal: 20 }]}>
          {/* "TO CLOSE" stamp — top right decorative */}
          <View style={[styles.stamp, { borderColor: t.ink.red }]}>
            <Text style={[styles.stampText, { fontFamily: FONT_MONO, color: t.ink.red }]}>
              TO CLOSE
            </Text>
          </View>

          {/* Eyebrow */}
          <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2.2, textTransform: 'uppercase', color: t.accent, marginBottom: 4 }}>
            ☼ MORNING RITUAL · {timeStr}
          </Text>

          {/* Title: "Yesterday —" italic + "Sunday, May 24" bold */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: FONT_HEADING, fontSize: t.fs.h1, fontWeight: '400', fontStyle: 'italic', color: t.accent, lineHeight: t.fs.h1 * 0.98 }}>
              Yesterday —{' '}
            </Text>
            <Text style={{ fontFamily: FONT_HEADING, fontSize: t.fs.h1, fontWeight: '700', color: t.ink.black, lineHeight: t.fs.h1 * 0.98 }}>
              {formatDisplayDate(yesterday)}
            </Text>
          </View>

          {/* Subtitle */}
          <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, marginTop: 6, maxWidth: 480 }}>
            Close yesterday before stepping into today. Three small marks. Then today begins.
          </Text>

          {/* Progress dots: 1 WIN · 2 HABITS · 3 SLEEP */}
          <View style={[styles.dotRow, { marginTop: t.sp.md }]}>
            {(['WIN', 'HABITS', 'SLEEP'] as const).map((label, i) => (
              <View key={label} style={{ alignItems: 'center', marginRight: 20 }}>
                <View style={[styles.dot, { backgroundColor: t.ink.black }]}>
                  <Text style={{ fontFamily: FONT_MONO, fontSize: 11, color: t.paper, fontWeight: '700' }}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta - 1, letterSpacing: 2, textTransform: 'uppercase', color: t.accent, marginTop: 4 }}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          <DoubleRule marginTop={t.sp.md} />
        </View>

        {/* Scrollable content */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 24 }]}
          keyboardShouldPersistTaps="handled">

          {/* 01 · What was good? */}
          <SectionHeader eyebrow="01" title="What was good?" style={{ marginBottom: t.sp.sm }} />
          <TextInput
            style={[
              styles.textArea,
              {
                borderColor: t.rule,
                borderLeftColor: t.ink.black,
                backgroundColor: bg,
                color: t.ink.black,
                fontFamily: FONT_BODY,
              },
            ]}
            multiline
            autoFocus
            placeholder="Yesterday's win…"
            placeholderTextColor={t.faded}
            value={moment}
            onChangeText={setMoment}
          />

          {/* 02 · Yesterday's marks */}
          {booleanHabits.length > 0 && (
            <View style={{ marginTop: t.sp.xl }}>
              <SectionHeader eyebrow="02" title="Yesterday's marks" style={{ marginBottom: t.sp.sm }} />
              {booleanHabits.map((habit, idx) => {
                const value = getHabitValue(habit.id);
                const penColor =
                  habit.color === 'blue' ? t.ink.blue
                  : habit.color === 'red' ? t.ink.red
                  : t.ink.black;
                return (
                  <Pressable
                    key={habit.id}
                    onPress={() => toggleHabit(habit.id, value)}
                    style={[
                      styles.habitRow,
                      {
                        paddingVertical: t.sp.sm,
                        borderBottomWidth: idx < booleanHabits.length - 1 ? StyleSheet.hairlineWidth : 0,
                        borderBottomColor: t.rule,
                        borderStyle: 'dotted',
                      },
                    ]}>
                    <InkCheck checked={value === 'true'} color={habit.color as any} size={48} readOnly />
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={{ fontFamily: FONT_BODY, fontSize: t.fs.lead, color: penColor, fontWeight: habit.color === 'black' ? '700' : '500' }}>
                        {habit.name}
                      </Text>
                      <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2, textTransform: 'uppercase', color: t.accent, marginTop: 3 }}>
                        {habit.color === 'blue' ? 'POSITIVE' : habit.color === 'red' ? 'BAD HABIT' : 'NON-NEGOTIABLE'}
                      </Text>
                    </View>
                    <View style={{ width: 4, height: 28, backgroundColor: penColor, opacity: value === 'true' ? 1 : 0.22 }} />
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* 03 · How did you sleep? */}
          <View style={{ marginTop: t.sp.xl }}>
            <SectionHeader eyebrow="03" title="How did you sleep?" style={{ marginBottom: t.sp.sm }} />
            <View style={{ flexDirection: 'row', gap: t.sp.md }}>
              {/* Hours */}
              <View style={[styles.sleepCard, { backgroundColor: bg, borderColor: t.rule, flex: 1 }]}>
                <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2.2, textTransform: 'uppercase', color: t.accent, marginBottom: 4 }}>
                  HOURS
                </Text>
                <TextInput
                  style={{ fontFamily: FONT_HEADING, fontSize: 30, fontWeight: '700', color: t.ink.black, padding: 0 }}
                  keyboardType="decimal-pad"
                  placeholder="—"
                  placeholderTextColor={t.faded}
                  value={sleepHours}
                  onChangeText={setSleepHours}
                />
              </View>
              {/* Score */}
              <View style={[styles.sleepCard, { backgroundColor: bg, borderColor: t.rule, flex: 1 }]}>
                <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2.2, textTransform: 'uppercase', color: t.accent, marginBottom: 4 }}>
                  SCORE · OPTIONAL
                </Text>
                <TextInput
                  style={{ fontFamily: FONT_HEADING, fontSize: 30, fontWeight: '700', color: t.ink.black, padding: 0 }}
                  keyboardType="number-pad"
                  placeholder="—"
                  placeholderTextColor={t.faded}
                  value={sleepScore}
                  onChangeText={setSleepScore}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + 16,
              paddingTop: t.sp.md,
              paddingHorizontal: 16,
              borderTopColor: t.rule,
              backgroundColor: t.paper,
              gap: t.sp.sm,
            },
          ]}>
          <Pressable
            style={[styles.skipBtn, { borderColor: t.ink.black }]}
            onPress={onDismiss}>
            <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 14, color: t.ink.black }}>
              Skip
            </Text>
          </Pressable>
          <Pressable style={[styles.doneBtn, { backgroundColor: t.ink.black }]} onPress={handleDone}>
            <Text style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: '600', color: t.paper, letterSpacing: 0.3 }}>
              Done — Step into Today →
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  header: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    position: 'relative',
  },
  stamp: {
    position: 'absolute',
    top: 0,
    right: 20,
    borderWidth: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    transform: [{ rotate: '-6deg' }],
  },
  stampText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: {
    padding: 20,
  },
  textArea: {
    borderWidth: 1,
    borderLeftWidth: 1.5,
    padding: 12,
    minHeight: 92,
    fontSize: 16,
    lineHeight: 28,
    textAlignVertical: 'top',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sleepCard: {
    borderWidth: 1,
    padding: 12,
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  skipBtn: {
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
