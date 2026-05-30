import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DoubleRule } from '@/components/journal/atoms/DoubleRule';
import { GridOverlay } from '@/components/journal/atoms/GridOverlay';
import { BaselineHabitsSection } from '@/components/setup/BaselineHabitsSection';
import { CountdownsSection } from '@/components/setup/CountdownsSection';
import { MetricsSection } from '@/components/setup/MetricsSection';
import { MorningRoutineSection } from '@/components/setup/MorningRoutineSection';
import { MyFoundationSection } from '@/components/setup/MyFoundationSection';
import { StickyRemindersSection } from '@/components/setup/StickyRemindersSection';
import {
  FONT_BODY,
  FONT_HEADING,
  FONT_MONO,
  PAPER_TONES,
  type AestheticKey,
  type DensityKey,
  type PaperToneKey,
} from '@/constants/theme';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useTheme, useThemeSettings } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { upsertMonthConfig } from '@/db/operations';
import { useMonthData } from '@/hooks/useMonthData';
import { useBottomPadding } from '@/hooks/useBottomPadding';
import { useResponsive } from '@/hooks/useResponsive';
import { exportDataToFile, importDataFromFile } from '@/utils/export';
import { formatMonthYear } from '@/utils/dates';

// ── Section label ───────────────────────────────────────────────────────────
function SectionLabel({ children, color, borderColor }: { children: React.ReactNode; color: string; borderColor: string }) {
  return (
    <View style={[styles.sectionLabel, { borderBottomColor: borderColor }]}>
      <Text style={[styles.sectionLabelText, { fontFamily: FONT_MONO, color }]}>
        {children}
      </Text>
    </View>
  );
}

