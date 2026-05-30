/**
 * AuthContext — Supabase Magic Link authentication.
 *
 * Flow:
 *  1. User enters email → sendMagicLink() fires signInWithOtp
 *  2. Supabase sends an email with a clickable link
 *  3. User clicks link → browser opens the app URL with #access_token in hash
 *  4. Supabase JS SDK picks up the hash and fires onAuthStateChange → logged in
 *  5. Session saved in localStorage → silent restore on next open (weeks/months)
 *
 * The emailRedirectTo must match the Site URL set in Supabase dashboard.
 * Also requires the URL to be listed in Auth → URL Configuration → Redirect URLs.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/db/supabase';

// Production URL — must match Supabase Auth → URL Configuration → Site URL
const APP_URL =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://project-0clek.vercel.app';

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'awaiting_link' }                               // email sent, waiting for click
  | { status: 'authenticated'; user: User; session: Session };

type AuthContextValue = {
  state: AuthState;
  sendMagicLink: (email: string) => Promise<string | null>;
  resetToEmail: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    // Try to restore existing session from localStorage
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState({ status: 'authenticated', user: session.user, session });
      } else {
        setState({ status: 'unauthenticated' });
      }
    });

    // Listen for auth events (including magic link hash resolution)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setState({ status: 'authenticated', user: session.user, session });
      } else if (_event === 'SIGNED_OUT') {
        setState({ status: 'unauthenticated' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendMagicLink = useCallback(async (email: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        // This is where Supabase redirects after the user clicks the link.
        // Must also be listed in Supabase Auth → URL Configuration → Redirect URLs.
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
    <AuthContext.Provider value={{ state, sendMagicLink, resetToEmail, signOut }}>
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
