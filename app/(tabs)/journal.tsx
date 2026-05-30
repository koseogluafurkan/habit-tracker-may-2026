// ─── Month spread (Memorable Moments + Habit Matrix) ──────────────────────
// Major rewrite:
// - Hyper-focus sits at the TOP, on the same line as the month/year title.
//   Rendered outside the ScrollView so it stays put as the user scrolls.
// - Left page now contains BOTH memorable moments AND reminders for each day.
// - Left/right pages share the same row component → guaranteed alignment.
// - Habit matrix cells scale dynamically with available width / habit count.

import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';

import { NumericInputModal } from '@/components/NumericInputModal';
import { HabitCell } from '@/components/journal/HabitCell';
import { useTheme } from '@/contexts/ThemeContext';
import { useDaySelection } from '@/contexts/DaySelectionContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import {
  getOrCreateDayEntry,
  updateDayEntry,
  upsertHabitLog,
  deleteHabitLog,
} from '@/db/operations';
import type { Habit, HabitColor } from '@/db/schema';
import { useBottomPadding } from '@/hooks/useBottomPadding';
import { useMonthData } from '@/hooks/useMonthData';
import { useResponsive } from '@/hooks/useResponsive';
import { getDateForDay, getDaysInMonthCount, shiftMonth, toDateKey } from '@/utils/dates';
import { isHabitActiveOn } from '@/db/operations';
import { FONT_BODY, FONT_HEADING, FONT_MONO, getPenColor } from '@/constants/theme';
import { DoubleRule } from '@/components/journal/atoms/DoubleRule';
import { GridOverlay } from '@/components/journal/atoms/GridOverlay';

// ─── Row height — must match across left/right pages ──────────────────────
const ROW_HEIGHT = 44;

// ─── DayRow: a single day across both pages ──────────────────────────────
type DayRowProps = {
  day: number;
  dateKey: string;
  moment: string;
  reminder: string;
  habits: Habit[];
  habitValues: Record<string, string | undefined>;     // habitId → value
  cellSize: number;
  isToday: boolean;
  onMomentEdit: (text: string) => void;
  onReminderEdit: (text: string) => void;
  onCellPress: (habit: Habit) => void;
  onDayPress: () => void;
  isLast: boolean;
};

