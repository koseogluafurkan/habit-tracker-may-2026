import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';

import { NumericInputModal } from '@/components/NumericInputModal';
import { HabitMatrix } from '@/components/journal/HabitMatrix';
import { MemorableMoments } from '@/components/journal/MemorableMoments';
import { useTheme } from '@/contexts/ThemeContext';
import { useDaySelection } from '@/contexts/DaySelectionContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import {
  getOrCreateDayEntry,
  updateDayEntry,
  upsertHabitLog,
  deleteHabitLog,
} from '@/db/operations';
import type { Habit } from '@/db/schema';
import { useBottomPadding } from '@/hooks/useBottomPadding';
import { useMonthData } from '@/hooks/useMonthData';
import { useResponsive } from '@/hooks/useResponsive';
import { getDateForDay, shiftMonth } from '@/utils/dates';
import { FONT_BODY, FONT_HEADING, FONT_MONO } from '@/constants/theme';
import { DoubleRule } from '@/components/journal/atoms/DoubleRule';
import { GridOverlay } from '@/components/journal/atoms/GridOverlay';

export default function JournalScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = useBottomPadding();
  const { goToDate } = useDaySelection();
  const { columns } = useResponsive();
  const { refresh } = useDatabase();

  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [view, setView]   = useState<'moments' | 'habits'>('moments');

  const [numericModal, setNumericModal] = useState<{
    day: number;
    habit: Habit;
    value: string;
  } | null>(null);

  const { habits, dayEntries, habitLogs, config, loading } = useMonthData(year, month);
  const isDesktop = columns === 2;

  const changeMonth = (delta: number) => {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  };

  const handleMomentEdit = useCallback(
    async (day: number, text: string) => {
      const date = getDateForDay(year, month, day);
      const entry = await getOrCreateDayEntry(date);
      await updateDayEntry(entry.id, { memorableMoment: text || null });
      refresh();
    },
    [year, month, refresh]
  );

  const handleCellPress = useCallback(
    async (day: number, habit: Habit) => {
      const date = getDateForDay(year, month, day);
      const entry = await getOrCreateDayEntry(date);
      const dateKey = entry.date;
      const existing = habitLogs.find((l) => l.date === dateKey && l.habitId === habit.id);

      if (habit.type === 'boolean') {
        if (existing?.value === 'true') {
          await deleteHabitLog(entry.id, habit.id);
        } else {
          await upsertHabitLog(entry.id, habit.id, 'true');
        }
        refresh();
        return;
      }

      setNumericModal({ day, habit, value: existing?.value ?? '' });
    },
    [year, month, habitLogs, refresh]
  );

  const saveNumericValue = useCallback(
    async (value: string) => {
      if (!numericModal) return;
      const { day, habit } = numericModal;
      const date = getDateForDay(year, month, day);
      const entry = await getOrCreateDayEntry(date);
      if (!value.trim()) {
        await deleteHabitLog(entry.id, habit.id);
      } else {
        await upsertHabitLog(entry.id, habit.id, value.trim());
      }
      setNumericModal(null);
      refresh();
    },
    [numericModal, year, month, refresh]
  );

  const openDay = useCallback(
    (day: number) => {
      goToDate(getDateForDay(year, month, day));
      router.navigate('/(tabs)');
    },
    [year, month, goToDate]
  );

  // Month title: "May" roman + "2026" italic accent
  const monthName = format(new Date(year, month - 1, 1), 'MMMM');
  const yearStr   = String(year);

  return (
    <View style={[styles.container, { backgroundColor: t.paper, paddingTop: insets.top + 8 }]}>
      <GridOverlay />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingHorizontal: 20 }]}>
        <Pressable onPress={() => changeMonth(-1)} hitSlop={12} style={styles.navBtn}>
          <Text style={[styles.navText, { color: t.accent }]}>‹</Text>
        </Pressable>

        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{
            fontFamily: FONT_MONO,
            fontSize: t.fs.meta,
            letterSpacing: 2.2,
            textTransform: 'uppercase',
            color: t.accent,
            marginBottom: 4,
          }}>
            The month of
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{
              fontFamily: FONT_HEADING,
              fontSize: isDesktop ? 44 : 32,
              fontWeight: '700',
              color: t.ink.black,
              letterSpacing: -0.5,
            }}>
              {monthName}{' '}
            </Text>
            <Text style={{
              fontFamily: FONT_HEADING,
              fontSize: isDesktop ? 44 : 32,
              fontWeight: '400',
              fontStyle: 'italic',
              color: t.accent,
              letterSpacing: -0.5,
            }}>
              {yearStr}
            </Text>
          </View>
        </View>

        <Pressable onPress={() => changeMonth(1)} hitSlop={12} style={styles.navBtn}>
          <Text style={[styles.navText, { color: t.accent }]}>›</Text>
        </Pressable>
      </View>

      <DoubleRule marginTop={8} color={t.ink.black} />

      {/* ── Tab pills (phone + tablet only) ── */}
      {!isDesktop && (
        <View style={[styles.tabRow, { paddingHorizontal: 20, marginTop: 14, marginBottom: 10 }]}>
          {([
            { id: 'moments', label: 'Memorable Moments' },
            { id: 'habits',  label: 'Habit Matrix' },
          ] as const).map((tab) => {
            const active = view === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setView(tab.id)}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: active ? t.ink.black : 'transparent',
                    borderColor: t.ink.black,
                  },
                ]}>
                <Text style={{
                  fontFamily: FONT_HEADING,
                  fontSize: 14,
                  fontWeight: '600',
                  color: active ? t.paper : t.ink.black,
                }}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* ── Body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}>

        {isDesktop ? (
          /* Desktop: side-by-side spread */
          <View style={styles.spread}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pageLabel, { color: t.faded, borderBottomColor: t.rule, fontFamily: FONT_MONO }]}>
                LEFT PAGE / MEMORABLE MOMENTS
              </Text>
              <MemorableMoments
                year={year}
                month={month}
                dayEntries={dayEntries}
                onEdit={handleMomentEdit}
                onDayPress={openDay}
              />
            </View>
            <View style={[styles.spreadDivider, { backgroundColor: t.rule }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.pageLabel, { color: t.faded, borderBottomColor: t.rule, fontFamily: FONT_MONO }]}>
                RIGHT PAGE / HABIT MATRIX
              </Text>
              <HabitMatrix
                year={year}
                month={month}
                habits={habits}
                habitLogs={habitLogs}
                onCellPress={handleCellPress}
              />
              {/* Hyper-focus card */}
              {(config?.hyperFocus || config?.reminderMessage) ? (
                <View style={[
                  styles.hyperFocusCard,
                  {
                    borderColor: t.rule,
                    borderLeftColor: t.ink.blue,
                    backgroundColor: t.dark ? 'rgba(30,58,138,0.06)' : 'rgba(30,58,138,0.04)',
                    marginTop: 24,
                  },
                ]}>
                  <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2.2, textTransform: 'uppercase', color: t.ink.blue, marginBottom: 4 }}>
                    HYPER-FOCUS · {format(new Date(year, month - 1, 1), 'MMM').toUpperCase()}
                  </Text>
                  <Text style={{ fontFamily: FONT_HEADING, fontSize: t.fs.h2, fontWeight: '700', color: t.ink.black, lineHeight: t.fs.h2 * 1.1 }}>
                    {config.hyperFocus ?? config.reminderMessage}
                  </Text>
                  {config.hyperFocus && config.reminderMessage ? (
                    <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 14, color: t.faded, marginTop: 6 }}>
                      {config.reminderMessage}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        ) : (
          /* Phone/tablet: single column */
          view === 'moments' ? (
            <MemorableMoments
              year={year}
              month={month}
              dayEntries={dayEntries}
              onEdit={handleMomentEdit}
              onDayPress={openDay}
            />
          ) : (
            <HabitMatrix
              year={year}
              month={month}
              habits={habits}
              habitLogs={habitLogs}
              onCellPress={handleCellPress}
            />
          )
        )}
      </ScrollView>

      <NumericInputModal
        visible={numericModal !== null}
        title={numericModal?.habit.name ?? ''}
        initialValue={numericModal?.value ?? ''}
        onCancel={() => setNumericModal(null)}
        onSave={saveNumericValue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  navBtn: { paddingHorizontal: 8 },
  navText: { fontSize: 28, lineHeight: 32 },
  tabRow: { flexDirection: 'row', gap: 8 },
  tabPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1.5,
  },
  scroll: { flex: 1 },
  content: { padding: 20 },
  spread: { flexDirection: 'row', gap: 0 },
  spreadDivider: { width: 1, marginHorizontal: 24 },
  pageLabel: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingBottom: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  hyperFocusCard: {
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 14,
  },
});
