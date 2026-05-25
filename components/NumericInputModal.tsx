import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FONT_BODY, FONT_HEADING } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type NumericInputModalProps = {
  visible: boolean;
  title: string;
  initialValue?: string;
  onCancel: () => void;
  onSave: (value: string) => void;
};

export function NumericInputModal({
  visible,
  title,
  initialValue = '',
  onCancel,
  onSave,
}: NumericInputModalProps) {
  const t = useTheme();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: t.paper, borderColor: t.rule }]}>
          <Text style={[styles.title, { fontFamily: FONT_HEADING, color: t.ink.black }]}>{title}</Text>
          <TextInput
            style={[styles.input, { borderColor: t.rule, color: t.ink.black, backgroundColor: t.paperDeep, fontFamily: FONT_BODY }]}
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
            placeholder="Enter value"
            placeholderTextColor={t.faded}
            autoFocus={Platform.OS === 'web'}
          />
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={[styles.cancelText, { fontFamily: FONT_BODY, color: t.faded }]}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.saveBtn, { backgroundColor: t.ink.black }]} onPress={() => onSave(value)}>
              <Text style={[styles.saveText, { fontFamily: FONT_BODY, color: t.paper }]}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 36, 22, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    borderWidth: 1,
    padding: 20,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 18,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    fontSize: 18,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelText: {
    fontSize: 16,
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
