# Sprint Log

Newest first. Each sprint is a self-contained feature shipped end-to-end.

---

## Iteration 2 — Morning tab + Sticky Reminders + Countdowns + UX pass ✅
**Shipped:** 2026-05-26 (late)

A broad batch covering a new tab, two new always-visible UI surfaces, and
~10 UX/bug fixes from user feedback.

### New features
- **Morning tab** (`app/(tabs)/morning.tsx`): yesterday's sleep summary,
  today's "one priority" intention input, custom checklist with progress bar.
  Items managed in Setup §VI. Stored in `morning_routine_items` + `morning_logs`
  + `day_intentions` tables
- **Sticky Reminders** (`components/StickyRemindersBanner.tsx`): always-in-view
  items that remain visible past their due date until manually checked off.
  Banner top of Daily. CRUD in Setup §IV. Stored in `sticky_reminders` table
- **Countdowns Dock** (`components/countdowns/CountdownsDock.tsx`): floating
  horizontal scroller above the tab bar, shows live `Xd` chips for each
  countdown. Hidden when 0 countdowns (no wasted space). Tap chip → edit/delete
  modal. CRUD in Setup §V. Stored in `countdowns` table
- **Metrics CRUD in Setup §VII**: add / remove / configure scale + min/max
- **Future-month habit selection** (`BaselineHabitsSection`): month navigation
  inside Setup §I lets you set up habits for any past/current/future month
- **Theme settings sync across devices**: `user_settings` table (singleton row).
  `ThemeContext` hydrates from cloud on mount, fire-and-forget cloud sync on change
- **Vercel Analytics + Speed Insights** wired in `app/_layout.tsx`
- **Onboarding goal horizon picker**: 6m / 1y / 3y / 5y selector on the
  yearly-goal step; persisted in `personal_setups.goal_horizon`

### UX/bug fixes
- Calendar icon enlarged 2x with accent border + "PICK" label
- Hyper-focus banner: stronger blue fill + paper-color eyebrow in dark mode
  for readability
- On Month view: hyper-focus moved to TOP, same-row as month/year title
- Save Month Settings: inline "✓ Saved" feedback (Alert.alert was easy to miss on PWA)
- Tomorrow's reminder carryover: writes to TOMORROW's `dayReminder`; appears
  next day as top banner "← FROM YESTERDAY'S NOTE FOR TODAY"
- iPad layout: `contentMaxWidth` raised to 1400 (was 1100). New "wide"
  breakpoint at 1440+ uses 1600
- Month spread: shared `DayRow` component ensures left+right pages align by day.
  Reminders show on left page beside memorable moments
- Habit Matrix: dynamic cell sizing (22-48px) based on width / habit count
- High-contrast text colors throughout — no more faded-on-faded buttons

### Schema additions
- New tables: sticky_reminders, countdowns, user_settings, morning_routine_items,
  morning_logs, day_intentions
- New column: personal_setups.goal_horizon
- Migration: `add_reminders_countdowns_user_settings`
- New mappers + diff-sync in `db/idb.ts`
- New CRUD in `db/operations.ts`: `getStickyReminders`/`add`/`update`/`delete`,
  `getCountdowns`/`add`/`update`/`delete`, `getUserSettings`/`upsert`,
  `getMorningRoutineItems`/`add`/`update`/`delete`, `getMorningLogs`,
  `toggleMorningLog`, `getDayIntention`, `setDayIntention`, `updateMetricDefinition`

---

## Sprint 4 — Advanced Correlation Graph ✅
**Shipped:** 2026-05-26

Triple-series correlation in Graphs tab. Default selection auto-picks the three Sprint-4 metrics: **Sleep Hours**, **Morning Activation**, **Evening Lost Time** (seeded via `db/seed.ts`).

- New: dual/triple toggle in `app/(tabs)/graphs.tsx`
- New: third metric picker chip row
- Updated: `CorrelationChart` accepts optional `metricC`, renders three lines (blue/red/black) + three Pearson observation cards (AB, AC, BC)
- Pearson formula: `components/charts/CorrelationChart.tsx` → `pearson()` helper; natural-language observations via `pearsonObservation()`

**Why these three?** They map the personal feedback loop documented in `docs/FURKAN_CONTEXT.md`:
> Bad sleep → low morning activation → evening lost to passive escape → late sleep → repeat.

---

## Sprint 3 — Hyper-Focus Month ✅
**Shipped:** 2026-05-26

A single "tek odak" field per month that surfaces everywhere.

- Schema: `MonthConfig.hyperFocus: string | null` (DB column `hyper_focus`)
- Edit UI: Setup → §III Month Notes → Hyper-Focus input
- Surface 1: `app/(tabs)/journal.tsx` — accent card on the right page (HyperFocusCard, blue ink ribbon)
- Surface 2: `DayJournalView.tsx` — banner above footer reading current month's focus
- If `hyperFocus` is null → both surfaces hide gracefully

