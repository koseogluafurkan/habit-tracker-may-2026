import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { JournalTheme, getPenColor } from '@/constants/theme';
import type { Habit, HabitLog } from '@/db/schema';
import { getDaysInMonthCount } from '@/utils/dates';

import { HabitCell } from './HabitCell';

type HabitMatrixProps = {
  year: number;
  month: number;
  habits: Habit[];
  habitLogs: (HabitLog & { date: string })[];
  onCellPress?: (day: number, habit: Habit) => void;
  readOnly?: boolean;
};

export function HabitMatrix({ year, month, habits, habitLogs, onCellPress, readOnly }: HabitMatrixProps) {
  const daysCount = getDaysInMonthCount(year, month);
  const days = Array.from({ length: daysCount }, (_, i) => i + 1);

  const getLogValue = (day: number, habitId: string) => {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return habitLogs.find((l) => l.date === dateKey && l.habitId === habitId)?.value;
  };

  if (habits.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Add habits in Setup to build your matrix.</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={styles.headerRow}>
          <View style={styles.dayHeaderSpacer} />
          {habits.map((habit) => (
            <View key={habit.id} style={styles.habitHeader}>
              <Text
                style={[styles.habitLabel, { color: getPenColor(habit.color as 'black' | 'blue' | 'red') }]}
                numberOfLines={2}>
                {habit.name}
              </Text>
            </View>
          ))}
        </View>
        {days.map((day) => (
          <View key={day} style={styles.row}>
            <Text style={styles.dayNum}>{day}</Text>
            {habits.map((habit) => (
              <HabitCell
                key={`${day}-${habit.id}`}
                color={habit.color as 'black' | 'blue' | 'red'}
                type={habit.type as 'boolean' | 'numeric'}
                value={getLogValue(day, habit.id)}
                readOnly={readOnly}
                onPress={() => onCellPress?.(day, habit)}
              />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  empty: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: JournalTheme.textMuted,
    fontStyle: 'italic',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  dayHeaderSpacer: {
    width: 28,
  },
  habitHeader: {
    width: 30,
    height: 56,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginHorizontal: 1,
  },
  habitLabel: {
    fontSize: 9,
    fontWeight: '600',
    transform: [{ rotate: '-55deg' }],
    width: 60,
    textAlign: 'left',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayNum: {
    width: 28,
    fontSize: 11,
    fontFamily: 'SpaceMono',
    color: JournalTheme.textMuted,
    textAlign: 'right',
    paddingRight: 4,
  },
});
