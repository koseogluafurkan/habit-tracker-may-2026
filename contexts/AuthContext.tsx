/**
 * AuthContext — authentication
 *
 * Strategy: "try password first, fall through to magic link"
 *
 * 1. User types "demo2026" → use owner email + that password → instant sign-in
 * 2. User types ANY email  → try signInWithPassword with BYPASS_PASS first
 *    - If it works (owner account): signed in instantly, no email sent
 *    - If it fails:  send magic link to that email
 *
 * This removes ALL string-comparison logic. The bypass is implicit:
 * whoever has the right password gets in; everyone else gets a magic link.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/db/supabase';

const OWNER_EMAIL = 'koseoglu.afurkan@icloud.com';
const BYPASS_PASS = 'demo2026';   // set via SQL: crypt('demo2026', gen_salt('bf'))

// Where Supabase redirects after user clicks a magic link in email.
// Must be whitelisted in: Supabase → Auth → URL Configuration → Redirect URLs
const APP_URL =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://project-0clek.vercel.app';

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'awaiting_link' }
  | { status: 'authenticated'; user: User; session: Session };

type AuthContextValue = {
  state: AuthState;
  signIn: (input: string) => Promise<string | null>;
  resetToEmail: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState(session?.user
        ? { status: 'authenticated', user: session.user, session }
        : { status: 'unauthenticated' });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setState({ status: 'authenticated', user: session.user, session });
      } else if (_event === 'SIGNED_OUT') {
        setState({ status: 'unauthenticated' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (input: string): Promise<string | null> => {
    const raw = input.trim();
    if (!raw) return 'Boş bırakmayın.';

    // "demo2026" → owner email + password (no email sent)
    const isDemoCode = raw.toLowerCase() === 'demo2026';
    const emailToUse = isDemoCode ? OWNER_EMAIL : raw.toLowerCase();

    // ── Step 1: try password auth (instant, no email, no rate limit) ──
    const { error: pwErr } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: BYPASS_PASS,
    });

    if (!pwErr) {
      // onAuthStateChange will flip state to 'authenticated'
      return null;
    }

    // If the user typed "demo2026" and password failed, it's a Supabase error.
    if (isDemoCode) {
      console.error('[Auth] demo bypass failed:', pwErr.message);
      return `Giriş başarısız: ${pwErr.message}`;
    }

    // ── Step 2: password didn't work → send magic link ──
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: emailToUse,
      options: {
        shouldCreateUser: false,   // don't create new users — this is single-user
        emailRedirectTo: APP_URL,
      },
    });

    if (!otpErr) {
      setState({ status: 'awaiting_link' });
      return null;
    }

    return `Magic link gönderilemedi: ${otpErr.message}`;
  }, []);

  const resetToEmail = useCallback(() => setState({ status: 'unauthenticated' }), []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ state, signIn, resetToEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useUser(): User | null {
  const { state } = useAuth();
  return state.status === 'authenticated' ? state.user : null;
}
