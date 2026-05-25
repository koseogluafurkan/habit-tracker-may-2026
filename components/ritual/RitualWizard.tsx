import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { JournalTheme, getPenColor } from '@/constants/theme';
import { useDatabase } from '@/contexts/DatabaseContext';
import type { Habit, MetricDefinition } from '@/db/schema';
import { useDayEntry } from '@/hooks/useDayEntry';
import { useHabits } from '@/hooks/useHabits';
import { useMetrics } from '@/hooks/useMetrics';
import { formatDisplayDate } from '@/utils/dates';

import { HabitCell } from '../journal/HabitCell';

type RitualWizardProps = {
  date: Date;
  onComplete?: () => void;
};

const STEPS = ['moment', 'habits', 'sleep', 'metrics', 'done'] as const;
type Step = (typeof STEPS)[number];

export function RitualWizard({ date, onComplete }: RitualWizardProps) {
  const { refresh } = useDatabase();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const { habits } = useHabits(year, month);
  const { metrics } = useMetrics();
  const {
    entry,
    habitLogs,
    metricLogs,
    saveMemorableMoment,
    saveSleep,
    toggleHabit,
    setNumericHabit,
    setMetric,
  } = useDayEntry(date);

  const [step, setStep] = useState<Step>('moment');
  const [moment, setMoment] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [sleepScore, setSleepScore] = useState('');
  const [metricValues, setMetricValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (entry?.memorableMoment) setMoment(entry.memorableMoment);
    if (entry?.sleepHours != null) setSleepHours(String(entry.sleepHours));
    if (entry?.sleepScore != null) setSleepScore(String(entry.sleepScore));
  }, [entry]);

  useEffect(() => {
    const vals: Record<string, string> = {};
    for (const log of metricLogs) {
      vals[log.metricId] = String(log.value);
    }
    setMetricValues(vals);
  }, [metricLogs]);

  const stepIndex = STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const getHabitValue = (habitId: string) => habitLogs.find((l) => l.habitId === habitId)?.value;

  const handleNext = async () => {
    if (step === 'moment') {
      await saveMemorableMoment(moment);
    } else if (step === 'sleep') {
      await saveSleep(
        sleepHours ? parseFloat(sleepHours) : null,
        sleepScore ? parseInt(sleepScore, 10) : null
      );
    } else if (step === 'metrics') {
      for (const metric of metrics) {
        const val = metricValues[metric.id];
        if (val) await setMetric(metric.id, parseFloat(val));
      }
    }

    const next = STEPS[stepIndex + 1];
    if (next) {
      setStep(next);
      refresh();
    }
  };

  const handleBack = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Morning Ritual</Text>
      <Text style={styles.dateLabel}>{formatDisplayDate(date)}</Text>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {step === 'moment' && (
        <View style={styles.step}>
          <Text style={styles.stepTitle}>What was your win?</Text>
          <Text style={styles.stepHint}>One positive sentence from this day.</Text>
          <TextInput
            style={styles.textArea}
            multiline
            placeholder="Memorable moment..."
            placeholderTextColor={JournalTheme.textMuted}
            value={moment}
            onChangeText={setMoment}
          />
        </View>
      )}

      {step === 'habits' && (
        <View style={styles.step}>
          <Text style={styles.stepTitle}>Mark your habits</Text>
          {habits.length === 0 ? (
            <Text style={styles.stepHint}>No habits set up for this month. Add them in Setup.</Text>
          ) : (
            habits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                value={getHabitValue(habit.id)}
                onToggle={() => toggleHabit(habit.id, getHabitValue(habit.id))}
                onNumeric={(v) => setNumericHabit(habit.id, v)}
              />
            ))
          )}
        </View>
      )}

      {step === 'sleep' && (
        <View style={styles.step}>
          <Text style={styles.stepTitle}>Sleep</Text>
          <Text style={styles.label}>Hours slept</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="7.5"
            placeholderTextColor={JournalTheme.textMuted}
            value={sleepHours}
            onChangeText={setSleepHours}
          />
          <Text style={styles.label}>Sleep score (optional)</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="85"
            placeholderTextColor={JournalTheme.textMuted}
            value={sleepScore}
            onChangeText={setSleepScore}
          />
        </View>
      )}

      {step === 'metrics' && (
        <View style={styles.step}>
          <Text style={styles.stepTitle}>Lifestyle metrics</Text>
          {metrics.slice(0, 4).map((metric) => (
            <MetricInput
              key={metric.id}
              metric={metric}
              value={metricValues[metric.id] ?? ''}
              onChange={(v) => setMetricValues((prev) => ({ ...prev, [metric.id]: v }))}
            />
          ))}
        </View>
      )}

      {step === 'done' && (
        <View style={styles.step}>
          <Text style={styles.stepTitle}>Ritual complete</Text>
          <Text style={styles.stepHint}>
            Your journal spread has been updated. Stack micro-wins, one day at a time.
          </Text>
        </View>
      )}

      <View style={styles.nav}>
        {stepIndex > 0 && step !== 'done' && (
          <Pressable style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        )}
        {step !== 'done' ? (
          <Pressable style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextText}>{step === 'metrics' ? 'Finish' : 'Continue'}</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.nextBtn} onPress={onComplete}>
            <Text style={styles.nextText}>View Journal</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

