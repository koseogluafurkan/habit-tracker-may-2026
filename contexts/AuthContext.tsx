/**
 * AuthContext — authentication
 *
 * Strategy: "allow-list gated, per-user accounts"
 *
 * 1. User types an email, alias, or keyword.
 * 2. We call `check_access` RPC which returns the user's email (or null if not listed).
 *    - If email returned → signInWithPassword as THAT user → instant, no magic link.
 *    - If null           → record an access request (RPC `request_access`) and show waitlist.
 *
 * Each access_list row maps to a real Supabase auth user.
 * RLS policies on all data tables enforce per-user isolation via auth.uid().
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/db/supabase';
import { resetIdbCache } from '@/db/idb';

const BYPASS_PASS = 'demo2026';   // shared password for all access-list users

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'waitlisted'; email: string }
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
    const value = input.trim().toLowerCase();
    if (!value) return 'Boş bırakmayın.';

    // ── Step 1: look up user email via alias/value/keyword ──
    const { data: userEmail, error: rpcErr } = await supabase.rpc('check_access', {
      input: value,
    });

    if (rpcErr) {
      console.error('[Auth] check_access failed:', rpcErr.message);
      return `Giriş kontrol edilemedi: ${rpcErr.message}`;
    }

    if (userEmail) {
      // ── Whitelisted → sign in as THIS user's account (instant, no email) ──
      const { error: pwErr } = await supabase.auth.signInWithPassword({
        email: userEmail as string,
        password: BYPASS_PASS,
      });
      if (pwErr) {
        console.error('[Auth] password sign-in failed:', pwErr.message);
        return `Giriş başarısız: ${pwErr.message}`;
      }
      // onAuthStateChange flips state to 'authenticated'
      return null;
    }

    // ── Step 2: not whitelisted → record request + show waitlist message ──
    const { error: reqErr } = await supabase.rpc('request_access', { input: value });
    if (reqErr) console.error('[Auth] request_access failed:', reqErr.message);
    setState({ status: 'waitlisted', email: value });
    return null;
  }, []);

  const resetToEmail = useCallback(() => setState({ status: 'unauthenticated' }), []);

  const signOut = useCallback(async () => {
    resetIdbCache(); // clear in-memory snapshot so next user starts fresh
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
