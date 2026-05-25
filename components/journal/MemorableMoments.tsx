import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FONT_BODY, FONT_MONO } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
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
  const t = useTheme();
  const daysCount = getDaysInMonthCount(year, month);

  const getMoment = (day: number) => {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dayEntries.find((e) => e.date === dateKey)?.memorableMoment ?? '';
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: daysCount }, (_, i) => i + 1).map((day) => (
        <View key={day} style={[styles.row, { borderBottomColor: t.rule }]}>
          <Pressable
            onPress={() => onDayPress?.(day)}
            disabled={!onDayPress}
            style={styles.dayBtn}>
            <Text style={[
              styles.dayLabel,
              { fontFamily: FONT_MONO, color: onDayPress ? t.accent : t.faded },
              onDayPress && { fontWeight: '700' },
            ]}>
              {day}
            </Text>
          </Pressable>
          {readOnly ? (
            <Text style={[styles.momentText, { fontFamily: FONT_BODY, color: t.ink.black }]} numberOfLines={1}>
              {getMoment(day) || '—'}
            </Text>
          ) : (
            <TextInput
              style={[styles.input, { fontFamily: FONT_BODY, color: t.ink.black }]}
              placeholder="One win from this day..."
              placeholderTextColor={t.faded}
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
    paddingTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 30,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayBtn: {
    width: 28,
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 11,
  },
  input: {
    flex: 1,
    fontSize: 12,
    paddingVertical: 4,
    lineHeight: 20,
  },
  momentText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 20,
  },
});
