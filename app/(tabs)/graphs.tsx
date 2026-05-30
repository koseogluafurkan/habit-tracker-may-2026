import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';

import { CorrelationChart } from '@/components/charts/CorrelationChart';
import { SleepChart } from '@/components/charts/SleepChart';
import { DoubleRule } from '@/components/journal/atoms/DoubleRule';
import { GridOverlay } from '@/components/journal/atoms/GridOverlay';
import { useTheme } from '@/contexts/ThemeContext';
import { FONT_BODY, FONT_HEADING, FONT_MONO } from '@/constants/theme';
import type { MetricDefinition } from '@/db/schema';
import { useMetrics } from '@/hooks/useMetrics';
import { useMonthData } from '@/hooks/useMonthData';
import { useBottomPadding } from '@/hooks/useBottomPadding';
import { useResponsive } from '@/hooks/useResponsive';
import { shiftMonth } from '@/utils/dates';

export default function GraphsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = useBottomPadding();
  const { columns } = useResponsive();
  const isDesktop = columns === 2;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const { dayEntries, metricLogs, loading } = useMonthData(year, month);
  const { metrics } = useMetrics();
  const [metricA, setMetricA] = useState<MetricDefinition | null>(null);
  const [metricB, setMetricB] = useState<MetricDefinition | null>(null);
  const [metricC, setMetricC] = useState<MetricDefinition | null>(null);
  const [tripleMode, setTripleMode] = useState(true); // Sprint 4: triple correlation default

  const changeMonth = (delta: number) => {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  };

  // Sprint 4 default triple: Sleep Hours / Morning Activation / Evening Lost Time
  // Falls back to first three metrics if names don't match.
  const byName = (name: string) =>
    metrics.find((m) => m.name.toLowerCase() === name.toLowerCase());
  const selectedA = metricA ?? byName('Sleep Hours')        ?? metrics[0] ?? null;
  const selectedB = metricB ?? byName('Morning Activation') ?? metrics[1] ?? null;
  const selectedC = metricC ?? byName('Evening Lost Time')  ?? metrics[2] ?? null;

  const monthName = format(new Date(year, month - 1, 1), 'MMMM');
  const yearStr = String(year);

  return (
    <View style={[styles.container, { backgroundColor: t.paper, paddingTop: insets.top + 8 }]}>
      <GridOverlay />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingHorizontal: 20 }]}>
        <Pressable onPress={() => changeMonth(-1)} hitSlop={12} style={styles.navBtn}>
          <Text style={[styles.navText, { color: t.accent }]}>‹</Text>
        </Pressable>

        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{
            fontFamily: FONT_MONO,
            fontSize: t.fs.meta,
            letterSpacing: 2.2,
            textTransform: 'uppercase',
            color: t.accent,
            marginBottom: 4,
          }}>
            The science experiment
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{
              fontFamily: FONT_HEADING,
              fontSize: isDesktop ? 44 : 32,
              fontWeight: '700',
              color: t.ink.black,
              letterSpacing: -0.5,
            }}>
              {monthName}{' '}
            </Text>
            <Text style={{
              fontFamily: FONT_HEADING,
              fontSize: isDesktop ? 44 : 32,
              fontWeight: '400',
              fontStyle: 'italic',
              color: t.accent,
              letterSpacing: -0.5,
            }}>
              {yearStr}
            </Text>
          </View>
        </View>

        <Pressable onPress={() => changeMonth(1)} hitSlop={12} style={styles.navBtn}>
          <Text style={[styles.navText, { color: t.accent }]}>›</Text>
        </Pressable>
      </View>

      <DoubleRule marginTop={8} color={t.ink.black} />

      {/* ── Body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}>

        {/* Sleep section */}
        <View style={[styles.sectionLabel, { borderBottomColor: t.ink.black }]}>
          <Text style={[styles.sectionLabelText, { fontFamily: FONT_MONO, color: t.ink.black }]}>
            01 · SLEEP GRAPH · HOURS / NIGHT
          </Text>
        </View>

        {!loading && (
          <>
            <SleepChart year={year} month={month} dayEntries={dayEntries} />
            {dayEntries.every((e) => e.sleepHours == null) && dayEntries.length > 0 ? (
              <View style={{ paddingHorizontal: 4, paddingTop: 8, paddingBottom: 4 }}>
                <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, lineHeight: 20 }}>
                  Henüz uyku verisi yok. Her sabah Morning ekranından önceki geceyi kaydet — grafik kendiliğinden oluşacak.
                </Text>
              </View>
            ) : null}
          </>
        )}

        {/* Correlation section */}
        <View style={[styles.sectionLabel, { borderBottomColor: t.ink.black, marginTop: t.sp.xl }]}>
          <Text style={[styles.sectionLabelText, { fontFamily: FONT_MONO, color: t.ink.black }]}>
            02 · LIFESTYLE CORRELATION {tripleMode ? '· TRIPLE' : '· DUAL'}
          </Text>
        </View>

        {/* Dual / Triple toggle */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: t.sp.md }}>
          {([
            { key: false, label: 'Dual' },
            { key: true,  label: 'Triple (Sprint 4)' },
          ] as { key: boolean; label: string }[]).map(({ key, label }) => {
            const active = tripleMode === key;
            return (
              <Pressable
                key={String(key)}
                onPress={() => setTripleMode(key)}
                style={[
                  styles.chip,
                  {
                    borderColor: active ? t.ink.black : t.rule,
                    backgroundColor: active ? t.ink.black : 'transparent',
                  },
                ]}>
                <Text style={{
                  fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 1.2,
                  fontWeight: '700',
                  color: active ? t.paper : t.ink.black,
                  textTransform: 'uppercase',
                }}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {metrics.length >= 2 ? (
          <>
            {/* Metric A picker */}
            <View style={{ marginBottom: t.sp.sm }}>
              <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2, textTransform: 'uppercase', color: t.accent, marginBottom: t.sp.xs }}>
                Metric A
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {metrics.map((m) => {
                    const active = selectedA?.id === m.id;
                    return (
                      <Pressable
                        key={m.id}
                        onPress={() => setMetricA(m)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? t.ink.blue : 'transparent',
                            borderColor: active ? t.ink.blue : t.rule,
                          },
                        ]}>
                        <Text style={{
                          fontFamily: FONT_MONO,
                          fontSize: 11,
                          letterSpacing: 1.2,
                          color: active ? '#FFF' : t.faded,
                          textTransform: 'uppercase',
                        }}>
                          {m.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Metric B picker */}
            <View style={{ marginBottom: t.sp.md }}>
              <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2, textTransform: 'uppercase', color: t.accent, marginBottom: t.sp.xs }}>
                Metric B
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {metrics.map((m) => {
                    const active = selectedB?.id === m.id;
                    return (
                      <Pressable
                        key={m.id}
                        onPress={() => setMetricB(m)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? t.ink.red : 'transparent',
                            borderColor: active ? t.ink.red : t.rule,
                          },
                        ]}>
                        <Text style={{
                          fontFamily: FONT_MONO,
                          fontSize: 11,
                          letterSpacing: 1.2,
                          color: active ? '#FFF' : t.faded,
                          textTransform: 'uppercase',
                        }}>
                          {m.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Metric C picker — only when triple */}
            {tripleMode ? (
              <View style={{ marginBottom: t.sp.md }}>
                <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2, textTransform: 'uppercase', color: t.accent, marginBottom: t.sp.xs }}>
                  Metric C
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {metrics.map((m) => {
                      const active = selectedC?.id === m.id;
                      return (
                        <Pressable
                          key={m.id}
                          onPress={() => setMetricC(m)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: active ? t.ink.black : 'transparent',
                              borderColor: active ? t.ink.black : t.rule,
                            },
                          ]}>
                          <Text style={{
                            fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 1.2,
                            fontWeight: '700',
                            color: active ? t.paper : t.ink.black,
                            textTransform: 'uppercase',
                          }}>
                            {m.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            ) : null}

            {selectedA && selectedB && !loading && (
              <CorrelationChart
                year={year}
                month={month}
                metricLogs={metricLogs}
                metricA={selectedA}
                metricB={selectedB}
                metricC={tripleMode ? selectedC : null}
              />
            )}
          </>
        ) : (
          <View style={{ marginTop: t.sp.sm, gap: 8 }}>
            <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, color: t.faded, fontStyle: 'italic' }}>
              Add at least two metrics in Setup to enable correlation charts.
            </Text>
            <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, lineHeight: 20 }}>
              Veri geldikçe grafik oluşacak. Her gün bir satır — devam et.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  navBtn: { paddingHorizontal: 8 },
  navText: { fontSize: 28, lineHeight: 32 },
  scroll: { flex: 1 },
  content: { padding: 20 },
  sectionLabel: {
    paddingBottom: 8,
    marginBottom: 12,
    borderBottomWidth: 1.5,
  },
  sectionLabelText: {
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
});
