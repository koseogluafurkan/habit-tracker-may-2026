import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { JournalTheme } from '@/constants/theme';
import type { DayEntry } from '@/db/schema';
import { getDaysInMonthCount } from '@/utils/dates';

type MemorableMomentsProps = {
  year: number;
  month: number;
  dayEntries: DayEntry[];
  onEdit?: (day: number, text: string) => void;
  onDayPress?: (day: number) => void;
  readOnly?: boolean;
};

export function MemorableMoments({
  year,
  month,
  dayEntries,
  onEdit,
  onDayPress,
  readOnly,
}: MemorableMomentsProps) {
  const daysCount = getDaysInMonthCount(year, month);

  const getMoment = (day: number) => {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dayEntries.find((e) => e.date === dateKey)?.memorableMoment ?? '';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Memorable Moments</Text>
      <Text style={styles.hint}>Tap a day number to open its full journal entry.</Text>
      {Array.from({ length: daysCount }, (_, i) => i + 1).map((day) => (
        <View key={day} style={styles.row}>
          <Pressable
            onPress={() => onDayPress?.(day)}
            disabled={!onDayPress}
            style={styles.dayBtn}>
            <Text style={[styles.dayLabel, onDayPress && styles.dayLabelLink]}>{day}</Text>
          </Pressable>
          {readOnly ? (
            <Text style={styles.momentText} numberOfLines={1}>
              {getMoment(day) || '—'}
            </Text>
          ) : (
            <TextInput
              style={styles.input}
              placeholder="One win from this day..."
              placeholderTextColor={JournalTheme.textMuted}
              value={getMoment(day)}
              onChangeText={(text) => onEdit?.(day, text)}
            />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: JournalTheme.text,
    marginBottom: 4,
    fontFamily: 'Georgia',
  },
  hint: {
    fontSize: 11,
    color: JournalTheme.textMuted,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 30,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: JournalTheme.gridLine,
  },
  dayBtn: {
    width: 28,
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 11,
    fontFamily: 'SpaceMono',
    color: JournalTheme.textMuted,
  },
  dayLabelLink: {
    color: JournalTheme.accent,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    fontSize: 12,
    color: JournalTheme.text,
    paddingVertical: 4,
    fontFamily: 'Georgia',
  },
  momentText: {
    flex: 1,
    fontSize: 12,
    color: JournalTheme.text,
    fontFamily: 'Georgia',
  },
});