function DayRow({
  day, dateKey, moment, reminder, habits, habitValues, cellSize, isToday,
  onMomentEdit, onReminderEdit, onCellPress, onDayPress, isLast,
}: DayRowProps) {
  const t = useTheme();
  const [momentDraft, setMomentDraft] = useState(moment);
  const [reminderDraft, setReminderDraft] = useState(reminder);
  const [showReminder, setShowReminder] = useState(false);

  return (
    <View
      style={{
        flexDirection: 'row',
        minHeight: ROW_HEIGHT,
        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: t.rule,
        backgroundColor: isToday ? (t.dark ? 'rgba(216,182,106,0.06)' : 'rgba(139,111,71,0.04)') : 'transparent',
      }}>
      {/* Day number */}
      <Pressable
        onPress={onDayPress}
        style={{
          width: 32, justifyContent: 'center', alignItems: 'center',
          borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: t.rule,
        }}>
        <Text style={{
          fontFamily: FONT_MONO, fontSize: 12, fontWeight: isToday ? '700' : '500',
          color: isToday ? t.ink.black : t.faded,
        }}>
          {day}
        </Text>
      </Pressable>

      {/* LEFT — Memorable Moment + habit dots + (optional) Reminder */}
      <View style={{
        flex: 1, paddingHorizontal: 10, paddingVertical: 4,
        borderRightWidth: 1, borderRightColor: t.rule, justifyContent: 'center',
      }}>
        <TextInput
          style={{
            fontFamily: FONT_BODY, fontSize: 13, color: t.ink.black,
            paddingVertical: 2, lineHeight: 18,
          }}
          placeholder="One win from this day…"
          placeholderTextColor={t.faded}
          value={momentDraft}
          onChangeText={setMomentDraft}
          onBlur={() => onMomentEdit(momentDraft)}
        />
        {/* Analog notebook dots — one per habit, filled if completed */}
        {habits.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
            {habits.map((h) => {
              const val = habitValues[h.id];
              const done = val === 'true' || (val != null && val !== '');
              const active = isHabitActiveOn(h, dateKey);
              const dotColor = h.color === 'blue' ? t.ink.blue : h.color === 'red' ? t.ink.red : t.ink.black;
              return (
                <View
                  key={h.id}
                  style={{
                    width: 7, height: 7, borderRadius: 3.5,
                    backgroundColor: done ? dotColor : 'transparent',
                    borderWidth: 1,
                    borderColor: active ? dotColor : t.rule,
                    opacity: active ? (done ? 1 : 0.4) : 0.2,
                  }}
                />
              );
            })}
          </View>
        ) : null}
        {reminder && !showReminder ? (
          <Pressable onPress={() => setShowReminder(true)}>
            <Text style={{
              fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 11,
              color: t.accent, marginTop: 2,
            }} numberOfLines={1}>
              ⌬ {reminder}
            </Text>
          </Pressable>
        ) : null}
        {showReminder ? (
          <TextInput
            style={{
              fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 12,
              color: t.accent, paddingVertical: 2, lineHeight: 16,
              borderLeftWidth: 2, borderLeftColor: t.accent, paddingLeft: 6, marginTop: 2,
            }}
            placeholder="Reminder for this day…"
            placeholderTextColor={t.faded}
            value={reminderDraft}
            onChangeText={setReminderDraft}
            onBlur={() => { onReminderEdit(reminderDraft); setShowReminder(false); }}
            autoFocus
          />
        ) : null}
      </View>

      {/* RIGHT — Habit matrix row (inactive/historical cells are dimmed + read-only) */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 4, paddingVertical: 4,
      }}>
        {habits.map((h) => {
          const active = isHabitActiveOn(h, dateKey);
          return (
            <View key={h.id} style={{ margin: 1, opacity: active ? 1 : 0.3 }}>
              <HabitCell
                color={h.color as HabitColor}
                type={h.type as 'boolean' | 'numeric'}
                value={habitValues[h.id]}
                onPress={active ? () => onCellPress(h) : undefined}
                readOnly={!active}
                size={cellSize}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────
export default function JournalScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPadding = useBottomPadding();
  const { goToDate } = useDaySelection();
  const { columns, isDesktop } = useResponsive();
  const { refresh } = useDatabase();
  const { width: windowWidth } = useWindowDimensions();

  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [view, setView]   = useState<'moments' | 'habits'>('moments');

  const [numericModal, setNumericModal] = useState<{
    day: number;
    habit: Habit;
    value: string;
  } | null>(null);

  const { habits, dayEntries, habitLogs, config } = useMonthData(year, month);

  const changeMonth = (delta: number) => {
    const next = shiftMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  };

  const handleMomentEdit = useCallback(
    async (day: number, text: string) => {
      const entry = await getOrCreateDayEntry(getDateForDay(year, month, day));
      await updateDayEntry(entry.id, { memorableMoment: text || null });
      refresh();
    },
    [year, month, refresh]
  );

  const handleReminderEdit = useCallback(
    async (day: number, text: string) => {
      const entry = await getOrCreateDayEntry(getDateForDay(year, month, day));
      await updateDayEntry(entry.id, { dayReminder: text || null });
      refresh();
    },
    [year, month, refresh]
  );

  const handleCellPress = useCallback(
    async (day: number, habit: Habit) => {
      const entry = await getOrCreateDayEntry(getDateForDay(year, month, day));
      const dateKey = entry.date;
      const existing = habitLogs.find((l) => l.date === dateKey && l.habitId === habit.id);

      if (habit.type === 'boolean') {
        if (existing?.value === 'true') {
          await deleteHabitLog(entry.id, habit.id);
        } else {
          await upsertHabitLog(entry.id, habit.id, 'true');
        }
        refresh();
        return;
      }

      setNumericModal({ day, habit, value: existing?.value ?? '' });
    },
    [year, month, habitLogs, refresh]
  );

  const saveNumericValue = useCallback(
    async (value: string) => {
      if (!numericModal) return;
      const { day, habit } = numericModal;
      const entry = await getOrCreateDayEntry(getDateForDay(year, month, day));
      if (!value.trim()) {
        await deleteHabitLog(entry.id, habit.id);
      } else {
        await upsertHabitLog(entry.id, habit.id, value.trim());
      }
      setNumericModal(null);
      refresh();
    },
    [numericModal, year, month, refresh]
  );

  const openDay = useCallback(
    (day: number) => {
      goToDate(getDateForDay(year, month, day));
      router.navigate('/(tabs)');
    },
    [year, month, goToDate]
  );

  // Build helpers
  const daysCount = getDaysInMonthCount(year, month);
  const days = Array.from({ length: daysCount }, (_, i) => i + 1);
  const todayDateKey = new Date().toISOString().slice(0, 10);

  const monthName = format(new Date(year, month - 1, 1), 'MMMM');
  const yearStr = String(year);

  // Lookup maps
  const dayMomentMap = new Map(dayEntries.map((e) => [e.date, e.memorableMoment ?? '']));
  const dayReminderMap = new Map(dayEntries.map((e) => [e.date, e.dayReminder ?? '']));
  const valuesByDay = (dateKey: string) => {
    const map: Record<string, string | undefined> = {};
    for (const log of habitLogs) {
      if (log.date === dateKey) map[log.habitId] = log.value;
    }
    return map;
  };

  // Dynamic habit cell size — fits available width, minimum 36 so headers stay readable
  const estimatedContentWidth = Math.min(windowWidth, isDesktop ? 1400 : windowWidth) - 40;
  const rightPageWidth = isDesktop ? (estimatedContentWidth / 2) - 24 : estimatedContentWidth;
  const cellSize = habits.length > 0
    ? Math.max(36, Math.min(52, Math.floor((rightPageWidth - 16) / habits.length) - 4))
    : 36;
  // If habits overflow the available width, let the habit panel scroll horizontally
  const habitsOverflow = habits.length > 0 && habits.length * (cellSize + 2) > rightPageWidth;

  // Render only the chosen view on phone/tablet (the spread is desktop-only)
  const showMoments = isDesktop || view === 'moments';
  const showHabits  = isDesktop || view === 'habits';

  return (
    <View style={[styles.container, { backgroundColor: t.paper, paddingTop: insets.top + 8 }]}>
      <GridOverlay />

      {/* ── Sticky header with hyper-focus inline ── */}
      <View style={{ paddingHorizontal: 20 }}>
        <View style={[styles.header]}>
          <Pressable onPress={() => changeMonth(-1)} hitSlop={12} style={styles.navBtn}>
            <Text style={[styles.navText, { color: t.accent }]}>‹</Text>
          </Pressable>

          <View style={{ flex: 1, alignItems: isDesktop ? 'flex-start' : 'center' }}>
            <Text style={{
              fontFamily: FONT_MONO,
              fontSize: t.fs.meta, letterSpacing: 2.2,
              textTransform: 'uppercase', color: t.accent, marginBottom: 4,
            }}>
              The month of
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={{
                  fontFamily: FONT_HEADING, fontSize: isDesktop ? 44 : 32,
                  fontWeight: '700', color: t.ink.black, letterSpacing: -0.5,
                }}>
                  {monthName}{' '}
                </Text>
                <Text style={{
                  fontFamily: FONT_HEADING, fontSize: isDesktop ? 44 : 32,
                  fontWeight: '400', fontStyle: 'italic', color: t.accent, letterSpacing: -0.5,
                }}>
                  {yearStr}
                </Text>
              </View>

              {/* Hyper-focus inline beside the title, same row */}
              {config?.hyperFocus ? (
                <View style={{
                  paddingVertical: 6, paddingHorizontal: 10,
                  borderWidth: 1.5, borderLeftWidth: 3,
                  borderColor: t.ink.blue, borderLeftColor: t.ink.blue,
                  backgroundColor: t.dark ? 'rgba(30,58,138,0.22)' : 'rgba(30,58,138,0.10)',
                  maxWidth: isDesktop ? 460 : '100%',
                }}>
                  <Text style={{
                    fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 2,
                    color: t.dark ? t.paperHi : t.ink.blue, fontWeight: '700',
                  }}>
                    HYPER-FOCUS
                  </Text>
                  <Text style={{
                    fontFamily: FONT_BODY, fontSize: 14, fontWeight: '700',
                    color: t.ink.black, lineHeight: 20,
                  }} numberOfLines={2}>
                    {config.hyperFocus}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <Pressable onPress={() => changeMonth(1)} hitSlop={12} style={styles.navBtn}>
            <Text style={[styles.navText, { color: t.accent }]}>›</Text>
          </Pressable>
        </View>

        <DoubleRule marginTop={8} color={t.ink.black} />

        {/* Tab pills — phone + tablet only */}
        {!isDesktop && (
          <View style={[styles.tabRow, { marginTop: 14, marginBottom: 10 }]}>
            {([
              { id: 'moments', label: 'Moments + Reminders' },
              { id: 'habits',  label: 'Habit Matrix' },
            ] as const).map((tab) => {
              const active = view === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setView(tab.id)}
                  style={[
                    styles.tabPill,
                    {
                      backgroundColor: active ? t.ink.black : 'transparent',
                      borderColor: t.ink.black,
                    },
                  ]}>
                  <Text style={{
                    fontFamily: FONT_HEADING, fontSize: 14, fontWeight: '600',
                    color: active ? t.paper : t.ink.black,
                  }}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}>

        {/* Header row above table */}
        <View style={{
          flexDirection: 'row', minHeight: 56, alignItems: 'flex-end',
          borderBottomWidth: 1.5, borderBottomColor: t.ink.black,
        }}>
          <View style={{ width: 32 }} />
          {showMoments ? (
            <View style={{ flex: 1, paddingHorizontal: 10, paddingBottom: 8, borderRightWidth: 1, borderRightColor: t.rule }}>
              <Text style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 1.8, color: t.ink.black, fontWeight: '700' }}>
                {isDesktop ? 'LEFT PAGE / MEMORABLE MOMENTS + REMINDERS' : 'MOMENTS + REMINDERS'}
              </Text>
            </View>
          ) : null}
          {showHabits ? (
            <View style={{
              flexDirection: 'row',
              paddingHorizontal: 4, paddingBottom: 4,
            }}>
              {habits.length === 0 ? (
                <Text style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 1.8, color: t.ink.black, fontWeight: '700', padding: 8 }}>
                  ADD HABITS IN SETUP
                </Text>
              ) : (
                habits.map((h) => {
                  const penColor = getPenColor(h.color as HabitColor);
                  return (
                    <View
                      key={h.id}
                      style={{
                        width: cellSize + 2, alignItems: 'center',
                        height: 68, justifyContent: 'flex-end', paddingBottom: 6,
                      }}>
                      <Text
                        numberOfLines={3}
                        style={{
                          fontFamily: FONT_MONO, fontSize: 10,
                          color: penColor, fontWeight: '700',
                          transform: [{ rotate: '-50deg' }],
                          width: 90, textAlign: 'left',
                        }}>
                        {h.name}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          ) : null}
        </View>

        {/* Day rows */}
        {days.map((day, idx) => {
          const dateKey = toDateKey(getDateForDay(year, month, day));
          return (
            <DayRowAdapter
              key={day}
              day={day}
              dateKey={dateKey}
              isToday={dateKey === todayDateKey}
              moment={dayMomentMap.get(dateKey) ?? ''}
              reminder={dayReminderMap.get(dateKey) ?? ''}
              habits={showHabits ? habits : []}
              habitValues={valuesByDay(dateKey)}
              cellSize={cellSize}
              showMoments={showMoments}
              onMomentEdit={(text) => handleMomentEdit(day, text)}
              onReminderEdit={(text) => handleReminderEdit(day, text)}
              onCellPress={(habit) => handleCellPress(day, habit)}
              onDayPress={() => openDay(day)}
              isLast={idx === days.length - 1}
            />
          );
        })}
      </ScrollView>

      <NumericInputModal
        visible={numericModal !== null}
        title={numericModal?.habit.name ?? ''}
        initialValue={numericModal?.value ?? ''}
        onCancel={() => setNumericModal(null)}
        onSave={saveNumericValue}
      />
    </View>
  );
}

// Adapter that conditionally hides one side on phone/tablet
function DayRowAdapter(props: DayRowProps & { showMoments: boolean }) {
  const { showMoments, ...rowProps } = props;
  const t = useTheme();

  if (!showMoments) {
    // Show only the habit cells, with day label
    return (
      <View style={{
        flexDirection: 'row',
        minHeight: ROW_HEIGHT,
        alignItems: 'center',
        borderBottomWidth: rowProps.isLast ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: t.rule,
        backgroundColor: rowProps.isToday ? (t.dark ? 'rgba(216,182,106,0.06)' : 'rgba(139,111,71,0.04)') : 'transparent',
      }}>
        <Pressable
          onPress={rowProps.onDayPress}
          style={{
            width: 32, justifyContent: 'center', alignItems: 'center',
            borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: t.rule,
            alignSelf: 'stretch',
          }}>
          <Text style={{
            fontFamily: FONT_MONO, fontSize: 12, fontWeight: rowProps.isToday ? '700' : '500',
            color: rowProps.isToday ? t.ink.black : t.faded,
          }}>
            {rowProps.day}
          </Text>
        </Pressable>
        <View style={{ flexDirection: 'row', paddingHorizontal: 4, paddingVertical: 4 }}>
          {rowProps.habits.map((h) => (
            <View key={h.id} style={{ margin: 1 }}>
              <HabitCell
                color={h.color as HabitColor}
                type={h.type as 'boolean' | 'numeric'}
                value={rowProps.habitValues[h.id]}
                onPress={() => rowProps.onCellPress(h)}
                size={rowProps.cellSize}
              />
            </View>
          ))}
        </View>
      </View>
    );
  }
  return <DayRow {...rowProps} />;
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
  tabRow: { flexDirection: 'row', gap: 8 },
  tabPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1.5,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
});
