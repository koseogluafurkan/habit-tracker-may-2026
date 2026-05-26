# Habit Journal — Complete Project Documentation

> **Purpose:** Single source of truth for continuing development on any AI tool (Claude, Cursor, GPT, Copilot) without re-onboarding. Read this before touching code.
>
> Companion docs: `CLAUDE.md` (AI assistant rules) · `docs/SPRINT_LOG.md` (sprint history) · `docs/FURKAN_CONTEXT.md` (personal user context, do NOT surface in UI)

---

## 1. Product Overview

**Habit Journal** is a mobile-first **Progressive Web App (PWA)** that digitizes an analog gridded-journal habit tracking system. Single-user, ritual-first, ADHD-aware.

### Core philosophy
- **Ritual-first**, not notification-heavy
- **Minimal habits** (≤8 per month), color-coded: black (non-negotiable), blue (positive), red (bad habits)
- **Daily reflection:** memorable moments, sleep, lifestyle metrics, per-habit notes
- **Monthly foundation:** anti-goals + limiting beliefs + 3-year goals revisited at start of each month
- **Hyper-Focus:** a single "tek odak" per month surfaced on Daily + Month views

### Tabs
| Tab | Route | Purpose |
|-----|-------|---------|
| **Morning** | `/(tabs)/morning` | Yesterday's sleep + today's intention + morning routine checklist |
| **Daily** | `/(tabs)/` | Today's journal. Sticky reminders banner · carryover from yesterday · week strip · memorable moment · habits w/ notes · sleep · metrics · hyper-focus |
| **Month** | `/(tabs)/journal` | Monthly spread — aligned moments+reminders left, habit matrix right, hyper-focus top |
| **Graphs** | `/(tabs)/graphs` | Sleep chart + dual/triple correlation w/ Pearson observations |
| **Setup** | `/(tabs)/setup` | §I Habits (multi-month) · §II Foundation · §III Month Notes · §IV Sticky Reminders · §V Countdowns · §VI Morning Routine · §VII Metrics · §VIII Appearance · §IX Backup |

### Persistent UI surfaces
- **CountdownsDock** — horizontal chips above the tab bar showing live "Xd" for each countdown. Hidden when 0 countdowns. Tap to edit
- **StickyRemindersBanner** — top of Daily, shows always-in-view reminders that survive past their due date until checked off
- **OnboardingModal** — first-launch wizard (3 steps: anti-goal, limiting belief, long-term goal w/ horizon picker) + monthly foundation revisit on day 1-3

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo SDK 56 + React Native Web |
| Routing | expo-router (file-based) |
| Storage | **Supabase Postgres** (single-user, no auth, anon key + permissive RLS) |
| Local cache | In-memory snapshot in `db/idb.ts`, hydrated once at startup |
| Charts | Custom SVG (`react-native-svg`) |
| Dates | date-fns |
| Theme | Custom token system with paper tones, density scales, aesthetic variants |
| Fonts | Georgia (body/heading), IBM Plex Mono (mono — bundled TTF) |
| PWA | manifest.json + service worker (`public/sw.js`) |
| Calendar export | ICS files via Web Share API or download |
| Deploy | Vercel (project `prj_VD9AuXy4nQVcaLHygvYGLigTO5e8`) |

### Key dependencies
```json
"expo": "~56.0.4",
"expo-router": "~56.2.6",
"react-native-svg": "15.15.4",
"date-fns": "^4.3.0",
"@supabase/supabase-js": "^2.x",
"expo-blur": "*"
```

### Removed / not used
- IndexedDB (replaced by Supabase + in-memory snapshot)
- `expo-sqlite` / Drizzle
- `react-native-gifted-charts` (web-incompatible — replaced by SvgLineChart)
- Native iOS builds (web-first PWA)

---

## 3. Project Structure

