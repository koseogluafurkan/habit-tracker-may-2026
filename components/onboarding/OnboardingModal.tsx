// ─── First-time onboarding wizard (Sprint 2) ────────────────────────────────
// 3 steps: Anti-Goals → Limiting Belief → 3-year Goal.
// In month-revisit mode, shows existing data instead of an add form.

import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FONT_BODY, FONT_HEADING, FONT_MONO } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import { addPersonalSetup, getPersonalSetups } from '@/db/operations';
import type { PersonalSetup, PersonalSetupType } from '@/db/schema';

import { DoubleRule } from '../journal/atoms/DoubleRule';
import { GridOverlay } from '../journal/atoms/GridOverlay';

type Step = {
  type: PersonalSetupType;
  num: string;
  eyebrow: string;
  title: string;
  prompt: string;
  placeholder: string;
  accent: 'red' | 'blue' | 'black';
};

const STEPS: Step[] = [
  {
    type: 'anti-goal',
    num: '01',
    eyebrow: 'YOUR FOUNDATION',
    title: 'What you refuse to become',
    prompt: 'Name one anti-goal. A person, a habit, a way of being you actively reject.',
    placeholder: 'Someone who lives passively…',
    accent: 'red',
  },
  {
    type: 'limiting-belief',
    num: '02',
    eyebrow: 'OLD THOUGHTS',
    title: 'A belief you are rewriting',
    prompt: 'What story have you told yourself that no longer serves you?',
    placeholder: 'I work better under pressure…',
    accent: 'black',
  },
  {
    type: 'yearly-goal',
    num: '03',
    eyebrow: 'THE HORIZON',
    title: 'Where you want to be in 3 years',
    prompt: 'One concrete 3-year goal. We will return to this often.',
    placeholder: 'Run my own product company…',
    accent: 'blue',
  },
];

type Props = {
  visible: boolean;
  mode: 'first-run' | 'month-revisit';
  onDismiss: () => void;
};

