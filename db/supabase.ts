// ─── Supabase client ───────────────────────────────────────────────────────
// Single-user app, no auth. Uses the publishable (anon) key.
// Env vars are injected at build time via EXPO_PUBLIC_* prefix.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://rnckvcvdrndzwxysegui.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_ErhRPsXu4Yzw1ym9dUgoog_Veln7yBf';

// Persist the session so users stay logged in (~indefinitely; sessions auto-refresh).
// On web supabase-js uses localStorage by default. We pass it explicitly and guard for
// non-web runtimes so the native bundle doesn't crash when window is undefined.
const hasLocalStorage =
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    ...(hasLocalStorage ? { storage: window.localStorage } : {}),
  },
});
