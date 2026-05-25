import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { JournalTheme } from '@/constants/theme';
import { isToday, shiftDay } from '@/utils/dates';

import { CalendarModal } from './CalendarModal';

type CompactDayPickerProps = {
  selectedDate: Date;
  onSelect: (date: Date) => void;
};

export function CompactDayPicker({ selectedDate, onSelect }: CompactDayPickerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart.getTime()]
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable onPress={() => onSelect(shiftDay(selectedDate, -7))} hitSlop={8}>
          <Text style={styles.nav}>‹</Text>
        </Pressable>

        <View style={styles.days}>
          {weekDays.map((day) => {
            const selected = isSameDay(day, selectedDate);
            const today = isToday(day);
            return (
              <Pressable
                key={day.toISOString()}
                onPress={() => onSelect(day)}
                style={[styles.chip, selected && styles.chipSelected, today && !selected && styles.chipToday]}>
                <Text style={[styles.name, selected && styles.chipTextSelected]}>
                  {format(day, 'EEE')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={() => onSelect(shiftDay(selectedDate, 7))} hitSlop={8}>
          <Text style={styles.nav}>›</Text>
        </Pressable>

        <Pressable style={styles.calBtn} onPress={() => setCalendarOpen(true)}>
          <Text style={styles.calIcon}>📅</Text>
        </Pressable>
      </View>

      <CalendarModal
        visible={calendarOpen}
        selectedDate={selectedDate}
        onSelect={onSelect}
        onClose={() => setCalendarOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nav: {
    fontSize: 20,
    color: JournalTheme.accent,
    width: 24,
    textAlign: 'center',
  },
  days: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 2,
  },
  chip: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: JournalTheme.border,
    backgroundColor: '#FFFDF9',
  },
  chipSelected: {
    backgroundColor: JournalTheme.accent,
    borderColor: JournalTheme.accent,
  },
  chipToday: {
    borderColor: JournalTheme.pen.blue,
  },
  name: {
    fontSize: 11,
    fontWeight: '600',
    color: JournalTheme.textMuted,
    textTransform: 'uppercase',
  },
  chipTextSelected: {
    color: '#FFF',
  },
  calBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  calIcon: {
    fontSize: 18,
  },
});