export function OnboardingModal({ visible, mode, onDismiss }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { refresh } = useDatabase();
  const [stepIdx, setStepIdx] = useState(0);
  const [drafts, setDrafts] = useState<Record<PersonalSetupType, string>>({
    'anti-goal': '', 'limiting-belief': '', 'yearly-goal': '',
  });
  const [existing, setExisting] = useState<PersonalSetup[]>([]);

  useEffect(() => {
    if (visible && mode === 'month-revisit') {
      getPersonalSetups().then(setExisting);
    } else if (visible) {
      setStepIdx(0);
      setDrafts({ 'anti-goal': '', 'limiting-belief': '', 'yearly-goal': '' });
    }
  }, [visible, mode]);

  const step = STEPS[stepIdx];
  const accentColor =
    step?.accent === 'red'  ? t.ink.red :
    step?.accent === 'blue' ? t.ink.blue : t.ink.black;
  const isLastStep = stepIdx === STEPS.length - 1;

  const handleNext = async () => {
    if (mode === 'first-run') {
      const draft = drafts[step.type].trim();
      if (draft) {
        await addPersonalSetup(step.type, draft);
      }
    }
    if (isLastStep) {
      refresh();
      onDismiss();
    } else {
      setStepIdx(stepIdx + 1);
    }
  };

  const bg = t.dark ? 'rgba(255,240,200,0.04)' : 'rgba(255,250,235,0.6)';

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={[styles.container, { backgroundColor: t.paper, paddingTop: insets.top + 12 }]}>
        <GridOverlay />

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
          <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2.2, textTransform: 'uppercase', color: t.accent, marginBottom: 4 }}>
            {mode === 'first-run' ? '✶ WELCOME · LAY THE FOUNDATION' : `☼ ${new Date().toLocaleString('en', { month: 'long' }).toUpperCase()} REVISIT · YOUR FOUNDATION`}
          </Text>
          <Text style={{ fontFamily: FONT_HEADING, fontSize: t.fs.h1, fontWeight: '700', color: t.ink.black, lineHeight: t.fs.h1 * 0.98 }}>
            {mode === 'first-run' ? 'Before you begin.' : 'The bedrock, revisited.'}
          </Text>
          <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, marginTop: 6, maxWidth: 520 }}>
            {mode === 'first-run'
              ? 'Three questions to root the journal. You can edit any of these later in Setup.'
              : 'Read what you wrote. Edit anytime in Setup → My Foundation.'}
          </Text>
          <DoubleRule marginTop={t.sp.md} />
        </View>

        {/* Body */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled">

          {mode === 'first-run' && step ? (
            <View>
              {/* Step indicator */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: t.sp.sm }}>
                {STEPS.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: 24, height: 4,
                      backgroundColor: i <= stepIdx ? accentColor : t.rule,
                    }}
                  />
                ))}
                <Text style={{ fontFamily: FONT_MONO, fontSize: 10, color: t.faded, marginLeft: 8, letterSpacing: 1 }}>
                  STEP {stepIdx + 1} / {STEPS.length}
                </Text>
              </View>

              <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2, color: accentColor, marginBottom: 4 }}>
                {step.num} · {step.eyebrow}
              </Text>
              <Text style={{ fontFamily: FONT_HEADING, fontSize: t.fs.h2, fontWeight: '700', color: t.ink.black, marginBottom: 4 }}>
                {step.title}
              </Text>
              <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 14, color: t.faded, marginBottom: t.sp.md }}>
                {step.prompt}
              </Text>

              <TextInput
                style={{
                  borderWidth: 1, borderLeftWidth: 3,
                  borderColor: t.rule, borderLeftColor: accentColor,
                  backgroundColor: bg,
                  color: t.ink.black,
                  padding: 14, minHeight: 110,
                  fontSize: 16, lineHeight: 26, textAlignVertical: 'top',
                  fontFamily: FONT_BODY,
                }}
                multiline
                autoFocus
                placeholder={step.placeholder}
                placeholderTextColor={t.faded}
                value={drafts[step.type]}
                onChangeText={(text) => setDrafts((prev) => ({ ...prev, [step.type]: text }))}
              />
            </View>
          ) : (
            // Month-revisit: show all existing foundation items
            <View>
              {STEPS.map((s) => {
                const items = existing.filter((e) => e.type === s.type);
                const sAccent = s.accent === 'red' ? t.ink.red : s.accent === 'blue' ? t.ink.blue : t.ink.black;
                return (
                  <View key={s.type} style={{ marginBottom: t.sp.xl }}>
                    <Text style={{ fontFamily: FONT_MONO, fontSize: t.fs.meta, letterSpacing: 2, color: sAccent, marginBottom: 4 }}>
                      {s.num} · {s.eyebrow}
                    </Text>
                    <Text style={{ fontFamily: FONT_HEADING, fontSize: t.fs.h3, fontWeight: '700', color: t.ink.black, marginBottom: t.sp.sm }}>
                      {s.title}
                    </Text>
                    {items.length === 0 ? (
                      <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded }}>
                        Nothing recorded. Add in Setup.
                      </Text>
                    ) : (
                      items.map((it) => (
                        <View
                          key={it.id}
                          style={{
                            borderLeftWidth: 3, borderLeftColor: sAccent,
                            paddingLeft: 12, paddingVertical: 6, marginBottom: 4,
                          }}>
                          <Text style={{ fontFamily: FONT_BODY, fontSize: 15, color: t.ink.black, lineHeight: 22 }}>
                            {it.text}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View
          style={{
            flexDirection: 'row', gap: t.sp.sm,
            paddingBottom: insets.bottom + 16,
            paddingTop: t.sp.md,
            paddingHorizontal: 16,
            borderTopWidth: 1, borderTopColor: t.rule,
            backgroundColor: t.paper,
          }}>
          <Pressable
            style={{
              borderWidth: 1.5, borderColor: t.ink.black,
              paddingHorizontal: 18, paddingVertical: 14,
              alignItems: 'center', justifyContent: 'center',
            }}
            onPress={() => {
              refresh();
              onDismiss();
            }}>
            <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 14, color: t.ink.black }}>
              {mode === 'first-run' ? 'Skip for now' : 'Got it'}
            </Text>
          </Pressable>
          {mode === 'first-run' ? (
            <Pressable
              style={{
                flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
                backgroundColor: accentColor,
              }}
              onPress={handleNext}>
              <Text style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: '600', color: '#FFF', letterSpacing: 0.3 }}>
                {isLastStep ? 'Begin the journal →' : 'Next →'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
});
