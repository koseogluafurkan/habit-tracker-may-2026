# Sprint Log

Newest first. Each sprint is a self-contained feature shipped end-to-end.

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
