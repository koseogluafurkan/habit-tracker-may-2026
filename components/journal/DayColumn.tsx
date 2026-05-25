import { StyleSheet, Text, View } from 'react-native';

import { FONT_MONO } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { getDaysInMonthCount } from '@/utils/dates';

type DayColumnProps = {
  year: number;
  month: number;
  loggedDays?: Set<number>;
};

export function DayColumn({ year, month, loggedDays }: DayColumnProps) {
  const t = useTheme();
  const daysCount = getDaysInMonthCount(year, month);
  const days = Array.from({ length: daysCount }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontFamily: FONT_MONO, color: t.faded }]}>Days</Text>
      {days.map((day) => (
        <View key={day} style={styles.row}>
          <Text style={[
            styles.day,
            { fontFamily: FONT_MONO, color: t.faded },
            loggedDays?.has(day) && { color: t.ink.black, fontWeight: '700' },
          ]}>
            {day}
          </Text>
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
    textAlign: 'right',
    paddingRight: 6,
  },
});
