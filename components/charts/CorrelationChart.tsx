import { useWindowDimensions, View, StyleSheet, Text } from 'react-native';

import { JournalTheme } from '@/constants/theme';
import type { MetricDefinition, MetricLog } from '@/db/schema';
import { getDaysInMonthCount } from '@/utils/dates';

import { GridBackground } from '../journal/GridBackground';
import { SvgLineChart } from './SvgLineChart';

type CorrelationChartProps = {
  year: number;
  month: number;
  metricLogs: (MetricLog & { date: string })[];
  metricA: MetricDefinition;
  metricB: MetricDefinition;
};

function normalize(value: number, min: number, max: number) {
  if (max === min) return 50;
  return ((value - min) / (max - min)) * 100;
}

export function CorrelationChart({ year, month, metricLogs, metricA, metricB }: CorrelationChartProps) {
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth - 48, 900);
  const daysCount = getDaysInMonthCount(year, month);

  const dataA: { value: number; label: string }[] = [];
  const dataB: { value: number; label: string }[] = [];

  for (let day = 1; day <= daysCount; day++) {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const logA = metricLogs.find((l) => l.date === dateKey && l.metricId === metricA.id);
    const logB = metricLogs.find((l) => l.date === dateKey && l.metricId === metricB.id);
    if (logA) dataA.push({ value: normalize(logA.value, metricA.minVal, metricA.maxVal), label: String(day) });
    if (logB) dataB.push({ value: normalize(logB.value, metricB.minVal, metricB.maxVal), label: String(day) });
  }

  const hasData = dataA.length > 0 || dataB.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: JournalTheme.pen.blue }]} />
          <Text style={styles.legendText}>{metricA.name}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: JournalTheme.pen.red }]} />
          <Text style={styles.legendText}>{metricB.name}</Text>
        </View>
      </View>
      <View style={[styles.chartWrap, { width }]}>
        <GridBackground width={width} height={200} />
        {hasData ? (
          <SvgLineChart
            series={[
              { points: dataA, color: JournalTheme.pen.blue },
              { points: dataB, color: JournalTheme.pen.red },
            ]}
            width={width}
            height={200}
            minY={0}
            maxY={100}
            yLabels={['0', '50', '100']}
          />
        ) : null}
      </View>
      <Text style={styles.note}>Values normalized to 0–100 for comparison</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  legend: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: JournalTheme.text },
  chartWrap: {
    height: 200,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: JournalTheme.border,
  },
  note: { fontSize: 10, color: JournalTheme.textMuted, marginTop: 6, fontStyle: 'italic' },
});
