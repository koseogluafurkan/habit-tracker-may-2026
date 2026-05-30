/**
 * Web-compatible alert helpers.
 *
 * React Native Web ships its own Alert implementation but in Expo's static
 * web export the destructive-button callback can silently drop on some browsers.
 * Using window.confirm() + window.alert() directly is the safest cross-platform
 * approach for a PWA.
 */
import { Alert, Platform } from 'react-native';

/** Simple message alert (no callbacks). */
export function showAlert(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

/**
 * Destructive confirm dialog.
 * On web: uses window.confirm(); on native: uses Alert with Cancel + Destructive buttons.
 *
 * @returns Promise<boolean> — true if the user confirmed.
 */
export function confirmDestructive(
  title: string,
  message: string,
  confirmLabel = 'Delete',
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(
      window.confirm(`${title}\n\n${message}\n\nPress OK to ${confirmLabel.toLowerCase()}.`),
    );
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
