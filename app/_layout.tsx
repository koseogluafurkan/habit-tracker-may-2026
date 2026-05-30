import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AddToHomeScreenBanner } from '@/components/AddToHomeScreenBanner';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
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
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  VercelAnalytics = require('@vercel/analytics/react').Analytics;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  VercelSpeedInsights = require('@vercel/speed-insights/react').SpeedInsights;
} catch { /* not installed or non-web env */ }

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

/** Gated content: only shown when the user is authenticated. */
function AppShell() {
  const { contentMaxWidth } = useResponsive();
  const t = useTheme();
  const { ready } = useDatabase();
  const { mode, dismiss } = useOnboarding();

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

      {/* Onboarding: first-run wizard + monthly foundation revisit */}
      {ready && mode ? (
        <OnboardingModal visible={true} mode={mode} onDismiss={dismiss} />
      ) : null}
    </View>
  );
}

/**
 * AuthGate — sits between ThemeProvider and the rest of the app.
 * - loading: show a tiny spinner (session check, <300ms on subsequent visits)
 * - unauthenticated: show LoginScreen
 * - authenticated: render the full app inside DatabaseProvider
 */
function AuthGate() {
  const { state } = useAuth();
  const t = useTheme();
  const { contentMaxWidth } = useResponsive();

  if (state.status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.paper }}>
        <ActivityIndicator size="large" color={t.accent} />
      </View>
    );
  }

  if (state.status === 'unauthenticated') {
    return (
      <View style={{ flex: 1, maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' }}>
        <LoginScreen />
      </View>
    );
  }

  // Authenticated
  return (
    <DatabaseProvider>
      <DaySelectionProvider>
        <AppShell />
      </DaySelectionProvider>
    </DatabaseProvider>
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
        <AuthProvider>
          <StatusBar style="auto" />
          <AuthGate />
          <VercelAnalytics />
          <VercelSpeedInsights />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
