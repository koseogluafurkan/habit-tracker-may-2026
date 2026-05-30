import { getDayOfYear } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/contexts/ThemeContext';
import { useDaySelection } from '@/contexts/DaySelectionContext';
import { useBottomPadding } from '@/hooks/useBottomPadding';
import { useDayEntry } from '@/hooks/useDayEntry';
import { useHabits } from '@/hooks/useHabits';
import { useMetrics } from '@/hooks/useMetrics';
import { useMonthData } from '@/hooks/useMonthData';
import { useResponsive } from '@/hooks/useResponsive';
import { useMorningRevisit } from '@/hooks/useMorningRevisit';
import { setHabitLogNote } from '@/db/operations';
import { useDatabase } from '@/contexts/DatabaseContext';
import {
  FONT_HEADING, FONT_MONO, FONT_BODY,
  DAILY_QUOTES, habitLabel,
  type HabitColor,
} from '@/constants/theme';
import { isHabitActiveOn } from '@/db/operations';
import type { Habit } from '@/db/schema';
import {
  formatDisplayDate,
  isFutureDate,
  isToday,
  shiftDay,
  toDateKey,
} from '@/utils/dates';
import { syncReminderToCalendar } from '@/utils/calendar';
import { format } from 'date-fns';

import { InkCheck } from './atoms/InkCheck';
import { SectionHeader } from './atoms/SectionHeader';
import { DoubleRule } from './atoms/DoubleRule';
import { GridOverlay } from './atoms/GridOverlay';
import { CalendarModal } from './CalendarModal';
import { MorningRevisitModal } from './MorningRevisitModal';
import { NumericInputModal } from '@/components/NumericInputModal';
import { StickyRemindersBanner } from '@/components/StickyRemindersBanner';

// ─── Day-of-year helper ───────────────────────────────────────────────────
function getDayLabel(date: Date): string {
  const day = getDayOfYear(date);
  return `${format(date, 'EEEE').toUpperCase()} · DAY ${day} OF ${date.getFullYear()}`;
}

// ─── Rotating daily quote ─────────────────────────────────────────────────
function getDailyQuote(date: Date): string {
  const idx = getDayOfYear(date) % DAILY_QUOTES.length;
  return DAILY_QUOTES[idx];
}