```
habit-tracker-claude/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Daily → DayJournalView
│   │   ├── journal.tsx        # Monthly spread
│   │   ├── graphs.tsx         # Charts + triple correlation
│   │   ├── setup.tsx          # Full settings (5 sections)
│   │   └── _layout.tsx        # Bottom tabs (uses useTheme)
│   ├── _layout.tsx            # Root: SafeArea, Theme, DB, DaySelection, OnboardingModal
│   └── +html.tsx              # PWA meta tags + global CSS
├── components/
│   ├── journal/
│   │   ├── atoms/             # DoubleRule, Eyebrow, GridOverlay, InkCheck, PaperCard, SectionHeader, StatSlot
│   │   ├── DayJournalView.tsx
│   │   ├── MorningRevisitModal.tsx
│   │   ├── HabitMatrix.tsx
│   │   ├── MemorableMoments.tsx
│   │   ├── CompactDayPicker.tsx
│   │   ├── CalendarModal.tsx
│   │   └── DayColumn.tsx
│   ├── onboarding/
│   │   └── OnboardingModal.tsx  # Sprint 2 wizard + monthly revisit
│   ├── setup/
│   │   └── MyFoundationSection.tsx  # Sprint 1 CRUD UI
│   ├── charts/
│   │   ├── SvgLineChart.tsx
│   │   ├── SleepChart.tsx
│   │   └── CorrelationChart.tsx  # Pearson observations (dual + triple)
│   ├── NumericInputModal.tsx     # Digit-only validation
│   ├── AddToHomeScreenBanner.tsx
│   └── StyledText.tsx
├── contexts/
│   ├── ThemeContext.tsx          # Paper tones, density, aesthetic — localStorage-persisted
│   ├── DatabaseContext.tsx       # Supabase snapshot init + refresh
│   └── DaySelectionContext.tsx
├── db/
│   ├── supabase.ts               # @supabase/supabase-js client
│   ├── idb.ts                    # Snapshot store (Supabase-backed; legacy filename)
│   ├── operations.ts             # All CRUD — USE THIS, never touch Supabase directly
│   ├── schema.ts                 # TypeScript types
│   ├── seed.ts                   # Default metrics (incl. Sprint 4 triple)
│   └── client.ts                 # initDatabase() wrapper
├── hooks/
│   ├── useDayEntry.ts
│   ├── useHabits.ts
│   ├── useMetrics.ts
│   ├── useMonthData.ts
│   ├── useMorningRevisit.ts
│   ├── useOnboarding.ts          # Sprint 2 trigger
│   ├── useResponsive.ts
│   └── useBottomPadding.ts
├── utils/
│   ├── dates.ts
│   ├── export.ts                 # JSON backup
│   └── calendar.ts               # ICS generation
├── constants/
│   ├── theme.ts                  # PAPER_TONES, SPACING, FONT_SIZE, INK_*, DAILY_QUOTES, legacy JournalTheme
│   └── pwa.ts                    # manifest meta + sw.js registration
├── public/                       # manifest.json, sw.js, icons
├── assets/
│   └── fonts/                    # SpaceMono, IBMPlexMono
├── docs/
│   ├── PROJECT.md                # This file
│   ├── SPRINT_LOG.md             # All sprints, newest first
│   └── FURKAN_CONTEXT.md         # User context (private)
├── CLAUDE.md                     # AI assistant rules
├── AGENTS.md                     # Cursor/codex agent rules (mirrors CLAUDE.md)
├── README.md                     # User-facing intro
├── vercel.json                   # Build & deploy config
├── .env.example
└── .env                          # Gitignored — Supabase URL + anon key
```

---

## 4. Data Model

### Supabase tables (snake_case in DB)

| Table | Columns |
|-------|---------|
| `habits` | id, year, month, name, color (black/blue/red), type (boolean/numeric), sort_order, created_at |
| `day_entries` | id, **date** (unique 'YYYY-MM-DD'), memorable_moment, day_reminder, sleep_hours, sleep_score, created_at |
| `habit_logs` | id, day_entry_id (FK CASCADE), habit_id (FK CASCADE), value, **note**, UNIQUE(day_entry_id, habit_id) |
| `metric_definitions` | id, name, scale (integer/float), min_val, max_val, sort_order |
| `metric_logs` | id, day_entry_id (FK CASCADE), metric_id (FK CASCADE), value, UNIQUE(day_entry_id, metric_id) |
| `month_config` | id, year, month, next_month_ideas, reminder_message, **hyper_focus**, UNIQUE(year, month) |
| `personal_setups` | id, type (anti-goal/limiting-belief/yearly-goal), text, sort_order, target_date, status (active/done), **goal_horizon** (6m/1y/3y/5y/null), created_at |
| `sticky_reminders` | id, text, topic, added_date, due_date, completed, sort_order, created_at |
| `countdowns` | id, label, target_date, icon, sort_order, created_at |
| `user_settings` | id ('singleton'), tone_key, density, aesthetic, follow_system, updated_at |
| `morning_routine_items` | id, text, sort_order, active, created_at |
| `morning_logs` | id, date, item_id (FK CASCADE), completed, UNIQUE(date, item_id) |
| `day_intentions` | id, date (unique), intention, updated_at |

