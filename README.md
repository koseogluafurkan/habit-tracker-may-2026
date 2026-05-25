# Habit Journal

Installable PWA habit tracker with analog journal aesthetic — ritual-first, ADHD-aware, paper-grid design.

→ Full architecture & continuation guide: **[docs/PROJECT.md](docs/PROJECT.md)**
→ AI assistant rules: **[CLAUDE.md](CLAUDE.md)**
→ Sprint history: **[docs/SPRINT_LOG.md](docs/SPRINT_LOG.md)**

## Quick start

```bash
npm install
cp .env.example .env       # fill in Supabase URL + anon key
npm run dev:web            # http://localhost:8081
```

## Features

- **Daily** — Today-first journal. Week strip, calendar, per-habit notes, sleep + metrics, hyper-focus banner
- **Month** — Memorable moments + habit matrix + HyperFocusCard
- **Graphs** — Sleep chart + dual/triple correlation with Pearson observations
- **Setup** — Habits · My Foundation (anti-goals / beliefs / 3-year) · Month notes · Appearance · Backup
- **First-time onboarding** — 3-step wizard (anti-goal → limiting belief → 3-year goal)
- **Monthly foundation revisit** — auto-shown on day 1-3 of each month
- **Morning ritual** — revisit yesterday if a win wasn't logged
- **Calendar sync** — future reminders → iOS Calendar (.ics, all-day, 24h alert)
- **4 paper tones × 2 densities × 3 aesthetics** — `useTheme()` system

## Stack

Expo SDK 56 + React Native Web · expo-router · Supabase Postgres · react-native-svg · date-fns

## Deploy

`npm run build:web` outputs `dist/` (static). Vercel config in `vercel.json`. Push to GitHub → auto-deploys if connected. See [docs/PROJECT.md §9](docs/PROJECT.md#9-development--deploy).

## Backup your data

Setup → §V → **Export JSON Backup**. Required before clearing Supabase data or rotating projects.

## Environment

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
```

Both prefixed `EXPO_PUBLIC_*` so they get inlined at build time.
