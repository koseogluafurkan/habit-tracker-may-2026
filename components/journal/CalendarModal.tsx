import {
  addDays,
  addMonths,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { FONT_HEADING, FONT_MONO } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { getDaysInMonthCount } from '@/utils/dates';

type CalendarModalProps = {
  visible: boolean;
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
};

export function CalendarModal({ visible, selectedDate, onSelect, onClose }: CalendarModalProps) {
  const t = useTheme();
  const [viewMonth, setViewMonth] = useState(selectedDate);

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const daysInMonth = getDaysInMonthCount(viewMonth.getFullYear(), viewMonth.getMonth() + 1);
    const monthEnd = addDays(monthStart, daysInMonth - 1);
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let cursor = gridStart;
    while (cursor <= gridEnd) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }

    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
  }, [viewMonth]);

  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: t.paper, borderColor: t.rule }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Pressable onPress={() => setViewMonth(addMonths(viewMonth, -1))}>
              <Text style={[styles.nav, { color: t.accent }]}>‹</Text>
            </Pressable>
            <Text style={[styles.monthTitle, { fontFamily: FONT_HEADING, color: t.ink.black }]}>
              {format(viewMonth, 'MMMM yyyy')}
            </Text>
            <Pressable onPress={() => setViewMonth(addMonths(viewMonth, 1))}>
              <Text style={[styles.nav, { color: t.accent }]}>›</Text>
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {weekdays.map((d, i) => (
              <Text key={`${d}-${i}`} style={[styles.weekday, { fontFamily: FONT_MONO, color: t.faded }]}>
                {d}
              </Text>
            ))}
          </View>

          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((day) => {
                const inMonth = isSameMonth(day, viewMonth);
                const selected = isSameDay(day, selectedDate);
                return (
                  <Pressable
                    key={day.toISOString()}
                    style={[styles.dayCell, selected && { backgroundColor: t.accent }]}
                    onPress={() => {
                      onSelect(day);
                      onClose();
                    }}>
                    <Text
                      style={[
                        styles.dayText,
                        { color: inMonth ? t.ink.black : t.faded, fontFamily: FONT_MONO },
                        !inMonth && { opacity: 0.4 },
                        selected && { color: t.paper, fontWeight: '700' },
                      ]}>
                      {format(day, 'd')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(44,36,22,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    borderWidth: 1,
    padding: 16,
    maxWidth: 360,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nav: { fontSize: 24, paddingHorizontal: 8 },
  monthTitle: { fontSize: 16, fontWeight: '600' },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
  },
  weekRow: { flexDirection: 'row' },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 1,
  },
  dayText: { fontSize: 13 },
});