function HabitRow({
  habit,
  value,
  onToggle,
  onNumeric,
}: {
  habit: Habit;
  value?: string;
  onToggle: () => void;
  onNumeric: (v: string) => void;
}) {
  const color = habit.color as 'black' | 'blue' | 'red';
  return (
    <View style={styles.habitRow}>
      <Text style={[styles.habitName, { color: getPenColor(color) }]}>{habit.name}</Text>
      {habit.type === 'boolean' ? (
        <HabitCell color={color} type="boolean" value={value} onPress={onToggle} size={36} />
      ) : (
        <TextInput
          style={[styles.numericInput, { color: getPenColor(color) }]}
          keyboardType="decimal-pad"
          placeholder="—"
          placeholderTextColor={JournalTheme.textMuted}
          value={value ?? ''}
          onChangeText={onNumeric}
        />
      )}
    </View>
  );
}

function MetricInput({
  metric,
  value,
  onChange,
}: {
  metric: MetricDefinition;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricName}>{metric.name}</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder={`${metric.minVal}–${metric.maxVal}`}
        placeholderTextColor={JournalTheme.textMuted}
        value={value}
        onChangeText={onChange}
      />
    </View>
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
  greeting: {
    fontSize: 28,
    fontFamily: 'Georgia',
    color: JournalTheme.text,
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 14,
    color: JournalTheme.textMuted,
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: JournalTheme.gridLine,
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: JournalTheme.accent,
  },
  step: {
    minHeight: 200,
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: 'Georgia',
    color: JournalTheme.text,
    marginBottom: 8,
  },
  stepHint: {
    fontSize: 14,
    color: JournalTheme.textMuted,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  textArea: {
    borderWidth: 1,
    borderColor: JournalTheme.border,
    borderRadius: 4,
    padding: 12,
    minHeight: 100,
    fontSize: 16,
    fontFamily: 'Georgia',
    color: JournalTheme.text,
    textAlignVertical: 'top',
    backgroundColor: '#FFFDF9',
  },
  input: {
    borderWidth: 1,
    borderColor: JournalTheme.border,
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
    color: JournalTheme.text,
    marginBottom: 12,
    backgroundColor: '#FFFDF9',
  },
  label: {
    fontSize: 13,
    color: JournalTheme.textMuted,
    marginBottom: 4,
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
    fontSize: 15,
    flex: 1,
    fontFamily: 'Georgia',
  },
  numericInput: {
    width: 60,
    borderWidth: 1,
    borderColor: JournalTheme.border,
    borderRadius: 4,
    padding: 8,
    textAlign: 'center',
    fontSize: 14,
    backgroundColor: '#FFFDF9',
  },
  metricRow: {
    marginBottom: 12,
  },
  metricName: {
    fontSize: 14,
    color: JournalTheme.text,
    marginBottom: 4,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backText: {
    color: JournalTheme.textMuted,
    fontSize: 16,
  },
  nextBtn: {
    backgroundColor: JournalTheme.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
  },
  nextText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
