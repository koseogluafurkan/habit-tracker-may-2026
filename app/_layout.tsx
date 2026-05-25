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
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { registerServiceWorker } from '@/constants/pwa';
import { useResponsive } from '@/hooks/useResponsive';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AppShell() {
  const { contentMaxWidth } = useResponsive();
  const t = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.paper,
        maxWidth: contentMaxWidth,
        width: '100%',
        alignSelf: 'center',
      }}>
      <AddToHomeScreenBanner />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: t.paper },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    IBMPlexMono: require('../assets/fonts/IBMPlexMono-Regular.ttf'),
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
      <ThemeProvider>
        <DatabaseProvider>
          <DaySelectionProvider>
            <StatusBar style="auto" />
            <AppShell />
          </DaySelectionProvider>
        </DatabaseProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
