# Habit Journal — AI Assistant Instructions

> **Read this first**, then `docs/PROJECT.md` for full architecture, then `docs/SPRINT_LOG.md` for sprint history, then `docs/FURKAN_CONTEXT.md` for personal context.
>
> This file is the single source of truth for any AI (Claude, Cursor, Copilot, GPT) continuing development.

## Current State (as of 2026-05-26)

**Sprints 1-4 are complete.** App is feature-complete and live.

| Sprint | Title | Status |
|--------|-------|--------|
| 1 | My Foundation (PersonalSetup CRUD) | ✅ |
| 2 | First-time Onboarding + Monthly Foundation Revisit | ✅ |
| 3 | Hyper-Focus month concept (Month + Daily banners) | ✅ |
| 4 | Triple correlation graph (Sleep / Activation / Lost Evening) | ✅ |
| — | Morning Ritual Modal (revisit yesterday) | ✅ |
| — | Claude Design redesign (paper-grid theme system) | ✅ |
| — | Supabase migration (single-user, no auth) | ✅ |
| — | Vercel deploy | ✅ |

## Architecture (Important — read before editing)

### Stack
- **Frontend:** Expo SDK 56 + React Native Web (PWA)
- **Routing:** expo-router (file-based, `app/` directory)
- **Storage:** **Supabase (Postgres)** — single-user, no auth, anon key with permissive RLS
- **Local cache:** in-memory snapshot, hydrated once at startup, mutations diff-synced to Supabase
- **Charts:** custom `react-native-svg`
- **Fonts:** Georgia (body/heading), IBM Plex Mono (mono)
- **Theme system:** 4 paper tones × 2 densities × 3 aesthetics, `useTheme()` hook

### Why snapshot-pattern over direct Supabase queries?
The original IndexedDB code used `getSnapshot()` + `updateSnapshot(updater)` everywhere. To preserve `db/operations.ts` API unchanged, `db/idb.ts` now:
1. Hydrates the full snapshot from Supabase on first `getSnapshot()` call
2. On `updateSnapshot(updater)`: computes new snapshot, diffs by `id` per table, fires `upsert`/`delete` to Supabase (fire-and-forget; UI stays snappy)
3. `memoryCache` keeps the local state authoritative for the session

This means **you can write new operations the same way as before** — no need to touch Supabase directly unless adding a new table.

### Where things live
```
app/
  (tabs)/index.tsx     → DayJournalView (Daily)
  (tabs)/journal.tsx   → Month spread (memorable moments + habit matrix + hyper-focus card)
  (tabs)/graphs.tsx    → Sleep chart + dual/triple correlation
  (tabs)/setup.tsx     → §I Habits, §II My Foundation, §III Month notes, §IV Appearance, §V Backup
  _layout.tsx          → ThemeProvider + DatabaseProvider + OnboardingModal mount

components/
  journal/atoms/       → InkCheck, GridOverlay, DoubleRule, SectionHeader, Eyebrow, PaperCard, StatSlot
  journal/             → DayJournalView, MorningRevisitModal, HabitMatrix, MemorableMoments, ...
  onboarding/          → OnboardingModal (Sprint 2 wizard + monthly revisit)
  setup/               → MyFoundationSection (Sprint 1 CRUD UI)
  charts/              → SvgLineChart, SleepChart, CorrelationChart (Pearson observations)

contexts/
  ThemeContext.tsx        → paper tone + density + aesthetic, localStorage persistence
  DatabaseContext.tsx     → snapshot init + refresh trigger
  DaySelectionContext.tsx → currently selected date

db/
  schema.ts        → TypeScript types (Habit, DayEntry, HabitLog, MetricDefinition, MetricLog, MonthConfig, PersonalSetup)
  supabase.ts      → @supabase/supabase-js client (env-driven)
  idb.ts           → Snapshot store, Supabase-backed (despite the legacy filename)
  operations.ts    → All CRUD functions (use these, never touch Supabase directly)
  seed.ts          → Default metric definitions on first launch
  client.ts        → initDatabase() wrapper

hooks/
  useDayEntry.ts          → single-day state + mutators
  useHabits.ts            → month's habit list + add/edit/remove
  useMetrics.ts           → metric definitions
  useMonthData.ts         → bulk monthly data (habits, dayEntries, logs, config)
  useResponsive.ts        → phone / tablet / desktop breakpoints
  useMorningRevisit.ts    → "did I forget to log yesterday?" check
  useOnboarding.ts        → first-run + month-start wizard trigger
  useBottomPadding.ts     → tab-bar-aware safe-area padding

constants/
  theme.ts → PAPER_TONES, SPACING, FONT_SIZE, INK_BLUE/RED, DAILY_QUOTES, legacy JournalTheme
  pwa.ts   → manifest meta + sw.js registration
```

