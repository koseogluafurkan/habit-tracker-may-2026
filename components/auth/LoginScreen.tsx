/**
 * LoginScreen
 *
 * Two flows depending on what you type:
 *
 *  INSTANT (no email sent):
 *    - Type "demo2026"  → tap Enter → signed in immediately
 *    - Type your email  → tap Enter → signed in immediately
 *
 *  MAGIC LINK (email sent, for other addresses):
 *    - Any other email → "Check email" step appears
 *    - Tap the link in the email → app opens, auto-signed in
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
  const { state, signIn, resetToEmail } = useAuth();

  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const bg = t.dark ? 'rgba(255,240,200,0.04)' : 'rgba(255,250,235,0.6)';
  const awaiting = state.status === 'awaiting_link';

  const handleSignIn = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const err = await signIn(trimmed);
      // On success: state → 'authenticated' (password) or 'awaiting_link' (magic link)
      if (err) setError(`Giriş başarısız: ${err}`);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
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
            /* ── Enter email or shortcut ── */
            <View style={{ marginTop: 32, gap: 14 }}>
              <Text style={{
                fontFamily: FONT_BODY, fontStyle: 'italic',
                fontSize: 15, color: t.faded, lineHeight: 22,
              }}>
                Enter your email or access code to continue.
              </Text>

              <TextInput
                style={[styles.input, {
                  borderColor: t.rule, borderLeftColor: t.ink.black,
                  color: t.ink.black, backgroundColor: bg, fontFamily: FONT_BODY,
                }]}
                placeholder="email or access code"
                placeholderTextColor={t.faded}
                value={input}
                onChangeText={setInput}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                onSubmitEditing={handleSignIn}
                returnKeyType="go"
              />

              {error ? (
                <View style={{
                  padding: 12, borderWidth: 1.5, borderColor: t.ink.red,
                  backgroundColor: t.dark ? 'rgba(139,26,26,0.16)' : 'rgba(139,26,26,0.06)',
                }}>
                  <Text style={{ fontFamily: FONT_MONO, fontSize: 11, color: t.ink.red, fontWeight: '700' }}>
                    {error}
                  </Text>
                </View>
              ) : null}

              <Pressable
                style={[styles.btn, { backgroundColor: loading ? t.faded : t.ink.black }]}
                onPress={handleSignIn}
                disabled={loading}>
                {loading
                  ? <ActivityIndicator color={t.paper} size="small" />
                  : <Text style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: '600', color: t.paper }}>
                      Continue →
                    </Text>}
              </Pressable>
            </View>
          ) : (
            /* ── Awaiting magic link click ── */
            <View style={{ marginTop: 32, gap: 16 }}>
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
                  Link sent to{'\n'}
                  <Text style={{ color: t.accent }}>{input}</Text>
                </Text>
                <Text style={{ fontFamily: FONT_BODY, fontSize: 14, color: t.faded, marginTop: 10, lineHeight: 22 }}>
                  Tap the button in the email to open the journal.
                  This page will update automatically when you click the link.
                </Text>
              </View>

              {['1. Open the Supabase email', '2. Tap the blue login button', '3. App opens and signs you in'].map((s) => (
                <Text key={s} style={{ fontFamily: FONT_MONO, fontSize: 11, color: t.ink.black, letterSpacing: 0.5 }}>
                  {s}
                </Text>
              ))}

              <Pressable
                onPress={handleSignIn}
                style={[styles.outlineBtn, { borderColor: t.rule }]}>
                {loading
                  ? <ActivityIndicator color={t.accent} size="small" />
                  : <Text style={{ fontFamily: FONT_BODY, fontSize: 14, color: t.faded }}>Resend link</Text>}
              </Pressable>

              <Pressable onPress={() => { setError(null); resetToEmail(); }}>
                <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 13, color: t.faded, textAlign: 'center' }}>
                  ← Use a different address
                </Text>
              </Pressable>
            </View>
          )}

          <Text style={{
            fontFamily: FONT_MONO, fontSize: 9, letterSpacing: 1,
            color: t.faded, textAlign: 'center', marginTop: 48, lineHeight: 16,
          }}>
            YOUR DATA IS PRIVATE · SINGLE USER · SUPABASE BACKEND
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
  input: { borderWidth: 1, borderLeftWidth: 3, padding: 14, fontSize: 16, lineHeight: 22 },
  btn: { padding: 16, alignItems: 'center', justifyContent: 'center', minHeight: 54 },
  outlineBtn: { padding: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, minHeight: 50 },
});
