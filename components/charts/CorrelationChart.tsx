import { useWindowDimensions, View, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { FONT_BODY, FONT_MONO } from '@/constants/theme';
import type { MetricDefinition, MetricLog } from '@/db/schema';
import { getDaysInMonthCount } from '@/utils/dates';

import { GridOverlay } from '../journal/atoms/GridOverlay';
import { SvgLineChart } from './SvgLineChart';

type CorrelationChartProps = {
  year: number;
  month: number;
  metricLogs: (MetricLog & { date: string })[];
  metricA: MetricDefinition;
  metricB: MetricDefinition;
  metricC?: MetricDefinition | null; // Sprint 4: optional third metric for triple correlation
};

function normalize(value: number, min: number, max: number) {
  if (max === min) return 50;
  return ((value - min) / (max - min)) * 100;
}

/** Pearson correlation coefficient for paired arrays. Returns null if insufficient data. */
function pearson(xs: number[], ys: number[]): number | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return null;
  const ax = xs.slice(0, n);
  const ay = ys.slice(0, n);
  const mx = ax.reduce((s, v) => s + v, 0) / n;
  const my = ay.reduce((s, v) => s + v, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = ax[i] - mx, dy = ay[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  return denom === 0 ? null : num / denom;
}

function pearsonObservation(r: number | null, nameA: string, nameB: string): string {
  if (r === null) return 'Not enough data points to compute correlation yet.';
  const abs = Math.abs(r);
  const direction = r > 0 ? 'positive' : 'negative';
  if (abs >= 0.7) return `Strong ${direction} correlation (r = ${r.toFixed(2)}): ${nameA} and ${nameB} move closely together this month.`;
  if (abs >= 0.4) return `Moderate ${direction} correlation (r = ${r.toFixed(2)}): ${nameA} and ${nameB} show a meaningful pattern.`;
  if (abs >= 0.2) return `Weak ${direction} correlation (r = ${r.toFixed(2)}): ${nameA} and ${nameB} may be related, but the signal is faint.`;
  return `No meaningful correlation (r = ${r.toFixed(2)}): ${nameA} and ${nameB} appear independent this month.`;
}

export function CorrelationChart({ year, month, metricLogs, metricA, metricB, metricC }: CorrelationChartProps) {
  const t = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth - 48, 900);
  const daysCount = getDaysInMonthCount(year, month);

  const dataA: { value: number; label: string }[] = [];
  const dataB: { value: number; label: string }[] = [];
  const dataC: { value: number; label: string }[] = [];
  const pairedA: number[] = [];
  const pairedB: number[] = [];
  const pairedAC: number[] = [];
  const pairedCA: number[] = [];
  const pairedBC: number[] = [];
  const pairedCB: number[] = [];

  for (let day = 1; day <= daysCount; day++) {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const logA = metricLogs.find((l) => l.date === dateKey && l.metricId === metricA.id);
    const logB = metricLogs.find((l) => l.date === dateKey && l.metricId === metricB.id);
    const logC = metricC ? metricLogs.find((l) => l.date === dateKey && l.metricId === metricC.id) : undefined;
    if (logA) dataA.push({ value: normalize(logA.value, metricA.minVal, metricA.maxVal), label: String(day) });
    if (logB) dataB.push({ value: normalize(logB.value, metricB.minVal, metricB.maxVal), label: String(day) });
    if (logC && metricC) dataC.push({ value: normalize(logC.value, metricC.minVal, metricC.maxVal), label: String(day) });
    if (logA && logB) { pairedA.push(logA.value); pairedB.push(logB.value); }
    if (logA && logC) { pairedAC.push(logA.value); pairedCA.push(logC.value); }
    if (logB && logC) { pairedBC.push(logB.value); pairedCB.push(logC.value); }
  }

  const hasData = dataA.length > 0 || dataB.length > 0 || dataC.length > 0;
  const rAB = pearson(pairedA, pairedB);
  const rAC = metricC ? pearson(pairedAC, pairedCA) : null;
  const rBC = metricC ? pearson(pairedBC, pairedCB) : null;
  const obsAB = pearsonObservation(rAB, metricA.name, metricB.name);
  const obsAC = metricC ? pearsonObservation(rAC, metricA.name, metricC.name) : null;
  const obsBC = metricC ? pearsonObservation(rBC, metricB.name, metricC.name) : null;

  return (
    <View style={styles.container}>
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: t.ink.blue }]} />
          <Text style={[styles.legendText, { fontFamily: FONT_MONO, color: t.faded, fontSize: 10 }]}>
            {metricA.name.toUpperCase()}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: t.ink.red }]} />
          <Text style={[styles.legendText, { fontFamily: FONT_MONO, color: t.faded, fontSize: 10 }]}>
            {metricB.name.toUpperCase()}
          </Text>
        </View>
        {metricC ? (
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: t.ink.black }]} />
            <Text style={[styles.legendText, { fontFamily: FONT_MONO, color: t.faded, fontSize: 10 }]}>
              {metricC.name.toUpperCase()}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Chart */}
      <View style={[styles.chartWrap, { width, borderColor: t.rule }]}>
        <GridOverlay cellSize={20} />
        {hasData ? (
          <SvgLineChart
            series={[
              { points: dataA, color: t.ink.blue },
              { points: dataB, color: t.ink.red },
              ...(metricC ? [{ points: dataC, color: t.ink.black }] : []),
            ]}
            width={width}
            height={200}
            minY={0}
            maxY={100}
            yLabels={['0', '50', '100']}
          />
        ) : null}
      </View>

      {/* Pearson observation(s) */}
      <View style={[styles.observationCard, { borderColor: t.rule, borderLeftColor: t.accent, backgroundColor: t.dark ? 'rgba(139,111,71,0.08)' : 'rgba(139,111,71,0.06)' }]}>
        <Text style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: t.accent, marginBottom: 4 }}>
          {metricC ? 'TRIPLE OBSERVATION' : 'OBSERVATION'}
        </Text>
        <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.ink.black, lineHeight: 20 }}>
          {obsAB}
        </Text>
        {obsAC ? (
          <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.ink.black, lineHeight: 20, marginTop: 6 }}>
            {obsAC}
          </Text>
        ) : null}
        {obsBC ? (
          <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.ink.black, lineHeight: 20, marginTop: 6 }}>
            {obsBC}
          </Text>
        ) : null}
        <Text style={{ fontFamily: FONT_MONO, fontSize: 9, color: t.faded, marginTop: 8, letterSpacing: 1 }}>
          VALUES NORMALIZED 0–100 FOR COMPARISON
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  legend: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: {},
  chartWrap: {
    height: 200,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
  },
  observationCard: {
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 12,
    marginTop: 12,
  },
});
