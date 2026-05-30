/**
 * LoginScreen — shown only when not authenticated.
 *
 * Step 1: user types their email → we call signInWithOtp → Supabase sends a magic link.
 * Step 2: "Check your email" screen — user clicks the link → browser opens the app
 *         → Supabase SDK picks up the #access_token hash → session stored → app opens.
 *
 * After first login on a device, the session is restored silently from localStorage.
 * The user will NOT see this screen again until they explicitly sign out.
 */
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FONT_BODY, FONT_HEADING, FONT_MONO } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { GridOverlay } from '@/components/journal/atoms/GridOverlay';
import { DoubleRule } from '@/components/journal/atoms/DoubleRule';

export function LoginScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { state, sendMagicLink, resetToEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bg = t.dark ? 'rgba(255,240,200,0.04)' : 'rgba(255,250,235,0.6)';
  const awaiting = state.status === 'awaiting_link';

  const handleSend = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const err = await sendMagicLink(email);
    setLoading(false);
    if (err) setError(err);
    // On success, state flips to 'awaiting_link' inside AuthContext
  };

  return (
    <View style={[styles.container, { backgroundColor: t.paper, paddingTop: insets.top }]}>
      <GridOverlay />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled">

          {/* Brand */}
          <View style={styles.brand}>
            <Text style={{
              fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 3,
              textTransform: 'uppercase', color: t.accent, fontWeight: '700',
            }}>
              Habit Journal
            </Text>
            <Text style={{
              fontFamily: FONT_HEADING, fontSize: 44, fontWeight: '700',
              color: t.ink.black, letterSpacing: -1, lineHeight: 46, marginTop: 8,
            }}>
              Your{'\n'}journal.
            </Text>
          </View>

          <DoubleRule marginTop={24} color={t.ink.black} />

          {!awaiting ? (
            /* ── Step 1: Enter email ── */
            <View style={{ marginTop: 32, gap: 16 }}>
              <Text style={{
                fontFamily: FONT_BODY, fontStyle: 'italic',
                fontSize: 15, color: t.faded, lineHeight: 22,
              }}>
                Enter your email and we'll send you a magic link.
                Tap the link in the email to open the journal — no password needed.
              </Text>

              <TextInput
                style={[styles.input, { borderColor: t.rule, borderLeftColor: t.ink.black, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_BODY }]}
                placeholder="your@email.com"
                placeholderTextColor={t.faded}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />

              {error ? (
                <Text style={{ fontFamily: FONT_MONO, fontSize: 11, color: t.ink.red, fontWeight: '700' }}>
                  {error}
                </Text>
              ) : null}

              <Pressable
                style={[styles.btn, { backgroundColor: loading ? t.faded : t.ink.black }]}
                onPress={handleSend}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={t.paper} size="small" />
                ) : (
                  <Text style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: '600', color: t.paper }}>
                    Send magic link →
                  </Text>
                )}
              </Pressable>
            </View>
          ) : (
            /* ── Step 2: Check email ── */
            <View style={{ marginTop: 32, gap: 16 }}>
              {/* Check-email card */}
              <View style={{
                padding: 20, borderWidth: 2, borderLeftWidth: 5,
                borderColor: t.ink.blue, borderLeftColor: t.ink.blue,
                backgroundColor: t.dark ? 'rgba(30,58,138,0.22)' : 'rgba(30,58,138,0.08)',
              }}>
                <Text style={{
                  fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 2, fontWeight: '700',
                  color: t.dark ? t.paperHi : t.ink.blue, marginBottom: 8,
                }}>
                  ✉ CHECK YOUR EMAIL
                </Text>
                <Text style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: '700', color: t.ink.black, lineHeight: 28 }}>
                  Magic link sent to{'\n'}
                  <Text style={{ color: t.accent }}>{email}</Text>
                </Text>
                <Text style={{ fontFamily: FONT_BODY, fontSize: 14, color: t.faded, marginTop: 10, lineHeight: 22 }}>
                  Open the email and tap{' '}
                  <Text style={{ fontWeight: '700', fontStyle: 'italic', color: t.ink.black }}>
                    "Confirm email address"
                  </Text>{' '}
                  or{' '}
                  <Text style={{ fontWeight: '700', fontStyle: 'italic', color: t.ink.black }}>
                    "Log in"
                  </Text>
                  .{'\n\n'}
                  The link will open this app in your browser and sign you in automatically.
                  This page will update on its own — you don't need to come back here.
                </Text>
              </View>

              {/* Steps reminder */}
              <View style={{ gap: 8 }}>
                {[
                  '1. Open the email from Supabase',
                  '2. Tap the blue button in the email',
                  '3. The app opens and you\'re signed in',
                ].map((s) => (
                  <Text key={s} style={{ fontFamily: FONT_MONO, fontSize: 11, color: t.ink.black, letterSpacing: 0.5 }}>
                    {s}
                  </Text>
                ))}
              </View>

              {/* Resend + back */}
              <Pressable
                onPress={handleSend}
                style={[styles.outlineBtn, { borderColor: t.rule }]}>
                {loading ? (
                  <ActivityIndicator color={t.accent} size="small" />
                ) : (
                  <Text style={{ fontFamily: FONT_BODY, fontSize: 14, color: t.faded }}>
                    Resend link
                  </Text>
                )}
              </Pressable>

              <Pressable onPress={() => { setError(null); resetToEmail(); }}>
                <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, textAlign: 'center' }}>
                  ← Use a different email
                </Text>
              </Pressable>
            </View>
          )}

          <Text style={{
            fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 1,
            color: t.faded, textAlign: 'center', marginTop: 48, lineHeight: 16,
          }}>
            YOUR DATA STAYS IN YOUR SUPABASE DATABASE.{'\n'}
            NO THIRD PARTIES. SINGLE USER.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  scroll: { padding: 28, paddingBottom: 60 },
  brand: { paddingTop: 24 },
  input: {
    borderWidth: 1, borderLeftWidth: 3,
    padding: 14, fontSize: 16, lineHeight: 22,
  },
  btn: {
    padding: 16, alignItems: 'center', justifyContent: 'center', minHeight: 54,
  },
  outlineBtn: {
    padding: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, minHeight: 50,
  },
});