---

## Sprint 2 — Onboarding + Monthly Revisit ✅
**Shipped:** 2026-05-26

Three-step wizard on first launch, plus a "month revisit" reminder on day 1-3 of each new month.

- New: `hooks/useOnboarding.ts` — checks PersonalSetup emptiness + monthly localStorage flag
- New: `components/onboarding/OnboardingModal.tsx` — 3 steps (anti-goal, limiting belief, 3-year goal)
- Mounted in `app/_layout.tsx` AppShell

Storage keys:
- `onboarding.completed.v1` — set after first-run wizard dismissed
- `onboarding.month-revisit.YYYY-MM` — set after monthly revisit dismissed

---

## Sprint 1 — My Foundation (PersonalSetup CRUD) ✅
**Shipped:** 2026-05-26

Three editable lists in Setup → §II:
- **Anti-Goals** (red) — what I refuse to become
- **Limiting Beliefs** (black) — thoughts being rewritten
- **3-Year Goals** (blue) — with optional `targetDate`

Each item supports add / edit inline / delete (confirm) / toggle status (`active`/`done` with strikethrough).

- Schema: `PersonalSetup` type added to `db/schema.ts`
- Table: `public.personal_setups` in Supabase
- CRUD: `getPersonalSetups`, `addPersonalSetup`, `updatePersonalSetup`, `deletePersonalSetup` in `db/operations.ts`
- UI: `components/setup/MyFoundationSection.tsx`

---

## Pre-Sprint: Claude Design Redesign ✅
**Shipped:** 2026-05-26

Full visual redesign per the `design_handoff_journal_redesign` package from claude.ai/design.

- New theme token system: PAPER_TONES (cream/linen/kraft/midnight), SPACING + FONT_SIZE density scales (relaxed/compact), AestheticKey (bound/notebook/grid)
- New `ThemeContext` with `useTheme()` + `useThemeSettings()` + localStorage persistence + followSystem (auto cream/midnight from OS)
- IBM Plex Mono bundled as TTF (FONT_MONO)
- Atom components: DoubleRule, Eyebrow, GridOverlay (SVG Pattern), InkCheck (SVG hand-drawn), PaperCard, SectionHeader, StatSlot
- All screens rebuilt: DayJournalView, journal.tsx (Month spread), graphs.tsx (paper-grid charts + Pearson), setup.tsx (§I-V)
- Morning Ritual flow: MorningRevisitModal + useMorningRevisit hook (shown once per day if yesterday lacks a win)
- All UI components migrated from legacy `JournalTheme` → `useTheme()`

---

## Pre-Sprint: Supabase Migration ✅
**Shipped:** 2026-05-26

Replaced IndexedDB with Supabase Postgres (single-user, no auth).

- Project: `rnckvcvdrndzwxysegui` (ap-southeast-1)
- Tables: habits, day_entries, habit_logs (with `note`), metric_definitions, metric_logs, month_config (with `hyper_focus`), personal_setups
- RLS: enabled with permissive `for all using (true)` policies (single-user only)
- Client: `db/supabase.ts` using `@supabase/supabase-js`
- Storage layer: `db/idb.ts` keeps snapshot+updateSnapshot API, internals hydrate from Supabase on init and diff-sync mutations
- Env: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (inlined at build)
- Migration entry point: Supabase MCP `apply_migration` → `init_habit_tracker_schema`

---

## UI Fixes Bundle ✅
**Shipped:** 2026-05-26

- **Setup contrast:** habit type pickers use `t.ink.black` (high contrast) for inactive label instead of faded; active label stays `t.paper`-on-`t.ink.black`
- **Day footer:** "← Revisit yesterday" (left, ink.black) + "Preview tomorrow →" (right, accent) — replaces the old single revisit button
- **Numeric validation:** `NumericInputModal` strips non-numeric chars on input, enforces single decimal point, single leading minus
- **Per-habit per-day notes:** `HabitLog.note: string | null` added. UI: small `+ note` button in each HabitRow → expandable TextInput. Saved via `setHabitLogNote()`. When collapsed, an italic preview line shows the saved note

---

## Sprint Backlog

Ideas for future iterations:

- **Sprint 5 — Free-form journal + gratitude (3 things)** per CLAUDE.md original roadmap
- **Push notifications** — opt-in only (the design ethos is ritual-first, so this remains optional)
- **Multi-device sync** — currently single-user/single-browser via the publishable anon key. Add Supabase Auth to extend
- **Habit templates** — common monthly setups one-click

---

## How to add a new sprint

1. Append a new section at the top of this file in the format above
2. Update `CLAUDE.md` "Current State" table to reference it
3. If schema changes: apply Supabase migration AND update `db/schema.ts` AND update row-mappers in `db/idb.ts`
4. Commit message: `feat(sprint-N): <title>`
