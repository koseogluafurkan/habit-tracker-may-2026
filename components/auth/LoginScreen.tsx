/**
 * LoginScreen — shown only when not authenticated.
 *
 * Step 1: user types their email → we send a magic link (OTP).
 * Step 2: user types the 6-digit code from the email → verified in Supabase.
 * After step 2 the session is stored and the user never sees this screen again
 * until the session truly expires (weeks on the same device/browser).
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

type Step = 'email' | 'otp';

export function LoginScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { sendMagicLink, verifyOtp } = useAuth();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const bg = t.dark ? 'rgba(255,240,200,0.04)' : 'rgba(255,250,235,0.6)';

  const handleSend = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const err = await sendMagicLink(email);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setSent(true);
      setStep('otp');
    }
  };

  const handleVerify = async () => {
    if (!otp.trim()) return;
    setLoading(true);
    setError(null);
    const err = await verifyOtp(email, otp);
    setLoading(false);
    if (err) {
      setError('Invalid or expired code. Please try again.');
    }
    // On success, AuthContext will flip to authenticated automatically.
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

          {/* Logo / wordmark */}
          <View style={styles.brand}>
            <Text style={{
              fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 3,
              textTransform: 'uppercase', color: t.accent, fontWeight: '700',
            }}>
              Habit Journal
            </Text>
            <Text style={{
              fontFamily: FONT_HEADING,
              fontSize: 44,
              fontWeight: '700',
              color: t.ink.black,
              letterSpacing: -1,
              lineHeight: 46,
              marginTop: 8,
            }}>
              Your{'\n'}journal.
            </Text>
            <Text style={{
              fontFamily: FONT_BODY, fontStyle: 'italic',
              fontSize: 16, color: t.faded, marginTop: 12, lineHeight: 24,
            }}>
              Sign in to access your data across all your devices.
            </Text>
          </View>

          <DoubleRule marginTop={24} color={t.ink.black} />

          {/* Step 1 — email */}
          {step === 'email' ? (
            <View style={{ marginTop: 32, gap: 16 }}>
              <Text style={{
                fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 2,
                textTransform: 'uppercase', color: t.ink.black, fontWeight: '700',
              }}>
                Your e-mail
              </Text>
              <TextInput
                style={[styles.input, { borderColor: t.rule, borderLeftColor: t.ink.black, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_BODY }]}
                placeholder="you@example.com"
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
                <Text style={{ fontFamily: FONT_MONO, fontSize: 11, color: t.ink.red }}>{error}</Text>
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
            /* Step 2 — OTP */
            <View style={{ marginTop: 32, gap: 16 }}>
              <View style={{
                padding: 14, borderWidth: 1.5, borderLeftWidth: 4,
                borderColor: t.ink.blue, borderLeftColor: t.ink.blue,
                backgroundColor: t.dark ? 'rgba(30,58,138,0.18)' : 'rgba(30,58,138,0.07)',
              }}>
                <Text style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 2, color: t.dark ? t.paperHi : t.ink.blue, fontWeight: '700', marginBottom: 4 }}>
                  CHECK YOUR EMAIL
                </Text>
                <Text style={{ fontFamily: FONT_BODY, fontSize: 14, color: t.ink.black, lineHeight: 20 }}>
                  We sent a 6-digit code to{' '}
                  <Text style={{ fontWeight: '700' }}>{email}</Text>.
                  {'\n'}Enter it below — it expires in 10 minutes.
                </Text>
              </View>

              <Text style={{
                fontFamily: FONT_MONO, fontSize: 11, letterSpacing: 2,
                textTransform: 'uppercase', color: t.ink.black, fontWeight: '700',
              }}>
                6-digit code
              </Text>
              <TextInput
                style={[styles.input, styles.otpInput, { borderColor: t.rule, borderLeftColor: t.ink.black, color: t.ink.black, backgroundColor: bg, fontFamily: FONT_MONO }]}
                placeholder="000000"
                placeholderTextColor={t.faded}
                value={otp}
                onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                onSubmitEditing={handleVerify}
                returnKeyType="done"
              />
              {error ? (
                <Text style={{ fontFamily: FONT_MONO, fontSize: 11, color: t.ink.red }}>{error}</Text>
              ) : null}
              <Pressable
                style={[styles.btn, { backgroundColor: loading ? t.faded : t.ink.black }]}
                onPress={handleVerify}
                disabled={loading || otp.length < 6}>
                {loading ? (
                  <ActivityIndicator color={t.paper} size="small" />
                ) : (
                  <Text style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: '600', color: t.paper }}>
                    Verify & open journal →
                  </Text>
                )}
              </Pressable>

              <Pressable onPress={() => { setStep('email'); setOtp(''); setError(null); }}>
                <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 14, color: t.faded, textAlign: 'center' }}>
                  ← Use a different email
                </Text>
              </Pressable>

              <Pressable onPress={handleSend}>
                <Text style={{ fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 14, color: t.accent, textAlign: 'center' }}>
                  Resend code
                </Text>
              </Pressable>
            </View>
          )}

          <Text style={{
            fontFamily: FONT_MONO, fontSize: 10, letterSpacing: 1,
            color: t.faded, textAlign: 'center', marginTop: 40, lineHeight: 16,
          }}>
            YOUR DATA STAYS IN YOUR SUPABASE DATABASE.{'\n'}NO THIRD PARTIES. NO ADS. SINGLE USER.
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
  otpInput: {
    fontSize: 32, letterSpacing: 12, textAlign: 'center',
    fontWeight: '700', padding: 20,
  },
  btn: {
    padding: 16, alignItems: 'center', justifyContent: 'center',
    minHeight: 54,
  },
});