// ─── Week strip ───────────────────────────────────────────────────────────
function WeekStrip({
  selectedDate,
  onSelect,
  onCalendar,
}: {
  selectedDate: Date;
  onSelect: (d: Date) => void;
  onCalendar: () => void;
}) {
  const t = useTheme();
  const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Build the 7-day window centred on the selected date's week (Mon–Sun)
  const weekStart = new Date(selectedDate);
  const dow = weekStart.getDay(); // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  weekStart.setDate(weekStart.getDate() + mondayOffset);

  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const selectedKey = toDateKey(selectedDate);

  return (
    <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.rule, marginBottom: t.sp.section }}>
      {days.map((day, i) => {
        const key = toDateKey(day);
        const active = key === selectedKey;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(day)}
            style={[
              styles.weekCell,
              {
                borderWidth: 1.5,
                borderColor: active ? t.ink.black : t.rule,
                backgroundColor: active ? t.ink.black : 'transparent',
                paddingVertical: 8,
              },
            ]}>
            <Text
              style={{
                fontFamily: FONT_MONO,
                fontSize: 9,
                letterSpacing: 1.5,
                color: active ? t.paper : t.faded,
                textAlign: 'center',
              }}>
              {DAY_INITIALS[i]}
            </Text>
            <Text
              style={{
                fontFamily: FONT_HEADING,
                fontSize: 17,
                fontWeight: '700',
                color: active ? t.paper : t.ink.black,
                textAlign: 'center',
                marginTop: 2,
              }}>
              {day.getDate()}
            </Text>
          </Pressable>
        );
      })}
      {/* Calendar button — larger and more visible */}
      <Pressable
        onPress={onCalendar}
        style={[
          styles.weekCell,
          {
            borderWidth: 1.5,
            borderColor: t.accent,
            backgroundColor: t.dark ? 'rgba(216,182,106,0.10)' : 'rgba(139,111,71,0.08)',
            paddingVertical: 14,
            maxWidth: 56,
            minWidth: 48,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}>
        <Text style={{ fontSize: 22, lineHeight: 24, color: t.accent, textAlign: 'center' }}>
          📅
        </Text>
        <Text style={{ fontFamily: FONT_MONO, fontSize: 8, color: t.accent, marginTop: 2, letterSpacing: 1 }}>
          PICK
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Habit row ────────────────────────────────────────────────────────────
function HabitRow({
  habit,
  checked,
  value,
  note,
  noteExpanded,
  onToggle,
  onNumericPress,
  onToggleNote,
  onSaveNote,
  isLast,
}: {
  habit: Habit;
  checked: boolean;
  value?: string;
  note: string;
  noteExpanded: boolean;
  onToggle: () => void;
  onNumericPress: () => void;
  onToggleNote: () => void;
  onSaveNote: (text: string) => void;
  isLast: boolean;
}) {
  const t = useTheme();
  const color = habit.color as HabitColor;
  const penColor =
    color === 'blue' ? t.ink.blue : color === 'red' ? t.ink.red : t.ink.black;
  const [draft, setDraft] = useState(note);

  useEffect(() => { setDraft(note); }, [note]);

  const hasNote = note.trim().length > 0;

  return (
    <View
      style={{
        paddingVertical: t.sp.sm,
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: t.rule,
        borderStyle: 'dotted',
      }}>
      <Pressable
        onPress={habit.type === 'boolean' ? onToggle : onNumericPress}
        style={styles.habitRow}>
        {habit.type === 'boolean' ? (
          <InkCheck checked={checked} color={color} size={48} readOnly />
        ) : (
          <View style={[styles.numericBox, { borderColor: penColor }]}>
            <Text style={[styles.numericVal, { color: penColor, fontFamily: FONT_HEADING }]}>
              {value || '—'}
            </Text>
          </View>
        )}

        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text
            style={{
              fontFamily: FONT_BODY,
              fontSize: t.fs.lead,
              color: penColor,
              fontWeight: color === 'black' ? '700' : '500',
              lineHeight: t.fs.lead * 1.2,
            }}>
            {habit.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: penColor }} />
            <Text
              style={{
                fontFamily: FONT_MONO,
                fontSize: t.fs.meta,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: t.accent,
              }}>
              {habitLabel(color)}
            </Text>
          </View>
        </View>

        {/* Note toggle button */}
        <Pressable
          onPress={(e) => { e.stopPropagation?.(); onToggleNote(); }}
          hitSlop={8}
          style={{
            paddingHorizontal: 8,
            paddingVertical: 6,
            marginRight: 6,
            opacity: hasNote || noteExpanded ? 1 : 0.45,
          }}>
          <Text style={{ fontSize: 14, color: hasNote ? t.accent : t.faded }}>
            {hasNote ? '✎' : '+ note'}
          </Text>
        </Pressable>

        {/* Right accent bar */}
        <View
          style={{
            width: 4,
            height: 32,
            backgroundColor: penColor,
            opacity: checked ? 1 : 0.22,
            flexShrink: 0,
          }}
        />
      </Pressable>

      {/* Expandable note */}
      {noteExpanded ? (
        <View style={{ paddingLeft: 62, paddingTop: 6, paddingRight: 8 }}>
          <TextInput
            style={{
              fontFamily: FONT_BODY,
              fontStyle: 'italic',
              fontSize: 13,
              color: t.ink.black,
              borderLeftWidth: 2,
              borderLeftColor: penColor,
              paddingLeft: 8,
              paddingVertical: 4,
              minHeight: 28,
            }}
            multiline
            placeholder="A note for this habit today…"
            placeholderTextColor={t.faded}
            value={draft}
            onChangeText={setDraft}
            onBlur={() => onSaveNote(draft)}
          />
        </View>
      ) : hasNote ? (
        <Pressable
          onPress={onToggleNote}
          style={{ paddingLeft: 62, paddingTop: 4, paddingRight: 8 }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: FONT_BODY,
              fontStyle: 'italic',
              fontSize: 12,
              color: t.faded,
              borderLeftWidth: 2,
              borderLeftColor: penColor,
              paddingLeft: 8,
            }}>
            {note}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── Sleep block (compact two-row ledger) ────────────────────────────────
function SleepBlock({
  hours,
  score,
  onChangeHours,
  onChangeScore,
  onSave,
}: {
  hours: string;
  score: string;
  onChangeHours: (v: string) => void;
  onChangeScore: (v: string) => void;
  onSave: () => void;
}) {
  const t = useTheme();
  const rowStyle: object = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  };
  const labelStyle: object = {
    fontFamily: FONT_BODY,
    fontSize: 14,
    color: t.faded,
    width: 46,
  };
  const bigNumStyle: object = {
    fontFamily: FONT_HEADING,
    fontSize: 30,
    fontWeight: '700' as const,
    color: t.ink.black,
    width: 72,
    textAlign: 'right' as const,
    padding: 0,
  };
  const unitStyle: object = {
    fontFamily: FONT_BODY,
    fontSize: 14,
    color: t.faded,
    marginLeft: 4,
  };

  return (
    <View style={{
      paddingVertical: t.sp.xs,
      borderBottomWidth: 1.5,
      borderBottomColor: t.ink.black,
      gap: 2,
    }}>
      <View style={rowStyle}>
        <Text style={labelStyle}>Slept</Text>
        <TextInput
          style={bigNumStyle}
          keyboardType="decimal-pad"
          placeholder="—"
          placeholderTextColor={t.faded}
          value={hours}
          onChangeText={onChangeHours}
          onBlur={onSave}
        />
        <Text style={unitStyle}>h</Text>
      </View>
      <View style={rowStyle}>
        <Text style={labelStyle}>Score</Text>
        <TextInput
          style={bigNumStyle}
          keyboardType="number-pad"
          placeholder="—"
          placeholderTextColor={t.faded}
          value={score}
          onChangeText={onChangeScore}
          onBlur={onSave}
        />
        <Text style={unitStyle}>/100</Text>
      </View>
    </View>
  );
}

// ─── Metric row (ledger style) ────────────────────────────────────────────
function MetricRow({
  name,
  value,
  min,
  max,
  accentColor,
  onChange,
  onSave,
  isLast,
}: {
  name: string;
  value: string;
  min: number;
  max: number;
  accentColor: string;
  onChange: (v: string) => void;
  onSave: () => void;
  isLast: boolean;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        styles.metricRow,
        {
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: t.rule,
          borderStyle: 'dotted',
          paddingVertical: t.sp.xs,
        },
      ]}>
      <View style={{ width: 6, height: 16, backgroundColor: accentColor, opacity: 0.85, flexShrink: 0 }} />
      <Text style={{ flex: 1, fontFamily: FONT_BODY, fontSize: 15, color: t.ink.black, marginLeft: 10 }}>
        {name}
      </Text>
      <TextInput
        style={[styles.metricInput, { fontFamily: FONT_HEADING, fontSize: 22, color: t.ink.black }]}
        keyboardType="decimal-pad"
        placeholder="—"
        placeholderTextColor={t.faded}
        value={value}
        onChangeText={onChange}
        onBlur={onSave}
      />
      <Text style={{ fontFamily: FONT_MONO, fontSize: 10, color: t.accent, width: 36, textAlign: 'right' }}>
        {min}–{max}
      </Text>
    </View>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────
export function DayJournalView() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = useBottomPadding();
  const { selectedDate, goToDate } = useDaySelection();
  const { columns } = useResponsive();
  const isDesktop = columns === 2;

  const year  = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;
  const future  = isFutureDate(selectedDate);
  const today   = isToday(selectedDate);

  const { habits: allHabits } = useHabits(year, month);
  const { metrics } = useMetrics();
  // Only show habits that were active on the selected date
  const selectedDateKey = toDateKey(selectedDate);
  const habits = allHabits.filter((h) => isHabitActiveOn(h, selectedDateKey));
  const { config: monthConfig } = useMonthData(year, month);
  const { refresh } = useDatabase();
  const {
    entry, habitLogs, metricLogs, loading,
    saveMemorableMoment, saveDayReminder, saveSleep,
    toggleHabit, setNumericHabit, setMetric,
  } = useDayEntry(selectedDate);

  // Form state
  const [moment,      setMoment]      = useState('');
  const [reminder,    setReminder]    = useState('');           // for FUTURE-date view (writes to that date)
  const [tomorrowReminder, setTomorrowReminder] = useState(''); // for TODAY view → writes to tomorrow
  const [carryoverFromYesterday, setCarryover] = useState('');  // read-only banner on TODAY
  const [sleepHours,  setSleepHours]  = useState('');
  const [sleepScore,  setSleepScore]  = useState('');
  const [metricVals,  setMetricVals]  = useState<Record<string, string>>({});
  const [numericModal, setNumericModal] = useState<{ habit: Habit; value: string } | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarNote, setCalendarNote] = useState<string | null>(null);
  const [expandedNoteHabitId, setExpandedNoteHabitId] = useState<string | null>(null);

  // Morning revisit
  const { shouldShow: showRevisit, yesterday, dismiss: dismissRevisit } = useMorningRevisit();

  // Sync form ← DB
  useEffect(() => {
    setMoment(entry?.memorableMoment ?? '');
    setReminder(entry?.dayReminder ?? '');
    setSleepHours(entry?.sleepHours != null ? String(entry.sleepHours) : '');
    setSleepScore(entry?.sleepScore != null ? String(entry.sleepScore) : '');
  }, [entry, selectedDate]);

  // Fetch tomorrow's reminder (for the "Tomorrow's reminder" field on TODAY).
  // The carryover banner reads from the CURRENT day's own dayReminder — that
  // value is what was written on the previous day's "Tomorrow's reminder" field
  // (because that field writes forward).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ops = await import('@/db/operations');
      const tomorrowDate = shiftDay(selectedDate, 1);
      const tEntry = await ops.getDayEntryByDate(tomorrowDate);
      if (cancelled) return;
      setTomorrowReminder(tEntry?.dayReminder ?? '');
      setCarryover(entry?.dayReminder ?? '');
    })();
    return () => { cancelled = true; };
  }, [selectedDate, entry]);

  useEffect(() => {
    const vals: Record<string, string> = {};
    for (const log of metricLogs) vals[log.metricId] = String(log.value);
    setMetricVals(vals);
  }, [metricLogs, selectedDate]);

  const getHabitValue = (id: string) => habitLogs.find((l) => l.habitId === id)?.value;
  const getHabitNote  = (id: string) => habitLogs.find((l) => l.habitId === id)?.note ?? '';
  const isHabitChecked = (id: string) => getHabitValue(id) === 'true';

  const handleSaveHabitNote = async (habitId: string, text: string) => {
    const ops = await import('@/db/operations');
    const dayEntry = entry ?? (await ops.getOrCreateDayEntry(selectedDate));
    await setHabitLogNote(dayEntry.id, habitId, text);
    refresh();
  };

  const handleReminderBlur = async () => {
    await saveDayReminder(reminder);
    if (future && reminder.trim()) {
      const result = await syncReminderToCalendar(selectedDate, reminder);
      if (result.ok) {
        setCalendarNote(
          result.method === 'share'
            ? 'Calendar event ready — confirm in the share sheet.'
            : 'Calendar file downloaded — tap to add to iPhone/iPad Calendar.'
        );
      }
    }
  };

  // "Tomorrow's reminder" on TODAY writes to TOMORROW's entry
  const handleTomorrowReminderBlur = async () => {
    const ops = await import('@/db/operations');
    const tomorrowDate = shiftDay(selectedDate, 1);
    const tEntry = await ops.getOrCreateDayEntry(tomorrowDate);
    await ops.updateDayEntry(tEntry.id, { dayReminder: tomorrowReminder.trim() || null });
    refresh();
  };

  const handleSaveSleep = () => {
    saveSleep(
      sleepHours ? parseFloat(sleepHours) : null,
      sleepScore ? parseInt(sleepScore, 10) : null,
    );
  };

  const handleNumericSave = async (value: string) => {
    if (!numericModal) return;
    await setNumericHabit(numericModal.habit.id, value);
    setNumericModal(null);
  };

  // Metric color helper
  const metricColor = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('stress') || n.includes('screen') || n.includes('pickup')) return t.ink.red;
    if (n.includes('mood') || n.includes('deep') || n.includes('pages')) return t.ink.blue;
    return t.ink.black;
  };

  // Header
  const dayLabel = getDayLabel(selectedDate);
  const dayOfYear = getDayOfYear(selectedDate);
  const quote = getDailyQuote(selectedDate);
  const weekday = format(selectedDate, 'EEEE');
  const dayMonth = format(selectedDate, 'MMMM d');

  return (
    <View style={[styles.container, { backgroundColor: t.paper, paddingTop: insets.top + 8 }]}>
      <GridOverlay />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        keyboardShouldPersistTaps="handled">

        {/* Sticky reminders top banner — items always in view */}
        {today ? <StickyRemindersBanner /> : null}

        {/* Carryover note: today's own dayReminder = what was written on the
            previous day's "Tomorrow's reminder" field. Show prominently. */}
        {!future && carryoverFromYesterday.trim() ? (
          <View style={{
            marginHorizontal: 0,
            marginBottom: 12,
            padding: 12,
            borderWidth: 1.5,
            borderLeftWidth: 4,
            borderColor: t.accent,
            borderLeftColor: t.accent,
            backgroundColor: t.dark ? 'rgba(216,182,106,0.16)' : 'rgba(139,111,71,0.10)',
          }}>
            <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta + 1, letterSpacing: 2, color: t.dark ? t.paperHi : t.accent, marginBottom: 4, fontWeight: '700' }}>
              ← NOTE PLANNED FOR {today ? 'TODAY' : 'THIS DAY'}
            </Text>
            <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 15, color: t.ink.black, lineHeight: 22 }}>
              {carryoverFromYesterday}
            </Text>
          </View>
        ) : null}

        {/* ── Header ── */}
        <View style={[styles.headerRow, { marginBottom: t.sp.sm }]}>
          <Pressable onPress={() => goToDate(shiftDay(selectedDate, -1))} hitSlop={12} style={styles.navBtn}>
            <Text style={[styles.navText, { color: t.accent }]}>‹</Text>
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: FONT_MONO,
                fontSize: t.fs.meta,
                letterSpacing: 2.2,
                textTransform: 'uppercase',
                color: t.accent,
                marginBottom: 4,
              }}>
              {dayLabel}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <Text
                style={{
                  fontFamily: FONT_HEADING,
                  fontSize: t.fs.h1,
                  fontWeight: '400',
                  fontStyle: 'italic',
                  color: t.accent,
                  lineHeight: t.fs.h1 * 0.95,
                  letterSpacing: -0.5,
                }}>
                {weekday},{' '}
              </Text>
              <Text
                style={{
                  fontFamily: FONT_HEADING,
                  fontSize: t.fs.h1,
                  fontWeight: '700',
                  color: t.ink.black,
                  lineHeight: t.fs.h1 * 0.95,
                  letterSpacing: -0.5,
                }}>
                {dayMonth}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: FONT_BODY,
                fontStyle: 'italic',
                fontSize: 14,
                color: t.faded,
                marginTop: 6,
              }}>
              "{quote}"
            </Text>
          </View>

          {/* Folio (tablet+) */}
          {!isDesktop ? null : (
            <View style={{ alignItems: 'flex-end', paddingLeft: t.sp.md }}>
              <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, color: t.faded, letterSpacing: 2 }}>
                folio
              </Text>
              <Text
                style={{
                  fontFamily: FONT_HEADING,
                  fontSize: 38,
                  fontWeight: '700',
                  color: t.accent,
                  lineHeight: 40,
                }}>
                {dayOfYear}
              </Text>
            </View>
          )}

          <Pressable onPress={() => goToDate(shiftDay(selectedDate, 1))} hitSlop={12} style={styles.navBtn}>
            <Text style={[styles.navText, { color: t.accent }]}>›</Text>
          </Pressable>
        </View>

        <DoubleRule marginTop={t.sp.sm} />

        {/* ── Week picker ── */}
        <WeekStrip
          selectedDate={selectedDate}
          onSelect={goToDate}
          onCalendar={() => setCalendarOpen(true)}
        />

        {/* ── Body grid ── */}
        <View style={isDesktop ? styles.grid2col : undefined}>

          {/* LEFT: Memorable Moment + Habits */}
          <View style={isDesktop ? { flex: 1.15 } : undefined}>

            {/* Future date: reminder only */}
            {future ? (
              <>
                <SectionHeader eyebrow="Looking Forward" title="Reminder for this day" />
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      borderColor: t.rule,
                      borderLeftColor: t.accent,
                      color: t.ink.black,
                      fontFamily: FONT_BODY,
                      backgroundColor: t.dark ? 'rgba(255,240,200,0.04)' : 'rgba(255,250,235,0.6)',
                    },
                  ]}
                  multiline
                  placeholder="What do you want to remember for this day?"
                  placeholderTextColor={t.faded}
                  value={reminder}
                  onChangeText={setReminder}
                  onBlur={handleReminderBlur}
                />
                {calendarNote ? (
                  <Text style={{ color: '#2D6A4F', fontSize: 12, fontStyle: 'italic', marginTop: 6 }}>
                    {calendarNote}
                  </Text>
                ) : null}
              </>
            ) : (
              <>
                {/* I · Memorable Moment */}
                <SectionHeader eyebrow="I · Memorable Moment" title="One win from today" />
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      borderColor: t.rule,
                      borderLeftColor: t.ink.black,
                      color: t.ink.black,
                      fontFamily: FONT_BODY,
                      backgroundColor: t.dark ? 'rgba(255,240,200,0.04)' : 'rgba(255,250,235,0.6)',
                    },
                  ]}
                  multiline
                  placeholder="One positive win from today…"
                  placeholderTextColor={t.faded}
                  value={moment}
                  onChangeText={setMoment}
                  onBlur={() => saveMemorableMoment(moment)}
                />

                {/* II · Habits */}
                <View style={{ marginTop: t.sp.xl }}>
                  <SectionHeader
                    eyebrow="II · Habits"
                    title="Today's marks"
                    action={
                      habits.length > 0 ? (
                        <Text
                          style={{
                            fontFamily: FONT_MONO,
                            fontSize: 11,
                            color: t.accent,
                            letterSpacing: 1,
                          }}>
                          {habitLogs.filter((l) => l.value === 'true').length} / {habits.filter((h) => h.type === 'boolean').length}
                        </Text>
                      ) : undefined
                    }
                  />
                  {habits.length === 0 ? (
                    <Text style={{ color: t.faded, fontStyle: 'italic', fontSize: 14 }}>
                      Add habits in Setup first.
                    </Text>
                  ) : (
                    habits.map((habit, idx) => (
                      <HabitRow
                        key={habit.id}
                        habit={habit}
                        checked={isHabitChecked(habit.id)}
                        value={getHabitValue(habit.id)}
                        note={getHabitNote(habit.id)}
                        noteExpanded={expandedNoteHabitId === habit.id}
                        onToggle={() => toggleHabit(habit.id, getHabitValue(habit.id))}
                        onNumericPress={() =>
                          setNumericModal({ habit, value: getHabitValue(habit.id) ?? '' })
                        }
                        onToggleNote={() =>
                          setExpandedNoteHabitId((curr) => (curr === habit.id ? null : habit.id))
                        }
                        onSaveNote={(text) => handleSaveHabitNote(habit.id, text)}
                        isLast={idx === habits.length - 1}
                      />
                    ))
                  )}
                </View>
              </>
            )}
          </View>

          {/* Spacer between columns on desktop */}
          {isDesktop ? <View style={{ width: 40 }} /> : null}

          {/* RIGHT: Sleep + Metrics + Reminder */}
          {!future ? (
            <View style={isDesktop ? { flex: 0.85 } : { marginTop: t.sp.xl }}>

              {/* III · Rest */}
              <SectionHeader eyebrow="III · Rest" title="Sleep" />
              <SleepBlock
                hours={sleepHours}
                score={sleepScore}
                onChangeHours={setSleepHours}
                onChangeScore={setSleepScore}
                onSave={handleSaveSleep}
              />

              {/* IV · The Experiment */}
              {metrics.length > 0 ? (
                <View style={{ marginTop: t.sp.xl }}>
                  <SectionHeader eyebrow="IV · The Experiment" title="Metrics" />
                  {metrics.map((metric, idx) => (
                    <MetricRow
                      key={metric.id}
                      name={metric.name}
                      value={metricVals[metric.id] ?? ''}
                      min={metric.minVal}
                      max={metric.maxVal}
                      accentColor={metricColor(metric.name)}
                      onChange={(v) => setMetricVals((prev) => ({ ...prev, [metric.id]: v }))}
                      onSave={() => {
                        const val = metricVals[metric.id];
                        if (val) setMetric(metric.id, parseFloat(val));
                      }}
                      isLast={idx === metrics.length - 1}
                    />
                  ))}
                </View>
              ) : null}

              {/* V · Looking Forward — writes to TOMORROW's dayReminder so it carries over */}
              {!future ? (
                <View style={{ marginTop: t.sp.xl }}>
                  <SectionHeader eyebrow="V · Looking Forward" title="Tomorrow's reminder" />
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        minHeight: 70,
                        borderColor: t.rule,
                        borderLeftColor: t.accent,
                        color: t.ink.black,
                        fontFamily: FONT_BODY,
                        backgroundColor: t.dark ? 'rgba(255,240,200,0.04)' : 'rgba(255,250,235,0.6)',
                      },
                    ]}
                    multiline
                    placeholder="A small note to your future self for tomorrow…"
                    placeholderTextColor={t.faded}
                    value={tomorrowReminder}
                    onChangeText={setTomorrowReminder}
                    onBlur={handleTomorrowReminderBlur}
                  />
                  <Text style={{ fontFamily: FONT_MONO, fontSize: 9, color: t.faded, marginTop: 4, letterSpacing: 1 }}>
                    SAVES TO TOMORROW · WILL APPEAR ON NEXT DAY'S TOP BANNER
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* ── Hyper-focus banner ── high contrast in dark mode */}
        {monthConfig?.hyperFocus ? (
          <View
            style={{
              marginTop: t.sp.xl,
              padding: 14,
              borderWidth: 1.5,
              borderLeftWidth: 4,
              borderColor: t.ink.blue,
              borderLeftColor: t.ink.blue,
              // Stronger fill so the eyebrow stays readable on any tone
              backgroundColor: t.dark ? 'rgba(30,58,138,0.22)' : 'rgba(30,58,138,0.10)',
            }}>
            <Text style={{
              fontFamily: FONT_MONO, fontSize: t.fs.meta + 1, letterSpacing: 2.2,
              textTransform: 'uppercase',
              // In dark mode the blue ink itself is hard to read on dark — use paper for max contrast
              color: t.dark ? t.paperHi : t.ink.blue,
              marginBottom: 4, fontWeight: '700',
            }}>
              HYPER-FOCUS · {format(selectedDate, 'MMM').toUpperCase()}
            </Text>
            <Text style={{
              fontFamily: FONT_HEADING, fontSize: t.fs.h3, fontWeight: '700',
              color: t.ink.black, lineHeight: t.fs.h3 * 1.15,
            }}>
              {monthConfig.hyperFocus}
            </Text>
          </View>
        ) : null}

        {/* ── Footer: Revisit yesterday (left) + Preview tomorrow (right) ── */}
        <View
          style={[
            styles.footer,
            { borderTopColor: t.rule, paddingTop: t.sp.md, marginTop: t.sp.xl, justifyContent: 'space-between' },
          ]}>
          <Pressable
            onPress={() => goToDate(shiftDay(selectedDate, -1))}
            style={[styles.revisitBtn, { borderColor: t.ink.black }]}>
            <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.ink.black }}>
              ← Revisit yesterday
            </Text>
          </Pressable>

          <Pressable
            onPress={() => goToDate(shiftDay(selectedDate, 1))}
            style={[styles.revisitBtn, { borderColor: t.accent }]}>
            <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.accent }}>
              Preview tomorrow →
            </Text>
          </Pressable>
        </View>

        {!today ? (
          <Pressable style={styles.todayBtn} onPress={() => goToDate(new Date())}>
            <Text style={{ color: t.accent, fontSize: 15, fontWeight: '600' }}>Jump to today</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {/* ── Modals ── */}
      <CalendarModal
        visible={calendarOpen}
        selectedDate={selectedDate}
        onSelect={(d) => { goToDate(d); setCalendarOpen(false); }}
        onClose={() => setCalendarOpen(false)}
      />

      <NumericInputModal
        visible={numericModal !== null}
        title={numericModal?.habit.name ?? ''}
        initialValue={numericModal?.value ?? ''}
        onCancel={() => setNumericModal(null)}
        onSave={handleNumericSave}
      />

      <MorningRevisitModal
        visible={showRevisit}
        yesterday={yesterday}
        onDismiss={dismissRevisit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  navText: {
    fontSize: 28,
    lineHeight: 32,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
  },
  grid2col: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textArea: {
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 12,
    minHeight: 110,
    fontSize: 16,
    lineHeight: 28,
    textAlignVertical: 'top',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numericBox: {
    width: 48,
    height: 48,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  numericVal: {
    fontSize: 14,
    fontWeight: '600',
  },
  sleepInput: {
    fontWeight: '700',
    minWidth: 50,
    padding: 0,
    margin: 0,
    textAlign: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 0,
  },
  metricInput: {
    fontWeight: '700',
    minWidth: 50,
    padding: 0,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    gap: 12,
    flexWrap: 'wrap',
  },
  revisitBtn: {
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  todayBtn: {
    alignItems: 'center',
    padding: 14,
  },
});