### TypeScript types (`db/schema.ts`)

Mapped to camelCase by mappers at the top of `db/idb.ts`.

```typescript
Habit          { id, year, month, name, color, type, sortOrder }
DayEntry       { id, date, memorableMoment, dayReminder, sleepHours, sleepScore }
HabitLog       { id, dayEntryId, habitId, value, note }
MetricDefinition { id, name, scale, minVal, maxVal, sortOrder }
MetricLog      { id, dayEntryId, metricId, value }
MonthConfig    { id, year, month, nextMonthIdeas, reminderMessage, hyperFocus }
PersonalSetup  { id, type, text, sortOrder, createdAt, targetDate, status }
```

### Rules
- Habits are **scoped per calendar month** (delete a habit → cascade deletes its logs)
- One `DayEntry` per date (created on first save via `getOrCreateDayEntry`)
- Default metrics seeded on first launch (Sprint 4 triple is first three: Sleep Hours, Morning Activation, Evening Lost Time)
- `HabitLog.note` is optional per-day per-habit freetext

---

## 5. Snapshot Pattern (How Storage Actually Works)

`db/idb.ts` (Supabase-backed despite the legacy filename) exports three functions:

```typescript
getSnapshot(): Promise<DatabaseSnapshot>
  // Hydrates from Supabase on first call (parallel fetch all 7 tables).
  // Subsequent calls return in-memory cache.

updateSnapshot(updater: (s) => s): Promise<DatabaseSnapshot>
  // 1. Read current snapshot from memory
  // 2. Run updater to compute next snapshot
  // 3. Update memory IMMEDIATELY (snappy UI)
  // 4. Fire-and-forget diff sync to Supabase:
  //    - rows in next not in prev → upsert
  //    - rows in both but JSON.stringify differs → upsert
  //    - rows in prev not in next → delete by id list

replaceSnapshot(snapshot): Promise<void>
  // For full restore from JSON import
```

**Consequence:** `db/operations.ts` doesn't know Supabase exists. Every CRUD call goes through `updateSnapshot()`. If you add a new table, register its mapper + add it to `fetchSnapshot()` and `syncSnapshot()` in `db/idb.ts`.

---

## 6. Theme System

Three orthogonal axes set via `useThemeSettings()`:

| Axis | Values | Effect |
|------|--------|--------|
| `toneKey` | cream · linen · kraft · midnight | Paper color + ink colors |
| `density` | relaxed · compact | Spacing scale + font size scale |
| `aesthetic` | bound · notebook · grid | Background pattern (grid renders SVG graph paper) |
| `followSystem` | bool | Auto cream/midnight from OS color scheme |

All persisted to `localStorage` key `journal.theme`.

Components read via:
```typescript
const t = useTheme();
// t.paper, t.paperDeep, t.paperHi, t.ink.{black,blue,red}, t.faded, t.rule, t.accent
// t.sp.{xs,sm,md,lg,xl,section}, t.fs.{meta,body,lead,h3,h2,h1,hero}
// t.dark, t.density, t.aesthetic
```

Settings UI: Setup → §IV Appearance.

---

## 7. Key User Flows

### First launch
1. App opens → OnboardingModal triggers (first-run mode) — 3 steps: anti-goal, limiting belief, 3-year goal
2. After save, daily view appears with empty state