export default function SetupScreen() {
  const t = useTheme();
  const { settings, setTone, setDensity, setAesthetic, setFollowSystem } = useThemeSettings();
  const { state: authState, signOut } = useAuth();
  const userEmail = authState.status === 'authenticated' ? authState.user.email : null;
  const insets = useSafeAreaInsets();
  const bottomPadding = useBottomPadding();
  const { columns } = useResponsive();
  const isDesktop = columns === 2;
  const { refresh } = useDatabase();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const { config } = useMonthData(year, month);

  const [nextMonthIdeas, setNextMonthIdeas] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [hyperFocus, setHyperFocus] = useState('');

  // Inline save feedback — replaces Alert which was easy to miss on PWA
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNextMonthIdeas(config?.nextMonthIdeas ?? '');
    setReminderMessage(config?.reminderMessage ?? '');
    setHyperFocus(config?.hyperFocus ?? '');
  }, [config]);

  const handleSaveMonthConfig = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await upsertMonthConfig(year, month, {
        nextMonthIdeas: nextMonthIdeas || null,
        reminderMessage: reminderMessage || null,
        hyperFocus: hyperFocus || null,
      });
      refresh();
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2800);
    } catch (e) {
      setSaveError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try { await exportDataToFile(); }
    catch (e) { Alert.alert('Export failed', String(e)); }
  };

  const handleImport = async () => {
    try {
      const ok = await importDataFromFile();
      if (ok) refresh();
    } catch (e) { Alert.alert('Import failed', String(e)); }
  };

  const bg = t.dark ? 'rgba(255,240,200,0.04)' : 'rgba(255,250,235,0.6)';

  return (
    <View style={[styles.container, { backgroundColor: t.paper, paddingTop: insets.top + 8 }]}>
      <GridOverlay />

      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: 20 }]}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2.2,
            textTransform: 'uppercase', color: t.accent, marginBottom: 4,
          }}>
            Configuration
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={{
              fontFamily: FONT_HEADING, fontSize: isDesktop ? 38 : 28,
              fontWeight: '700', color: t.ink.black, letterSpacing: -0.5,
            }}>
              Setup{' '}
            </Text>
            <Text style={{
              fontFamily: FONT_HEADING, fontSize: isDesktop ? 38 : 28,
              fontWeight: '400', fontStyle: 'italic', color: t.accent, letterSpacing: -0.5,
            }}>
              {formatMonthYear(year, month)}
            </Text>
          </View>
          {/* Signed-in email — always visible at top */}
          {userEmail ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 }}>
              <Text style={{ fontFamily: FONT_MONO, fontSize: 10, color: t.faded, letterSpacing: 1, flex: 1 }}>
                ⚿ {userEmail}
              </Text>
              <Pressable
                onPress={signOut}
                hitSlop={8}
                style={{
                  borderWidth: 1.5, borderColor: t.ink.red,
                  paddingHorizontal: 12, paddingVertical: 6,
                }}>
                <Text style={{ fontFamily: FONT_MONO, fontSize: 11, color: t.ink.red, fontWeight: '700', letterSpacing: 1 }}>
                  SIGN OUT
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      <DoubleRule marginTop={8} color={t.ink.black} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        keyboardShouldPersistTaps="handled">

        {/* §I Baseline Habits — now supports future month selection */}
        <SectionLabel color={t.ink.black} borderColor={t.ink.black}>
          §I · BASELINE HABITS · MULTI-MONTH
        </SectionLabel>
        <BaselineHabitsSection />

        {/* §II My Foundation */}
        <SectionLabel color={t.ink.black} borderColor={t.ink.black}>
          §II · MY FOUNDATION · ANTI-GOALS · BELIEFS · LONG-TERM GOALS
        </SectionLabel>
        <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, marginBottom: t.sp.sm, lineHeight: 20 }}>
          The bedrock. Revisited at the start of each month.
        </Text>
        <MyFoundationSection />

        {/* §III Month Notes */}
        <SectionLabel color={t.ink.black} borderColor={t.ink.black}>
          §III · MONTH NOTES · FOCUS + INTENTIONS
        </SectionLabel>

        <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2, textTransform: 'uppercase', color: t.accent, marginBottom: 4 }}>
          Hyper-Focus
        </Text>
        <TextInput
          style={[styles.inputField, { borderColor: t.rule, borderLeftColor: t.ink.blue, color: t.ink.black, fontFamily: FONT_BODY, backgroundColor: bg }]}
          placeholder='e.g. "Ship the product"'
          placeholderTextColor={t.faded}
          value={hyperFocus}
          onChangeText={setHyperFocus}
        />

        <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2, textTransform: 'uppercase', color: t.accent, marginBottom: 4, marginTop: t.sp.md }}>
          Reminder Message
        </Text>
        <TextInput
          style={[styles.inputField, { borderColor: t.rule, borderLeftColor: t.ink.black, color: t.ink.black, fontFamily: FONT_BODY, backgroundColor: bg }]}
          placeholder='e.g. "Stay present"'
          placeholderTextColor={t.faded}
          value={reminderMessage}
          onChangeText={setReminderMessage}
        />

        <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2, textTransform: 'uppercase', color: t.accent, marginBottom: 4, marginTop: t.sp.md }}>
          Ideas for Next Month
        </Text>
        <TextInput
          style={[styles.inputField, styles.textArea, { borderColor: t.rule, borderLeftColor: t.ink.black, color: t.ink.black, fontFamily: FONT_BODY, backgroundColor: bg }]}
          multiline
          placeholder="Habits to add, things to change..."
          placeholderTextColor={t.faded}
          value={nextMonthIdeas}
          onChangeText={setNextMonthIdeas}
        />

        <Pressable
          style={[styles.saveBtn, { backgroundColor: savedAt ? '#2D6A4F' : t.ink.black, marginTop: t.sp.md, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSaveMonthConfig}
          disabled={saving}>
          <Text style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: '600', color: '#FFF', letterSpacing: 0.3 }}>
            {saving ? 'Saving…' : savedAt ? '✓ Saved' : 'Save Month Settings'}
          </Text>
        </Pressable>
        {saveError ? (
          <Text style={{ fontFamily: FONT_MONO, fontSize: 11, color: t.ink.red, marginTop: 6 }}>
            {saveError}
          </Text>
        ) : null}

        {/* §IV Sticky Reminders */}
        <SectionLabel color={t.ink.black} borderColor={t.ink.black}>
          §IV · STICKY REMINDERS · ALWAYS-IN-VIEW
        </SectionLabel>
        <StickyRemindersSection />

        {/* §V Custom Countdowns */}
        <SectionLabel color={t.ink.black} borderColor={t.ink.black}>
          §V · COUNTDOWNS · DYNAMIC TAB CHIPS
        </SectionLabel>
        <CountdownsSection />

        {/* §VI Morning Routine */}
        <SectionLabel color={t.ink.black} borderColor={t.ink.black}>
          §VI · MORNING ROUTINE · CHECKLIST
        </SectionLabel>
        <MorningRoutineSection />

        {/* §VII Metrics */}
        <SectionLabel color={t.ink.black} borderColor={t.ink.black}>
          §VII · METRICS · TRACKED ON DAILY
        </SectionLabel>
        <MetricsSection />

        {/* §VIII Appearance */}
        <SectionLabel color={t.ink.black} borderColor={t.ink.black}>
          §VIII · APPEARANCE · SYNCED ACROSS DEVICES
        </SectionLabel>

        <View style={[styles.switchRow, { borderBottomColor: t.rule }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONT_BODY, fontSize: t.fs.body, color: t.ink.black }}>
              Follow system theme
            </Text>
            <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, color: t.faded, marginTop: 2, letterSpacing: 1 }}>
              AUTO-SELECTS CREAM (LIGHT) OR MIDNIGHT (DARK)
            </Text>
          </View>
          <Switch
            value={settings.followSystem}
            onValueChange={setFollowSystem}
            trackColor={{ true: t.accent, false: t.rule }}
            thumbColor={t.paper}
          />
        </View>

        {!settings.followSystem && (
          <View style={{ marginBottom: t.sp.md }}>
            <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2, textTransform: 'uppercase', color: t.accent, marginBottom: t.sp.sm }}>
              Paper Tone
            </Text>
            <View style={styles.optionRow}>
              {(Object.entries(PAPER_TONES) as [PaperToneKey, typeof PAPER_TONES[PaperToneKey]][]).map(([key, tone]) => {
                const active = settings.toneKey === key && !settings.followSystem;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setTone(key)}
                    style={[styles.toneBtn, { backgroundColor: tone.paper, borderColor: active ? t.accent : t.rule, borderWidth: active ? 2 : 1 }]}>
                    <Text style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 1.5, color: tone.text, textTransform: 'uppercase', fontWeight: '700' }}>
                      {tone.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ marginBottom: t.sp.md }}>
          <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2, textTransform: 'uppercase', color: t.accent, marginBottom: t.sp.sm }}>
            Density
          </Text>
          <View style={styles.optionRow}>
            {(['relaxed', 'compact'] as DensityKey[]).map((d) => {
              const active = settings.density === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => setDensity(d)}
                  style={[styles.typeBtn, { borderColor: active ? t.ink.black : t.rule, backgroundColor: active ? t.ink.black : 'transparent', borderWidth: active ? 2 : 1 }]}>
                  <Text style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 1, fontWeight: '700', color: active ? t.paper : t.ink.black }}>
                    {d.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ marginBottom: t.sp.xl }}>
          <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2, textTransform: 'uppercase', color: t.accent, marginBottom: t.sp.sm }}>
            Background Pattern
          </Text>
          <View style={styles.optionRow}>
            {([
              { key: 'grid', label: 'Graph paper' },
              { key: 'notebook', label: 'Notebook' },
              { key: 'bound', label: 'Plain' },
            ] as { key: AestheticKey; label: string }[]).map(({ key, label }) => {
              const active = settings.aesthetic === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setAesthetic(key)}
                  style={[styles.typeBtn, { borderColor: active ? t.ink.black : t.rule, backgroundColor: active ? t.ink.black : 'transparent', borderWidth: active ? 2 : 1 }]}>
                  <Text style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 1, fontWeight: '700', color: active ? t.paper : t.ink.black }}>
                    {label.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* §IX Account */}
        <SectionLabel color={t.ink.black} borderColor={t.ink.black}>
          §IX · ACCOUNT
        </SectionLabel>

        {userEmail ? (
          <View style={{ marginBottom: t.sp.md, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 1.5, color: t.faded, marginBottom: 2 }}>
                SIGNED IN AS
              </Text>
              <Text style={{ fontFamily: FONT_BODY, fontSize: 15, color: t.ink.black, fontWeight: '600' }}>
                {userEmail}
              </Text>
            </View>
            <Pressable
              onPress={signOut}
              style={{ borderWidth: 1.5, borderColor: t.rule, paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text style={{ fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 1, color: t.faded, fontWeight: '700' }}>
                SIGN OUT
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* §X Data */}
        <SectionLabel color={t.ink.black} borderColor={t.ink.black}>
          §X · DATA BACKUP
        </SectionLabel>

        <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, marginBottom: t.sp.md, lineHeight: 20 }}>
          Data lives in Supabase, synced across devices. Export periodically for offline safety.
        </Text>

        <Pressable
          style={[styles.saveBtn, { backgroundColor: t.ink.blue, marginBottom: t.sp.sm }]}
          onPress={handleExport}>
          <Text style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: '600', color: '#FFF', letterSpacing: 0.3 }}>
            Export JSON Backup
          </Text>
        </Pressable>

        <Pressable
          style={[styles.outlineBtn, { borderColor: t.ink.blue }]}
          onPress={handleImport}>
          <Text style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: '600', color: t.ink.blue, letterSpacing: 0.3 }}>
            Import JSON Backup
          </Text>
        </Pressable>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  header: { paddingVertical: 12 },
  scroll: { flex: 1 },
  content: { padding: 20 },
  sectionLabel: { paddingBottom: 8, marginBottom: 12, borderBottomWidth: 1.5, marginTop: 32 },
  sectionLabelText: { fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: '700' },
  inputField: { borderWidth: 1, borderLeftWidth: 2, padding: 12, fontSize: 15, lineHeight: 22 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  toneBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  saveBtn: { padding: 14, alignItems: 'center' },
  outlineBtn: { borderWidth: 1.5, padding: 14, alignItems: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 14 },
});
