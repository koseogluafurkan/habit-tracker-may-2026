/**
 * AuthContext — authentication with two paths:
 *
 * FAST PATH (no email, instant):
 *   - User types "demo2026" → signInWithPassword using owner credentials
 *   - User types the owner email → same password flow
 *   → No rate limits, no email needed, works every time.
 *
 * SLOW PATH (magic link, for unfamiliar devices):
 *   - Any other email → signInWithOtp → email with link
 *   → Falls back gracefully if rate-limited.
 *
 * Sessions persist in localStorage → silent restore on next open.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/db/supabase';

// ─── Bypass config ──────────────────────────────────────────────────────────
// Any input in this list → password auth (instant, no email, no rate limit).
const OWNER_EMAIL = 'koseoglu.afurkan@icloud.com';
const BYPASS_PASS = 'demo2026';

// All strings that trigger the password bypass (compared case-insensitively,
// all whitespace stripped — handles iOS autocapitalize / autocomplete weirdness).
const BYPASS_INPUTS: string[] = [
  'demo2026',
  OWNER_EMAIL,
];

function normalise(s: string): string {
  return s.replace(/\s/g, '').toLowerCase();
}

function isBypass(input: string): boolean {
  const n = normalise(input);
  return BYPASS_INPUTS.some((b) => normalise(b) === n);
}

// Production redirect URL (used for magic-link path only)
const APP_URL =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://project-0clek.vercel.app';

// ─── Types ──────────────────────────────────────────────────────────────────
type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'awaiting_link' }
  | { status: 'authenticated'; user: User; session: Session };

type AuthContextValue = {
  state: AuthState;
  /** Try to sign in. Returns an error string or null on success. */
  signIn: (input: string) => Promise<string | null>;
  resetToEmail: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────
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
    // ── Fast path: password auth (instant, no email, no rate limit) ──
    if (isBypass(input)) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email:    OWNER_EMAIL,
        password: BYPASS_PASS,
      });
      if (error) {
        console.error('[Auth] signInWithPassword failed:', error.message, error.status);
        return error.message;
      }
      // onAuthStateChange will fire SIGNED_IN and flip state to 'authenticated'
      console.log('[Auth] signInWithPassword success, user:', data.user?.email);
      return null;
    }

    // ── Slow path: magic link sent to the provided email ──
    const { error } = await supabase.auth.signInWithOtp({
      email: input.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: APP_URL,
      },
    });
    if (!error) setState({ status: 'awaiting_link' });
    return error?.message ?? null;
  }, []);

  const resetToEmail = useCallback(() => {
    setState({ status: 'unauthenticated' });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ state, signIn, resetToEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hooks ───────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useUser(): User | null {
  const { state } = useAuth();
  return state.status === 'authenticated' ? state.user : null;
}
