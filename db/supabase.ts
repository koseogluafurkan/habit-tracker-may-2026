// ─── Supabase client ───────────────────────────────────────────────────────
// Single-user app, no auth. Uses the publishable (anon) key.
// Env vars are injected at build time via EXPO_PUBLIC_* prefix.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://rnckvcvdrndzwxysegui.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_ErhRPsXu4Yzw1ym9dUgoog_Veln7yBf';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
