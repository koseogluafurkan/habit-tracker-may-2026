import { StyleSheet, Text, View } from 'react-native';

import { JournalTheme } from '@/constants/theme';
import { getDaysInMonthCount } from '@/utils/dates';

type DayColumnProps = {
  year: number;
  month: number;
  loggedDays?: Set<number>;
};

export function DayColumn({ year, month, loggedDays }: DayColumnProps) {
  const daysCount = getDaysInMonthCount(year, month);
  const days = Array.from({ length: daysCount }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Days</Text>
      {days.map((day) => (
        <View key={day} style={styles.row}>
          <Text style={[styles.day, loggedDays?.has(day) && styles.logged]}>{day}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 36,
    paddingTop: 60,
  },
  title: {
    fontSize: 10,
    color: JournalTheme.textMuted,
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    height: 30,
    justifyContent: 'center',
  },
  day: {
    fontSize: 12,
    fontFamily: 'SpaceMono',
    color: JournalTheme.textMuted,
    textAlign: 'right',
    paddingRight: 6,
  },
  logged: {
    color: JournalTheme.text,
    fontWeight: '700',
  },
});