### Daily entry (default tab)
1. **Daily** tab → today selected
2. Week strip (Mon-Sun) + 📅 for any date via CalendarModal
3. Fill memorable moment, toggle habits, add notes per habit, log sleep, fill metrics — all auto-save on blur
4. Hyper-Focus banner shown above footer if `monthConfig.hyperFocus` is set
5. Footer: "← Revisit yesterday" (left) + "Preview tomorrow →" (right)

### Morning ritual revisit
- `useMorningRevisit` checks: today's localStorage flag missing AND yesterday has no memorableMoment → opens MorningRevisitModal
- User logs win + habits + sleep for yesterday in one sheet, then continues to today

### Monthly foundation revisit
- On the 1st-3rd of each month, OnboardingModal triggers in `month-revisit` mode
- Read-only view of all PersonalSetup items grouped by type
- Dismissed → localStorage flag prevents re-show that month

### Future reminder + Calendar
1. Select future date via CalendarModal
2. Enter "Reminder for this day"
3. On blur → saved + ICS file generated (`utils/calendar.ts`):
   - All-day event on that date
   - `VALARM` trigger 24 hours before
4. iPhone/iPad: share sheet or `.ics` download → tap → Add to Calendar

### Backup
- Setup → §V Data Backup → Export JSON (downloads `.json` v2 format)
- Setup → §V Data Backup → Import JSON (replaces full snapshot, syncs to Supabase)

---

## 8. Responsive Layout

Breakpoints (`hooks/useResponsive.ts`):
| Width | Breakpoint | Layout |
|-------|------------|--------|
| < 640px | phone | Single column, full width |
| 640–1023px | tablet | max-width 820px, centered |
| ≥ 1024px | desktop | max-width 1100px, 2-column spreads (Daily + Month) |

---

## 9. Development & Deploy

### Local dev
```bash
cd habit-tracker-claude
npm install
npm run dev:web        # http://localhost:8081
```

### Type-check
```bash
npx tsc --noEmit -p tsconfig.json
```

### Build
```bash
npm run build:web      # static export → dist/
```

### Environment

`.env` (gitignored, see `.env.example`):
```
EXPO_PUBLIC_SUPABASE_URL=https://rnckvcvdrndzwxysegui.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ErhRPsXu4Yzw1ym9dUgoog_Veln7yBf
```

For Vercel: set both as Project Environment Variables (Production scope).

### Deploy to Vercel
- `vercel.json` configures: buildCommand=`npm run build:web`, outputDirectory=`dist`, SPA rewrites
- `.vercel/project.json` links to project `prj_VD9AuXy4nQVcaLHygvYGLigTO5e8`
- **Manual:** `npx vercel --prod` from project root
- **Auto:** push to `main` on GitHub if Vercel ↔ GitHub integration is wired in dashboard

### Supabase
- Project ID: `rnckvcvdrndzwxysegui` (region ap-southeast-1)
- Dashboard: https://supabase.com/dashboard/project/rnckvcvdrndzwxysegui
- Migrations are tracked in Supabase's `supabase_migrations` table. Apply new ones via Supabase MCP `apply_migration` or the SQL editor

---

## 10. Adding Features (Cookbook)

### New CRUD field on existing table
1. Update `db/schema.ts` TypeScript type
2. Apply Supabase migration to add the column (`alter table ... add column ...`)
3. Update the row mapper in `db/idb.ts` (both `fromRow` and `toRow`)
4. Update `db/operations.ts` to accept it in upsert/update functions
5. Update UI to display/edit

### New table
1. Add type to `db/schema.ts`
2. Apply Supabase migration: `create table` + RLS enable + permissive policy
3. In `db/idb.ts`:
   - Add `fromRow`/`toRow` mappers
   - Add to `DatabaseSnapshot` type + `emptySnapshot()`
   - Add to `fetchSnapshot()` parallel fetch
   - Add to `syncSnapshot()` call order
4. Add CRUD to `db/operations.ts`
5. Build UI

### New theme paper tone
1. Add to `PAPER_TONES` in `constants/theme.ts`
2. Add a swatch button in Setup → §IV Appearance (auto-renders from `PAPER_TONES` entries)

### New onboarding step
1. Add a new entry to `STEPS` array in `OnboardingModal.tsx`
2. Optionally add new `PersonalSetupType` if needed

---

