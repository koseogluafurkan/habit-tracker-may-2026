import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  HABIT_COLORS,
  HABIT_TYPES,
  JournalTheme,
  getPenColor,
  type HabitColor,
  type HabitType,
} from '@/constants/theme';
import { useDatabase } from '@/contexts/DatabaseContext';
import { upsertMonthConfig } from '@/db/operations';
import { useHabits } from '@/hooks/useHabits';
import { useMetrics } from '@/hooks/useMetrics';
import { useMonthData } from '@/hooks/useMonthData';
import { useBottomPadding } from '@/hooks/useBottomPadding';
import { exportDataToFile, importDataFromFile } from '@/utils/export';
import { formatMonthYear } from '@/utils/dates';

export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const bottomPadding = useBottomPadding();
  const { refresh } = useDatabase();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const { habits, addHabit, removeHabit } = useHabits(year, month);
  const { metrics } = useMetrics();
  const { config } = useMonthData(year, month);

  const [habitName, setHabitName] = useState('');
  const [habitColor, setHabitColor] = useState<HabitColor>('black');
  const [habitType, setHabitType] = useState<HabitType>('boolean');
  const [nextMonthIdeas, setNextMonthIdeas] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');

  useEffect(() => {
    setNextMonthIdeas(config?.nextMonthIdeas ?? '');
    setReminderMessage(config?.reminderMessage ?? '');
  }, [config]);

  const handleAddHabit = async () => {
    if (!habitName.trim()) return;
    if (habits.length >= 8) {
      Alert.alert('Keep it focused', 'Track no more than 8 habits per month.');
      return;
    }
    await addHabit(habitName.trim(), habitColor, habitType);
    setHabitName('');
  };

  const handleSaveMonthConfig = async () => {
    await upsertMonthConfig(year, month, {
      nextMonthIdeas: nextMonthIdeas || null,
      reminderMessage: reminderMessage || null,
    });
    refresh();
    Alert.alert('Saved', 'Month settings updated.');
  };

  const handleExport = async () => {
    try {
      await exportDataToFile();
    } catch (e) {
      Alert.alert('Export failed', String(e));
    }
  };

  const handleImport = async () => {
    try {
      const ok = await importDataFromFile();
      if (ok) refresh();
    } catch (e) {
      Alert.alert('Import failed', String(e));
    }
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}>
      <Text style={styles.title}>Setup</Text>
      <Text style={styles.month}>{formatMonthYear(year, month)}</Text>

      <Text style={styles.sectionTitle}>Baseline Habits</Text>
      <Text style={styles.hint}>
        Keep habits minimal. Black = non-negotiables, Blue = positive, Red = bad habits to
        acknowledge.
      </Text>

      {habits.map((h) => (
        <View key={h.id} style={styles.habitItem}>
          <Text style={[styles.habitItemName, { color: getPenColor(h.color as HabitColor) }]}>
            {h.name}
          </Text>
          <Text style={styles.habitItemMeta}>
            {h.type} · {h.color}
          </Text>
          <Pressable onPress={() => removeHabit(h.id)}>
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        </View>
      ))}

      {habits.length === 0 && (
        <Text style={styles.empty}>No habits yet. Add your first baseline habit below.</Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Habit name (e.g. Exercise)"
        placeholderTextColor={JournalTheme.textMuted}
        value={habitName}
        onChangeText={setHabitName}
      />

      <View style={styles.optionRow}>
        {HABIT_COLORS.map((c) => (
          <Pressable
            key={c.value}
            style={[styles.colorBtn, habitColor === c.value && styles.colorBtnActive]}
            onPress={() => setHabitColor(c.value)}>
            <View style={[styles.colorDot, { backgroundColor: getPenColor(c.value) }]} />
            <Text style={styles.colorLabel}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.optionRow}>
        {HABIT_TYPES.map((t) => (
          <Pressable
            key={t.value}
            style={[styles.typeBtn, habitType === t.value && styles.typeBtnActive]}
            onPress={() => setHabitType(t.value)}>
            <Text style={[styles.typeText, habitType === t.value && styles.typeTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.addBtn} onPress={handleAddHabit}>
        <Text style={styles.addBtnText}>Add Habit</Text>
      </Pressable>

      <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Month Notes</Text>
      <Text style={styles.label}>Reminder message for this month</Text>
      <TextInput
        style={styles.input}
        placeholder='e.g. "Stay present"'
        placeholderTextColor={JournalTheme.textMuted}
        value={reminderMessage}
        onChangeText={setReminderMessage}
      />
      <Text style={styles.label}>Ideas for next month</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        placeholder="Habits to add, things to change..."
        placeholderTextColor={JournalTheme.textMuted}
        value={nextMonthIdeas}
        onChangeText={setNextMonthIdeas}
      />
      <Pressable style={styles.saveBtn} onPress={handleSaveMonthConfig}>
        <Text style={styles.saveBtnText}>Save Month Settings</Text>
      </Pressable>

      <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Metrics</Text>
      <Text style={styles.hint}>Default metrics for lifestyle graphs: {metrics.map((m) => m.name).join(', ')}</Text>

      <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Backup</Text>
      <Pressable style={styles.exportBtn} onPress={handleExport}>
        <Text style={styles.exportBtnText}>Export JSON Backup</Text>
      </Pressable>
      <Pressable style={styles.importBtn} onPress={handleImport}>
        <Text style={styles.importBtnText}>Import JSON Backup</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: JournalTheme.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Georgia',
    color: JournalTheme.text,
  },
  month: {
    fontSize: 14,
    color: JournalTheme.textMuted,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Georgia',
    color: JournalTheme.text,
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: JournalTheme.textMuted,
    marginBottom: 12,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  empty: {
    fontSize: 14,
    color: JournalTheme.textMuted,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: JournalTheme.gridLine,
    gap: 8,
  },
  habitItemName: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Georgia',
  },
  habitItemMeta: {
    fontSize: 11,
    color: JournalTheme.textMuted,
  },
  remove: {
    fontSize: 12,
    color: JournalTheme.pen.red,
  },
  input: {
    borderWidth: 1,
    borderColor: JournalTheme.border,
    borderRadius: 4,
    padding: 12,
    fontSize: 15,
    color: JournalTheme.text,
    marginBottom: 12,
    backgroundColor: '#FFFDF9',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 13,
    color: JournalTheme.textMuted,
    marginBottom: 4,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  colorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: JournalTheme.border,
    gap: 6,
  },
  colorBtnActive: {
    borderColor: JournalTheme.accent,
    backgroundColor: 'rgba(139,115,85,0.08)',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  colorLabel: {
    fontSize: 11,
    color: JournalTheme.text,
  },
  typeBtn: {
    padding: 8,
    borderWidth: 1,
    borderColor: JournalTheme.border,
  },
  typeBtnActive: {
    borderColor: JournalTheme.accent,
    backgroundColor: JournalTheme.accent,
  },
  typeText: {
    fontSize: 12,
    color: JournalTheme.text,
  },
  typeTextActive: {
    color: '#FFF',
  },
  addBtn: {
    backgroundColor: JournalTheme.accent,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  addBtnText: {
    color: '#FFF',
    fontWeight: '600',
  },
  saveBtn: {
    borderWidth: 1,
    borderColor: JournalTheme.accent,
    padding: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: JournalTheme.accent,
    fontWeight: '600',
  },
  exportBtn: {
    backgroundColor: JournalTheme.pen.blue,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  exportBtnText: {
    color: '#FFF',
    fontWeight: '600',
  },
  importBtn: {
    borderWidth: 1,
    borderColor: JournalTheme.pen.blue,
    padding: 14,
    alignItems: 'center',
  },
  importBtnText: {
    color: JournalTheme.pen.blue,
    fontWeight: '600',
  },
});
