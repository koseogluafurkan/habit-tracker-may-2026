import { useCallback, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NumericInputModal } from '@/components/NumericInputModal';
import { GridBackground } from '@/components/journal/GridBackground';
import { HabitMatrix } from '@/components/journal/HabitMatrix';
import { MemorableMoments } from '@/components/journal/MemorableMoments';
import { JournalTheme } from '@/constants/theme';
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
import { formatMonthYear, getDateForDay, shiftMonth } from '@/utils/dates';

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const bottomPadding = useBottomPadding();
  const { goToDate } = useDaySelection();
  const { width } = useWindowDimensions();
  const { refresh } = useDatabase();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [view, setView] = useState<'spread' | 'matrix'>('spread');
  const [numericModal, setNumericModal] = useState<{
    day: number;
    habit: Habit;
    value: string;
  } | null>(null);
  const { habits, dayEntries, habitLogs, config, loading } = useMonthData(year, month);

  const isLandscape = width > 600;

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

      setNumericModal({
        day,
        habit,
        value: existing?.value ?? '',
      });
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => changeMonth(-1)} hitSlop={12}>
          <Text style={styles.navBtn}>‹</Text>
        </Pressable>
        <Text style={styles.monthTitle}>{formatMonthYear(year, month)}</Text>
        <Pressable onPress={() => changeMonth(1)} hitSlop={12}>
          <Text style={styles.navBtn}>›</Text>
        </Pressable>
      </View>

      {config?.reminderMessage ? (
        <Text style={styles.reminder}>{config.reminderMessage}</Text>
      ) : null}

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, view === 'spread' && styles.tabActive]}
          onPress={() => setView('spread')}>
          <Text style={[styles.tabText, view === 'spread' && styles.tabTextActive]}>Spread</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, view === 'matrix' && styles.tabActive]}
          onPress={() => setView('matrix')}>
          <Text style={[styles.tabText, view === 'matrix' && styles.tabTextActive]}>Habits</Text>
        </Pressable>
      </View>

      {!isLandscape && view === 'matrix' && (
        <Text style={styles.rotateHint}>Rotate your device for the full habit matrix view</Text>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}>
        <View style={[styles.page, { minHeight: Dimensions.get('window').height * 0.7 }]}>
          <GridBackground width={width - 32} height={400} />
          {view === 'spread' ? (
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
          )}
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

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
  container: {
    flex: 1,
    backgroundColor: JournalTheme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navBtn: {
    fontSize: 28,
    color: JournalTheme.accent,
    paddingHorizontal: 8,
  },
  monthTitle: {
    fontSize: 20,
    fontFamily: 'Georgia',
    color: JournalTheme.text,
    fontWeight: '600',
  },
  reminder: {
    fontSize: 13,
    fontStyle: 'italic',
    color: JournalTheme.textMuted,
    paddingHorizontal: 20,
    marginBottom: 8,
    fontFamily: 'Georgia',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: JournalTheme.border,
  },
  tabActive: {
    backgroundColor: JournalTheme.accent,
    borderColor: JournalTheme.accent,
  },
  tabText: {
    fontSize: 13,
    color: JournalTheme.textMuted,
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  rotateHint: {
    fontSize: 12,
    color: JournalTheme.warning,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  page: {
    position: 'relative',
    padding: 8,
    borderWidth: 1,
    borderColor: JournalTheme.border,
    backgroundColor: '#FFFDF9',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(250,248,245,0.7)',
  },
  loadingText: {
    color: JournalTheme.textMuted,
  },
});
