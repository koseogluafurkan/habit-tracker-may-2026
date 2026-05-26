import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AddToHomeScreenBanner } from '@/components/AddToHomeScreenBanner';
import { CountdownsDock } from '@/components/countdowns/CountdownsDock';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { DaySelectionProvider } from '@/contexts/DaySelectionContext';
import { DatabaseProvider, useDatabase } from '@/contexts/DatabaseContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { registerServiceWorker } from '@/constants/pwa';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useResponsive } from '@/hooks/useResponsive';

// Vercel observability — only loaded on web
let VercelAnalytics: React.FC = () => null;
let VercelSpeedInsights: React.FC = () => null;
try {
  // dynamic require so React Native (native) builds don't crash
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  VercelAnalytics = require('@vercel/analytics/react').Analytics;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  VercelSpeedInsights = require('@vercel/speed-insights/react').SpeedInsights;
} catch { /* not installed or non-web env */ }

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AppShell() {
  const { contentMaxWidth } = useResponsive();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { ready } = useDatabase();
  const { mode, dismiss } = useOnboarding();

  // CountdownsDock sits above the tab bar. Bottom offset = safe-area + tab bar height (~60)
  const tabBarHeight = 60;
  const dockBottom = insets.bottom + tabBarHeight;

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

      {/* Live countdowns dock — hidden when 0 countdowns */}
      <CountdownsDock bottomOffset={dockBottom} />

      {/* Onboarding: first-run wizard + monthly foundation revisit */}
      {ready && mode ? (
        <OnboardingModal visible={true} mode={mode} onDismiss={dismiss} />
      ) : null}
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
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <DatabaseProvider>
          <DaySelectionProvider>
            <StatusBar style="auto" />
            <AppShell />
            <VercelAnalytics />
            <VercelSpeedInsights />
          </DaySelectionProvider>
        </DatabaseProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