## 11. Migrating to Another Platform

### What to preserve (zero data loss)
1. Export JSON from Setup → §V before leaving
2. Reuse these files conceptually:
   - `db/schema.ts` — data model
   - `db/operations.ts` — business logic
   - `db/seed.ts` — default metrics
   - `constants/theme.ts` — visual system
   - `docs/PROJECT.md` — this document

### Platform paths

| Target | Approach |
|--------|----------|
| **Next.js / SvelteKit / Nuxt** | Port schema; replace RN components with HTML/CSS; reuse Supabase client directly |
| **Native iOS (SwiftUI)** | Port schema to Swift structs; use Supabase Swift SDK; rebuild UI; import JSON via file picker |
| **Native Android (Compose)** | Port schema to Kotlin data classes; Supabase Kotlin SDK |
| **Flutter** | Port schema to Dart classes; Supabase Flutter SDK |

### JSON import format (v2)
```json
{
  "version": 2,
  "exportedAt": "ISO-8601",
  "habits": [...],
  "dayEntries": [...],
  "habitLogs": [...],
  "metricDefinitions": [...],
  "metricLogs": [...],
  "monthConfig": [...],
  "personalSetups": [...]
}
```

---

## 12. Known Limitations

| Limitation | Reason |
|------------|--------|
| Single-user (no auth) | Intentional — Supabase anon key + permissive RLS. To add users, enable Supabase Auth and rewrite policies |
| Network required | Mutations need Supabase. Reads after first hydration are cached, so the app feels offline-ish until refresh |
| Calendar not 100% automatic on iOS | Web apps must use `.ics` download/share — Apple security limitation |
| No push notifications | Intentional — distraction-free design |

---

## 13. Visual Design System (Quick Reference)

Cream tone (default):
```
paper:     #F4ECDD   paperDeep: #EDE2CC   paperHi: #FAF4E5
ink.black: #1A1410   ink.blue:  #1E3A8A   ink.red: #8B1A1A
faded:     #6B5E4F   rule:      #D9CFBC   accent:  #8B6F47
```

Fonts: Georgia (FONT_HEADING + FONT_BODY), IBM Plex Mono (FONT_MONO)

Layout patterns:
- Eyebrows: IBM Plex Mono uppercase, letter-spacing 2-2.2, color `t.accent`
- Titles: Georgia, weight 700, color `t.ink.black`. Italic accent in `t.accent`
- DoubleRule after page headers
- GridOverlay (SVG Pattern) absolute-positioned background
- Right accent bars on habit/metric rows: penColor with opacity 1 when checked, 0.22 when not

---

## 14. Changelog (Major Decisions)

| Date | Decision |
|------|----------|
| 2026-05-25 | Initial PWA pivot from native iOS — IndexedDB-only |
| 2026-05-25 | Charts: SVG (no gifted-charts) |
| 2026-05-25 | Daily UX: today-first + compact week picker |
| 2026-05-25 | Calendar: ICS export with all-day + 24h VALARM |
| 2026-05-26 | Morning ritual modal (yesterday revisit) |
| 2026-05-26 | Claude Design redesign — theme token system, 4 paper tones, IBM Plex Mono |
| 2026-05-26 | Supabase migration (single-user, no auth) |
| 2026-05-26 | Sprints 1-4 shipped (PersonalSetup, Onboarding, Hyper-Focus, Triple Correlation) |
| 2026-05-26 | Per-habit per-day notes added |
| 2026-05-26 | Vercel deploy live |

---

## 15. Handoff Notes

When continuing in a new AI session, attach the following files and say:
> *"Continue Habit Journal per docs/PROJECT.md + docs/SPRINT_LOG.md + CLAUDE.md"*

- **Entry point:** `app/(tabs)/index.tsx` → `DayJournalView`
- **All CRUD:** `db/operations.ts` (never touch Supabase directly)
- **Supabase MCP:** project ID `rnckvcvdrndzwxysegui`
- **Vercel MCP:** team `team_18dTHAaHFXtplRoIim2UTXD5`, project `prj_VD9AuXy4nQVcaLHygvYGLigTO5e8`
- **GitHub:** `koseogluafurkan/habit-tracker-may-2026`
