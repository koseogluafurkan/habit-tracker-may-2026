import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CorrelationChart } from '@/components/charts/CorrelationChart';
import { SleepChart } from '@/components/charts/SleepChart';
import { JournalTheme } from '@/constants/theme';
import type { MetricDefinition } from '@/db/schema';
import { useMetrics } from '@/hooks/useMetrics';
import { useMonthData } from '@/hooks/useMonthData';
import { useBottomPadding } from '@/hooks/useBottomPadding';
import { formatMonthYear, shiftMonth } from '@/utils/dates';

export default function GraphsScreen() {
  const insets = useSafeAreaInsets();
  const bottomPadding = useBottomPadding();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const { dayEntries, metricLogs, loading } = useMonthData(year, month);
  const { metrics } = useMetrics();
  const [metricA, setMetricA] = useState<MetricDefinition | null>(null);
  const [metricB, setMetricB] = useState<MetricDefinition | null>(null);

  const changeMonth = (delta: number) => {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  };

  const selectedA = metricA ?? metrics[0] ?? null;
  const selectedB = metricB ?? metrics[1] ?? null;

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + 8 }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}>
      <Text style={styles.title}>The Science Experiment</Text>
      <Text style={styles.subtitle}>Visualize how habits impact your well-being.</Text>

      <View style={styles.header}>
        <Pressable onPress={() => changeMonth(-1)}>
          <Text style={styles.navBtn}>‹</Text>
        </Pressable>
        <Text style={styles.month}>{formatMonthYear(year, month)}</Text>
        <Pressable onPress={() => changeMonth(1)}>
          <Text style={styles.navBtn}>›</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Sleep Graph</Text>
      <Text style={styles.sectionHint}>Hours slept per day (4–10 scale)</Text>
      {!loading && <SleepChart year={year} month={month} dayEntries={dayEntries} />}

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Lifestyle Correlation</Text>
      <Text style={styles.sectionHint}>Compare two metrics to spot patterns</Text>

      <View style={styles.pickerRow}>
        <Text style={styles.pickerLabel}>Metric A:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {metrics.map((m) => (
            <Pressable
              key={m.id}
              style={[styles.chip, selectedA?.id === m.id && styles.chipActive]}
              onPress={() => setMetricA(m)}>
              <Text style={[styles.chipText, selectedA?.id === m.id && styles.chipTextActive]}>
                {m.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.pickerRow}>
        <Text style={styles.pickerLabel}>Metric B:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {metrics.map((m) => (
            <Pressable
              key={m.id}
              style={[styles.chip, selectedB?.id === m.id && styles.chipActive]}
              onPress={() => setMetricB(m)}>
              <Text style={[styles.chipText, selectedB?.id === m.id && styles.chipTextActive]}>
                {m.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {selectedA && selectedB && !loading && (
        <CorrelationChart
          year={year}
          month={month}
          metricLogs={metricLogs}
          metricA={selectedA}
          metricB={selectedB}
        />
      )}
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
    fontSize: 24,
    fontFamily: 'Georgia',
    color: JournalTheme.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: JournalTheme.textMuted,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  navBtn: {
    fontSize: 24,
    color: JournalTheme.accent,
  },
  month: {
    fontSize: 16,
    fontFamily: 'Georgia',
    color: JournalTheme.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Georgia',
    color: JournalTheme.text,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12,
    color: JournalTheme.textMuted,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  pickerRow: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 12,
    color: JournalTheme.textMuted,
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: JournalTheme.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: JournalTheme.pen.blue,
    borderColor: JournalTheme.pen.blue,
  },
  chipText: {
    fontSize: 12,
    color: JournalTheme.text,
  },
  chipTextActive: {
    color: '#FFF',
  },
});