## Core Principles
- **Mobile-first PWA** — installable, works offline (cached app shell; data needs network)
- **Single-user, no auth** — Supabase project is locked to one user via the publishable anon key
- **Ritual-first** — minimal habits (≤8/month), no push notifications
- **Color system** — black=non-negotiable, blue=positive, red=bad habits
- **No hardcoded personal content** in app code — all user-managed via Setup

## Commands

```bash
cd habit-tracker-claude

npm install              # one-time
npm run dev:web          # local dev → http://localhost:8081
npm run build:web        # production static export → dist/

# Type-check
npx tsc --noEmit -p tsconfig.json
```

## Environment

Required in `.env` (gitignored) and on Vercel:
```
EXPO_PUBLIC_SUPABASE_URL=https://rnckvcvdrndzwxysegui.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ErhRPsXu4Yzw1ym9dUgoog_Veln7yBf
```

Anything prefixed `EXPO_PUBLIC_*` gets inlined at build time.

## Supabase

- **Project:** `rnckvcvdrndzwxysegui` ("Habit Tracker", ap-southeast-1)
- **Tables:** habits, day_entries, habit_logs (with `note`), metric_definitions, metric_logs, month_config (with `hyper_focus`), personal_setups
- **RLS:** enabled, permissive `for all using (true)` policies — fine for single-user but **do NOT** add more users without re-doing auth
- **Migrations:** apply via Supabase MCP `apply_migration` or SQL editor. Snake_case in DB, camelCase in TS (mappers in `db/idb.ts`)

## Deploy

- **Vercel project:** `prj_VD9AuXy4nQVcaLHygvYGLigTO5e8` (team `team_18dTHAaHFXtplRoIim2UTXD5`)
- **Config:** `vercel.json` (build = `npm run build:web`, output = `dist/`)
- **Trigger:** push to `main` on GitHub (`koseogluafurkan/habit-tracker-may-2026`) → Vercel auto-deploys IF Git integration is wired in the Vercel dashboard. Otherwise: `npx vercel --prod` from project root after the `.vercel/project.json` link exists.

## When adding a feature

1. **Schema change?** Update `db/schema.ts` AND apply a Supabase migration AND update the row-mappers at the top of `db/idb.ts`
2. **New CRUD?** Add to `db/operations.ts` using `updateSnapshot()` — never touch Supabase directly
3. **New UI surface?** Use `useTheme()` for colors/spacing/fonts. Wrap with `GridOverlay` for the paper-grid background
4. **Mark sprint done** in `docs/SPRINT_LOG.md`

## Style rules
- Always use the design tokens from `useTheme()` and `FONT_*` constants — never hardcode colors or fonts
- Eyebrow labels: IBM Plex Mono uppercase, letter-spacing 2-2.2, color `t.accent`
- Titles: Georgia, weight 700, color `t.ink.black`. Italic accent variants in `t.accent`
- Section dividers: `<DoubleRule />` after headers
- Color the habit/metric strip on the right edge: `penColor` with `opacity: checked ? 1 : 0.22`
