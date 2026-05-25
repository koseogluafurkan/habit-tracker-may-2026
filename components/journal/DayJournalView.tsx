import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NumericInputModal } from '@/components/NumericInputModal';
import { JournalTheme, getPenColor } from '@/constants/theme';
import type { Habit } from '@/db/schema';
import { useDaySelection } from '@/contexts/DaySelectionContext';
import { useBottomPadding } from '@/hooks/useBottomPadding';
import { useDayEntry } from '@/hooks/useDayEntry';
import { useHabits } from '@/hooks/useHabits';
import { useMetrics } from '@/hooks/useMetrics';
import {
  formatDisplayDate,
  isFutureDate,
  isPastDate,
  isToday,
  shiftDay,
} from '@/utils/dates';

import { CompactDayPicker } from './CompactDayPicker';
import { HabitCell } from './HabitCell';
import { useResponsive } from '@/hooks/useResponsive';
import { syncReminderToCalendar } from '@/utils/calendar';

export function DayJournalView() {
  const insets = useSafeAreaInsets();
  const bottomPadding = useBottomPadding();
  const { selectedDate, goToDate } = useDaySelection();
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  const { habits } = useHabits(year, month);
  const { metrics } = useMetrics();
  const {
    entry,
    habitLogs,
    metricLogs,
    loading,
    saveMemorableMoment,
    saveDayReminder,
    saveSleep,
    toggleHabit,
    setNumericHabit,
    setMetric,
  } = useDayEntry(selectedDate);

  const [moment, setMoment] = useState('');
  const [reminder, setReminder] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [sleepScore, setSleepScore] = useState('');
  const [metricValues, setMetricValues] = useState<Record<string, string>>({});
  const [numericModal, setNumericModal] = useState<{ habit: Habit; value: string } | null>(null);
  const [calendarNote, setCalendarNote] = useState<string | null>(null);
  const { columns } = useResponsive();

  const future = isFutureDate(selectedDate);
  const past = isPastDate(selectedDate);
  const today = isToday(selectedDate);

  useEffect(() => {
    setMoment(entry?.memorableMoment ?? '');
    setReminder(entry?.dayReminder ?? '');
    setSleepHours(entry?.sleepHours != null ? String(entry.sleepHours) : '');
    setSleepScore(entry?.sleepScore != null ? String(entry.sleepScore) : '');
  }, [entry, selectedDate]);

  useEffect(() => {
    const vals: Record<string, string> = {};
    for (const log of metricLogs) {
      vals[log.metricId] = String(log.value);
    }
    setMetricValues(vals);
  }, [metricLogs, selectedDate]);

  const getHabitValue = (habitId: string) => habitLogs.find((l) => l.habitId === habitId)?.value;

  const handleNumericSave = async (value: string) => {
    if (!numericModal) return;
    await setNumericHabit(numericModal.habit.id, value);
    setNumericModal(null);
  };

  const handleReminderBlur = async () => {
    await saveDayReminder(reminder);
    if (future && reminder.trim()) {
      const result = await syncReminderToCalendar(selectedDate, reminder);
      if (result.ok) {
        setCalendarNote(
          result.method === 'share'
            ? 'Calendar event ready — confirm in the share sheet.'
            : 'Calendar file downloaded — tap to add to iPhone/iPad Calendar.'
        );
      }
    }
  };

  if (loading && !entry) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={JournalTheme.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => goToDate(shiftDay(selectedDate, -1))} hitSlop={12}>
          <Text style={styles.navBtn}>‹</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.dateTitle}>{formatDisplayDate(selectedDate)}</Text>
          {today && <Text style={styles.badge}>Today</Text>}
          {future && <Text style={[styles.badge, styles.badgeFuture]}>Upcoming</Text>}
          {past && <Text style={[styles.badge, styles.badgePast]}>Past</Text>}
        </View>
        <Pressable onPress={() => goToDate(shiftDay(selectedDate, 1))} hitSlop={12}>
          <Text style={styles.navBtn}>›</Text>
        </Pressable>
      </View>

      <CompactDayPicker selectedDate={selectedDate} onSelect={goToDate} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}>
        <View style={[styles.grid, columns === 2 && styles.gridTwoCol]}>
        {future ? (
          <View style={[styles.section, columns === 2 && styles.sectionHalf]}>
            <Text style={styles.sectionTitle}>Reminder for this day</Text>
            <Text style={styles.sectionHint}>
              Saved as all-day Calendar event with 24h reminder on iPhone/iPad.
            </Text>
            <TextInput
              style={styles.textArea}
              multiline
              placeholder="What do you want to remember for this day?"
              placeholderTextColor={JournalTheme.textMuted}
              value={reminder}
              onChangeText={setReminder}
              onBlur={handleReminderBlur}
            />
            {calendarNote ? <Text style={styles.calendarNote}>{calendarNote}</Text> : null}
          </View>
        ) : null}

        {!future ? (
          <View style={[styles.section, columns === 2 && styles.sectionHalf]}>
            <Text style={styles.sectionTitle}>Memorable Moment</Text>
            <Text style={styles.sectionHint}>One positive win from this day.</Text>
            <TextInput
              style={styles.textArea}
              multiline
              placeholder="What was your win?"
              placeholderTextColor={JournalTheme.textMuted}
              value={moment}
              onChangeText={setMoment}
              onBlur={() => saveMemorableMoment(moment)}
            />
          </View>
        ) : null}

        {future ? (
          <View style={[styles.section, columns === 2 && styles.sectionHalf]}>
            <Text style={styles.sectionTitle}>Optional intention</Text>
            <TextInput
              style={styles.textArea}
              multiline
              placeholder="How do you want to show up this day?"
              placeholderTextColor={JournalTheme.textMuted}
              value={moment}
              onChangeText={setMoment}
              onBlur={() => saveMemorableMoment(moment)}
            />
          </View>
        ) : null}

        <View style={[styles.section, columns === 2 && styles.sectionHalf]}>
          <Text style={styles.sectionTitle}>Habits</Text>
          {habits.length === 0 ? (
            <Text style={styles.empty}>Add habits in Setup first.</Text>
          ) : (
            habits.map((habit) => {
              const color = habit.color;
              const value = getHabitValue(habit.id);
              return (
                <View key={habit.id} style={styles.habitRow}>
                  <Text style={[styles.habitName, { color: getPenColor(color) }]}>{habit.name}</Text>
                  {habit.type === 'boolean' ? (
                    <HabitCell
                      color={color}
                      type="boolean"
                      value={value}
                      size={36}
                      onPress={() => toggleHabit(habit.id, value)}
                    />
                  ) : (
                    <Pressable
                      style={styles.numericBtn}
                      onPress={() => setNumericModal({ habit, value: value ?? '' })}>
                      <Text style={[styles.numericText, { color: getPenColor(color) }]}>
                        {value || '—'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })
          )}
        </View>

        {!future ? (
          <View style={[styles.section, columns === 2 && styles.sectionHalf]}>
            <Text style={styles.sectionTitle}>Sleep</Text>
            <Text style={styles.label}>Hours</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="7.5"
              placeholderTextColor={JournalTheme.textMuted}
              value={sleepHours}
              onChangeText={setSleepHours}
              onBlur={() =>
                saveSleep(
                  sleepHours ? parseFloat(sleepHours) : null,
                  sleepScore ? parseInt(sleepScore, 10) : null
                )
              }
            />
            <Text style={styles.label}>Sleep score (optional)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="85"
              placeholderTextColor={JournalTheme.textMuted}
              value={sleepScore}
              onChangeText={setSleepScore}
              onBlur={() =>
                saveSleep(
                  sleepHours ? parseFloat(sleepHours) : null,
                  sleepScore ? parseInt(sleepScore, 10) : null
                )
              }
            />
          </View>
        ) : null}

        {!future ? (
          <View style={[styles.section, columns === 2 && styles.sectionHalf]}>
            <Text style={styles.sectionTitle}>Metrics</Text>
            {metrics.slice(0, 4).map((metric) => (
              <View key={metric.id} style={styles.metricRow}>
                <Text style={styles.metricName}>{metric.name}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholder={`${metric.minVal}–${metric.maxVal}`}
                  placeholderTextColor={JournalTheme.textMuted}
                  value={metricValues[metric.id] ?? ''}
                  onChangeText={(v) => setMetricValues((prev) => ({ ...prev, [metric.id]: v }))}
                  onBlur={() => {
                    const val = metricValues[metric.id];
                    if (val) setMetric(metric.id, parseFloat(val));
                  }}
                />
              </View>
            ))}
          </View>
        ) : null}

        {!today && (
          <Pressable style={styles.todayBtn} onPress={() => goToDate(new Date())}>
            <Text style={styles.todayBtnText}>Jump to today</Text>
          </Pressable>
        )}
        </View>
      </ScrollView>

      <NumericInputModal
        visible={numericModal !== null}
        title={numericModal?.habit.name ?? ''}
        initialValue={numericModal?.value ?? ''}
        onCancel={() => setNumericModal(null)}
        onSave={handleNumericSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: JournalTheme.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: JournalTheme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  navBtn: {
    fontSize: 28,
    color: JournalTheme.accent,
    paddingHorizontal: 12,
  },
  dateTitle: {
    fontSize: 17,
    fontFamily: 'Georgia',
    color: JournalTheme.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  badge: {
    fontSize: 11,
    color: JournalTheme.pen.blue,
    marginTop: 2,
    fontWeight: '600',
  },
  badgeFuture: {
    color: JournalTheme.warning,
  },
  badgePast: {
    color: JournalTheme.textMuted,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  grid: {
    width: '100%',
  },
  gridTwoCol: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sectionHalf: {
    width: '48%',
    flexGrow: 1,
  },
  calendarNote: {
    fontSize: 12,
    color: JournalTheme.success,
    marginTop: 8,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: JournalTheme.border,
    backgroundColor: '#FFFDF9',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Georgia',
    color: JournalTheme.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12,
    color: JournalTheme.textMuted,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  textArea: {
    borderWidth: 1,
    borderColor: JournalTheme.gridLine,
    padding: 10,
    minHeight: 80,
    fontSize: 15,
    fontFamily: 'Georgia',
    color: JournalTheme.text,
    textAlignVertical: 'top',
    backgroundColor: JournalTheme.background,
  },
  input: {
    borderWidth: 1,
    borderColor: JournalTheme.gridLine,
    padding: 10,
    fontSize: 15,
    color: JournalTheme.text,
    marginBottom: 10,
    backgroundColor: JournalTheme.background,
  },
  label: {
    fontSize: 12,
    color: JournalTheme.textMuted,
    marginBottom: 4,
  },
  empty: {
    fontSize: 14,
    color: JournalTheme.textMuted,
    fontStyle: 'italic',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: JournalTheme.gridLine,
  },
  habitName: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Georgia',
  },
  numericBtn: {
    minWidth: 48,
    padding: 8,
    borderWidth: 1,
    borderColor: JournalTheme.border,
    alignItems: 'center',
  },
  numericText: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricRow: {
    marginBottom: 8,
  },
  metricName: {
    fontSize: 13,
    color: JournalTheme.text,
    marginBottom: 4,
  },
  todayBtn: {
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
  },
  todayBtnText: {
    color: JournalTheme.accent,
    fontSize: 15,
    fontWeight: '600',
  },
});
