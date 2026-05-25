import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AddToHomeScreenBanner } from '@/components/AddToHomeScreenBanner';
import { DaySelectionProvider } from '@/contexts/DaySelectionContext';
import { DatabaseProvider } from '@/contexts/DatabaseContext';
import { registerServiceWorker } from '@/constants/pwa';
import { JournalTheme } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AppShell() {
  const { contentMaxWidth } = useResponsive();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: JournalTheme.background,
        maxWidth: contentMaxWidth,
        width: '100%',
        alignSelf: 'center',
      }}>
      <AddToHomeScreenBanner />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: JournalTheme.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <DaySelectionProvider>
          <StatusBar style="dark" />
          <AppShell />
        </DaySelectionProvider>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
