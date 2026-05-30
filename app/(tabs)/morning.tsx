// ─── Morning routine tab ────────────────────────────────────────────────────
// A focused morning landing screen:
//   - Yesterday's sleep summary
//   - Today's intention (one big priority)
//   - Custom morning routine checklist (user-managed in Setup)
//   - Quick nav to the full Daily journal

import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { DoubleRule } from '@/components/journal/atoms/DoubleRule';
import { GridOverlay } from '@/components/journal/atoms/GridOverlay';
import { SectionHeader } from '@/components/journal/atoms/SectionHeader';
import { FONT_BODY, FONT_HEADING, FONT_MONO } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useBottomPadding } from '@/hooks/useBottomPadding';
import { useDayEntry } from '@/hooks/useDayEntry';
import { useMorningRoutine } from '@/hooks/useMorningRoutine';
import { useMonthData } from '@/hooks/useMonthData';
import { useResponsive } from '@/hooks/useResponsive';
import { shiftDay } from '@/utils/dates';

export default function MorningScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = useBottomPadding();
  const { isDesktop } = useResponsive();

  // Memoize so hooks that take a Date in deps don't create a new object each render.
  const today = useMemo(() => new Date(), []);
  const yesterday = useMemo(() => shiftDay(today, -1), [today]);

  const { items, intention, isCompleted, toggle, saveIntention } = useMorningRoutine(today);
  const { entry: yEntry, saveSleep } = useDayEntry(yesterday);

  // Month config for hyper-focus banner
  const { config: monthConfig } = useMonthData(today.getFullYear(), today.getMonth() + 1);

  const [intentionDraft, setIntentionDraft] = useState('');
  useEffect(() => { setIntentionDraft(intention?.intention ?? ''); }, [intention]);

  // Inline sleep inputs for yesterday
  const [sleepHoursDraft, setSleepHoursDraft] = useState('');
  const [sleepScoreDraft, setSleepScoreDraft] = useState('');
  useEffect(() => {
    setSleepHoursDraft(yEntry?.sleepHours != null ? String(yEntry.sleepHours) : '');
    setSleepScoreDraft(yEntry?.sleepScore != null ? String(yEntry.sleepScore) : '');
  }, [yEntry?.sleepHours, yEntry?.sleepScore]);

  const handleSaveSleep = () => {
    const h = parseFloat(sleepHoursDraft);
    const s = parseInt(sleepScoreDraft, 10);
    saveSleep(isNaN(h) ? null : h, isNaN(s) ? null : s);
  };

  const completedCount = items.filter((it) => isCompleted(it.id)).length;
  const ratio = items.length > 0 ? completedCount / items.length : 0;

  const bg = t.dark ? 'rgba(255,240,200,0.04)' : 'rgba(255,250,235,0.6)';

  const sleepLine = yEntry?.sleepHours
    ? `${yEntry.sleepHours}h${yEntry.sleepScore != null ? ` · ${yEntry.sleepScore}/100` : ''}`
    : null;

  return (
    <View style={[styles.container, { backgroundColor: t.paper, paddingTop: insets.top + 8 }]}>
      <GridOverlay />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{
            fontFamily: FONT_MONO,
            fontSize: t.fs.meta,
            letterSpacing: 2.2,
            textTransform: 'uppercase',
            color: t.accent,
            marginBottom: 4,
          }}>
            ☼ Morning Routine · {format(today, 'EEEE, MMM d').toUpperCase()}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' }}>
            <Text style={{
              fontFamily: FONT_HEADING,
              fontSize: isDesktop ? 44 : 32,
              fontWeight: '700',
              color: t.ink.black,
              letterSpacing: -0.5,
            }}>
              Good morning.{' '}
            </Text>
            <Text style={{
              fontFamily: FONT_HEADING,
              fontSize: isDesktop ? 44 : 32,
              fontWeight: '400',
              fontStyle: 'italic',
              color: t.accent,
              letterSpacing: -0.5,
            }}>
              Activate.
            </Text>
          </View>
        </View>

        <DoubleRule marginTop={8} color={t.ink.black} />

        {/* Hyper-Focus banner — only shown if set in Setup */}
        {monthConfig?.hyperFocus ? (
          <View style={{
            marginHorizontal: 20, marginTop: 16,
            padding: 12, borderWidth: 1.5, borderLeftWidth: 4,
            borderColor: t.ink.blue, borderLeftColor: t.ink.blue,
            backgroundColor: t.dark ? 'rgba(30,58,138,0.22)' : 'rgba(30,58,138,0.08)',
          }}>
            <Text style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 2, fontWeight: '700', color: t.dark ? '#93C5FD' : t.ink.blue, marginBottom: 4 }}>
              ⚡ HYPER-FOCUS · {format(today, 'MMM').toUpperCase()}
            </Text>
            <Text style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: '700', color: t.ink.black, lineHeight: 22 }}>
              {monthConfig.hyperFocus}
            </Text>
          </View>
        ) : null}

        {/* Two-column on desktop, single on mobile */}
        <View style={[
          styles.grid,
          isDesktop ? { flexDirection: 'row', gap: 32 } : undefined,
          { paddingHorizontal: 20, marginTop: 24 },
        ]}>

          {/* LEFT — Intention + Yesterday's sleep */}
          <View style={isDesktop ? { flex: 1 } : undefined}>
            <SectionHeader eyebrow="01 · Last Night" title="Sleep" />
            <View style={[
              styles.card,
              {
                borderColor: t.rule,
                borderLeftColor: t.ink.blue,
                backgroundColor: bg,
              },
            ]}>
              {sleepLine ? (
                <>
                  <Text style={{ fontFamily: FONT_HEADING, fontSize: 28, fontWeight: '700', color: t.ink.black, lineHeight: 32 }}>
                    {sleepLine}
                  </Text>
                  <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, marginTop: 4 }}>
                    {(yEntry?.sleepHours ?? 0) >= 7 ? 'Good rest. Use it.' : 'Short night. Be kind to yourself today.'}
                  </Text>
                </>
              ) : (
                <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded }}>
                  Dün kaç saat uyudun?
                </Text>
              )}
              {/* Inline sleep inputs */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 1, color: t.faded, marginBottom: 4 }}>SAAT</Text>
                  <TextInput
                    style={[styles.sleepInput, { borderColor: t.rule, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_MONO }]}
                    placeholder="7.5"
                    placeholderTextColor={t.faded}
                    keyboardType="decimal-pad"
                    value={sleepHoursDraft}
                    onChangeText={setSleepHoursDraft}
                    onBlur={handleSaveSleep}
                    returnKeyType="next"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 1, color: t.faded, marginBottom: 4 }}>SKOR /100</Text>
                  <TextInput
                    style={[styles.sleepInput, { borderColor: t.rule, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_MONO }]}
                    placeholder="80"
                    placeholderTextColor={t.faded}
                    keyboardType="number-pad"
                    value={sleepScoreDraft}
                    onChangeText={setSleepScoreDraft}
                    onBlur={handleSaveSleep}
                    returnKeyType="done"
                  />
                </View>
              </View>
            </View>

            <View style={{ marginTop: 28 }}>
              <SectionHeader eyebrow="02 · Today" title="One priority" />
              <TextInput
                style={[
                  styles.textArea,
                  {
                    borderColor: t.rule,
                    borderLeftColor: t.ink.black,
                    color: t.ink.black,
                    fontFamily: FONT_BODY,
                    backgroundColor: bg,
                  },
                ]}
                multiline
                autoFocus={false}
                placeholder="The one thing that, if done, makes today a win…"
                placeholderTextColor={t.faded}
                value={intentionDraft}
                onChangeText={setIntentionDraft}
                onBlur={() => saveIntention(intentionDraft)}
              />
            </View>
          </View>

          {/* RIGHT — Checklist */}
          <View style={isDesktop ? { flex: 1 } : { marginTop: 28 }}>
            <SectionHeader
              eyebrow="03 · Activation"
              title="Morning checklist"
              action={items.length > 0 ? (
                <Text style={{
                  fontFamily: FONT_MONO, fontSize: 11,
                  color: t.accent, letterSpacing: 1,
                }}>
                  {completedCount} / {items.length}
                </Text>
              ) : undefined}
            />

            {/* Progress bar */}
            {items.length > 0 ? (
              <View style={{ height: 4, backgroundColor: t.rule, marginBottom: 16 }}>
                <View style={{
                  width: `${ratio * 100}%`,
                  height: '100%',
                  backgroundColor: ratio === 1 ? t.ink.blue : t.accent,
                }} />
              </View>
            ) : null}

            {items.length === 0 ? (
              <Text style={{
                fontFamily: FONT_BODY, fontStyle: 'italic',
                fontSize: 14, color: t.faded,
              }}>
                Add morning routine items in Setup → Morning Routine.
              </Text>
            ) : (
              items.map((item) => {
                const done = isCompleted(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggle(item.id)}
                    style={[styles.checkRow, { borderBottomColor: t.rule }]}>
                    <View style={{
                      width: 24, height: 24,
                      borderWidth: 1.5, borderColor: done ? t.ink.blue : t.rule,
                      backgroundColor: done ? t.ink.blue : 'transparent',
                      alignItems: 'center', justifyContent: 'center',
                      marginRight: 14,
                    }}>
                      {done ? <Text style={{ color: t.paper, fontSize: 16, fontWeight: '700' }}>✓</Text> : null}
                    </View>
                    <Text style={{
                      flex: 1,
                      fontFamily: FONT_BODY,
                      fontSize: 16,
                      color: done ? t.faded : t.ink.black,
                      textDecorationLine: done ? 'line-through' : 'none',
                      lineHeight: 22,
                    }}>
                      {item.text}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>

        {/* Footer CTA */}
        <View style={{ paddingHorizontal: 20, marginTop: 40 }}>
          <Pressable
            onPress={() => router.navigate('/(tabs)')}
            style={[styles.cta, { backgroundColor: t.ink.black }]}>
            <Text style={{
              fontFamily: FONT_BODY, fontSize: 16, fontWeight: '600',
              color: t.paper, letterSpacing: 0.3,
            }}>
              Open today's journal →
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  scroll: { flex: 1 },
  content: { paddingTop: 8 },
  grid: { flexDirection: 'column' },
  card: {
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 16,
  },
  textArea: {
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 14,
    minHeight: 110,
    fontSize: 16,
    lineHeight: 26,
    textAlignVertical: 'top',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cta: {
    padding: 16,
    alignItems: 'center',
  },
  sleepInput: {
    borderWidth: 1,
    padding: 8,
    fontSize: 15,
    textAlign: 'center',
  },
});
