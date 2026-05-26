import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FONT_BODY, FONT_HEADING, FONT_MONO } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useCountdowns } from '@/hooks/useCountdowns';
import type { Countdown } from '@/db/schema';

type Props = {
  visible: boolean;
  countdown: Countdown | null;
  onClose: () => void;
};

export function CountdownEditModal({ visible, countdown, onClose }: Props) {
  const t = useTheme();
  const { update, remove } = useCountdowns();
  const [label, setLabel] = useState('');
  const [date, setDate] = useState('');
  const [icon, setIcon] = useState('');

  useEffect(() => {
    if (countdown) {
      setLabel(countdown.label);
      setDate(countdown.targetDate);
      setIcon(countdown.icon ?? '');
    }
  }, [countdown]);

  if (!countdown) return null;

  const bg = t.dark ? 'rgba(255,240,200,0.04)' : 'rgba(255,250,235,0.6)';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: t.paper, borderColor: t.rule }]}
          onPress={(e) => e.stopPropagation()}>
          <Text style={{
            fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 2,
            color: t.accent, marginBottom: 4,
          }}>
            EDIT COUNTDOWN
          </Text>
          <Text style={{
            fontFamily: FONT_HEADING, fontSize: 22, fontWeight: '700',
            color: t.ink.black, marginBottom: 16,
          }}>
            {countdown.label}
          </Text>

          <Text style={{ fontFamily: FONT_MONO, fontSize: 10, color: t.accent, letterSpacing: 1, marginBottom: 4 }}>
            LABEL
          </Text>
          <TextInput
            style={[styles.input, { borderColor: t.rule, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_BODY }]}
            value={label}
            onChangeText={setLabel}
          />

          <Text style={{ fontFamily: FONT_MONO, fontSize: 10, color: t.accent, letterSpacing: 1, marginBottom: 4, marginTop: 12 }}>
            TARGET DATE (YYYY-MM-DD)
          </Text>
          <TextInput
            style={[styles.input, { borderColor: t.rule, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_MONO }]}
            value={date}
            onChangeText={setDate}
            placeholder="2026-12-31"
            placeholderTextColor={t.faded}
          />

          <Text style={{ fontFamily: FONT_MONO, fontSize: 10, color: t.accent, letterSpacing: 1, marginBottom: 4, marginTop: 12 }}>
            ICON · OPTIONAL EMOJI
          </Text>
          <TextInput
            style={[styles.input, { borderColor: t.rule, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_BODY }]}
            value={icon}
            onChangeText={setIcon}
            placeholder="🎯"
            placeholderTextColor={t.faded}
            maxLength={4}
          />

          <View style={styles.actions}>
            <Pressable
              onPress={async () => {
                await remove(countdown.id);
                onClose();
              }}
              style={[styles.btn, { borderWidth: 1.5, borderColor: t.ink.red }]}>
              <Text style={{ fontFamily: FONT_MONO, fontSize: 12, color: t.ink.red, letterSpacing: 1 }}>
                DELETE
              </Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={onClose}
              style={[styles.btn, { paddingHorizontal: 14 }]}>
              <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 14, color: t.faded }}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                await update(countdown.id, { label, targetDate: date, icon: icon || null });
                onClose();
              }}
              style={[styles.btn, { backgroundColor: t.ink.black, paddingHorizontal: 16 }]}>
              <Text style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: '600', color: t.paper }}>
                Save
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(44,36,22,0.45)',
    justifyContent: 'center', padding: 24,
  },
  sheet: {
    borderWidth: 1, padding: 20,
    maxWidth: 440, width: '100%', alignSelf: 'center',
  },
  input: {
    borderWidth: 1, padding: 10, fontSize: 14, lineHeight: 20,
  },
  actions: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 20, gap: 8,
  },
  btn: {
    paddingVertical: 10, paddingHorizontal: 12,
    alignItems: 'center', justifyContent: 'center',
  },
});
