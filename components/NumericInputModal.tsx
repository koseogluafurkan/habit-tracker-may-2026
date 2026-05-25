import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { JournalTheme } from '@/constants/theme';

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
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
            placeholder="Enter value"
            placeholderTextColor={JournalTheme.textMuted}
            autoFocus={Platform.OS === 'web'}
          />
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={() => onSave(value)}>
              <Text style={styles.saveText}>Save</Text>
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
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: JournalTheme.border,
    padding: 20,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Georgia',
    color: JournalTheme.text,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: JournalTheme.border,
    padding: 12,
    fontSize: 18,
    color: JournalTheme.text,
    marginBottom: 16,
    backgroundColor: JournalTheme.background,
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
    color: JournalTheme.textMuted,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: JournalTheme.accent,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  saveText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
