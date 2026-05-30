/**
 * AuthContext — Supabase Magic Link authentication.
 *
 * Strategy:
 *  - Session stored in Supabase's own storage (localStorage on web).
 *  - On app open: try to restore existing session → no re-login needed.
 *  - Session lasts 1 week by default; refreshed silently in the background.
 *  - Magic link sent to user's email; user clicks → handled by the OTP screen.
 *  - After first login on a device, the user is not prompted again until the
 *    session expires (typically weeks/months).
 *
 * Single-user: auth.uid() is locked to RLS policies so data is private.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/db/supabase';

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: User; session: Session };

type AuthContextValue = {
  state: AuthState;
  /** Send a magic link to the given email. Returns an error string or null. */
  sendMagicLink: (email: string) => Promise<string | null>;
  /** Verify a 6-digit OTP that arrived by email. Returns an error string or null. */
  verifyOtp: (email: string, token: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  // Restore session on mount and listen for auth changes
  useEffect(() => {
    // getSession resolves synchronously from localStorage when available
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState({ status: 'authenticated', user: session.user, session });
      } else {
        setState({ status: 'unauthenticated' });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setState({ status: 'authenticated', user: session.user, session });
      } else {
        setState({ status: 'unauthenticated' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendMagicLink = useCallback(async (email: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        // Don't use a redirect URL — we handle OTP entry in-app.
        shouldCreateUser: true,
      },
    });
    return error?.message ?? null;
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string): Promise<string | null> => {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'email',
    });
    return error?.message ?? null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ state, sendMagicLink, verifyOtp, signOut }}>
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
