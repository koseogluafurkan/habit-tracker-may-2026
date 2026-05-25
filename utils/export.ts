import { Alert, Platform } from 'react-native';

import { exportAllData, importAllData } from '@/db/operations';

function downloadJson(json: string, fileName: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function pickJsonFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      resolve(await file.text());
    };
    input.click();
  });
}

export async function exportDataToFile() {
  const data = await exportAllData();
  const json = JSON.stringify(data, null, 2);
  const fileName = `habit-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;

  if (Platform.OS === 'web') {
    downloadJson(json, fileName);
    return fileName;
  }

  const FileSystem = await import('expo-file-system/legacy');
  const Sharing = await import('expo-sharing');
  const filePath = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Export Habit Tracker Backup',
    });
  }

  return filePath;
}

export async function importDataFromFile() {
  if (Platform.OS === 'web') {
    const content = await pickJsonFile();
    if (!content) return false;

    try {
      const parsed = JSON.parse(content);
      if (!parsed || typeof parsed !== 'object') {
        Alert.alert('Import failed', 'Invalid backup file format.');
        return false;
      }
      await importAllData(parsed);
      Alert.alert('Import complete', 'Your journal data has been restored.');
      return true;
    } catch {
      Alert.alert('Import failed', 'Could not read the backup file.');
      return false;
    }
  }

  const DocumentPicker = await import('expo-document-picker');
  const FileSystem = await import('expo-file-system/legacy');
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return false;

  const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
  const parsed = JSON.parse(content);

  if (!parsed || typeof parsed !== 'object') {
    Alert.alert('Import failed', 'Invalid backup file format.');
    return false;
  }

  await importAllData(parsed);
  Alert.alert('Import complete', 'Your journal data has been restored.');
  return true;
}
