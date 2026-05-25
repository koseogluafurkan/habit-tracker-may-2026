# Habit Journal — Complete Project Documentation

> **Purpose:** Single source of truth for continuing development on any platform without re-onboarding. Read this before switching tools, hosts, or frameworks.

---

## 1. Product Overview

**Habit Journal** is a mobile-first **Progressive Web App (PWA)** that digitizes an analog gridded-journal habit tracking system.

### Core philosophy
- **Ritual-first**, not notification-heavy
- **Minimal habits** (≤8 per month), color-coded: black (non-negotiable), blue (positive), red (bad habits)
- **Daily reflection:** memorable moments, sleep, lifestyle metrics
- **Future planning:** reminders sync to iPhone/iPad Calendar as all-day events with 24h alert

### Tabs
| Tab | Route | Purpose |
|-----|-------|---------|
| **Daily** | `/(tabs)/` | Today's journal (default on open). Day picker + full entry form |
| **Month** | `/(tabs)/journal` | Monthly spread (memorable moments list + habit matrix) |
| **Graphs** | `/(tabs)/graphs` | Sleep chart + metric correlation |
| **Setup** | `/(tabs)/setup` | Habit CRUD, month notes, JSON export/import |

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo SDK 56 + React Native Web |
| Routing | expo-router (file-based) |
| Storage | **IndexedDB** (browser-local, offline) |
| Charts | Custom SVG (`react-native-svg`) — no gifted-charts |
| Dates | date-fns |
| PWA | manifest.json + service worker (`public/sw.js`) |
| Calendar export | ICS files (`.ics`) via Web Share API or download |

### Key dependencies
```json
"expo": "~56.0.4",
"expo-router": "~56.2.6",
"expo-linear-gradient": "(installed, optional legacy)",
"react-native-svg": "15.15.4",
"date-fns": "^4.3.0"
```

### Removed / not used
- `expo-sqlite` / Drizzle (replaced by IndexedDB)
- `react-native-gifted-charts` (web incompatible — replaced by SvgLineChart)
- Native iOS/EAS builds (optional; app is web-first PWA)

---

## 3. Project Structure

```
habit-tracker/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Daily view → DayJournalView
│   │   ├── journal.tsx        # Monthly spread
│   │   ├── graphs.tsx         # Charts
│   │   ├── setup.tsx          # Settings + habits
│   │   └── _layout.tsx        # Bottom tabs
│   ├── _layout.tsx            # Root: SafeArea, DB, DaySelection
│   └── +html.tsx              # PWA meta tags + global CSS
├── components/
│   ├── journal/
│   │   ├── DayJournalView.tsx # Main daily entry UI
│   │   ├── CompactDayPicker.tsx  # Week day names + calendar btn
│   │   ├── CalendarModal.tsx     # Full month picker (any date)
│   │   ├── HabitMatrix.tsx
│   │   ├── MemorableMoments.tsx
│   │   └── ...
│   ├── charts/
│   │   ├── SvgLineChart.tsx   # Pure SVG line chart
│   │   ├── SleepChart.tsx
│   │   └── CorrelationChart.tsx
│   └── AddToHomeScreenBanner.tsx
├── contexts/
│   ├── DatabaseContext.tsx    # IndexedDB init + refresh
│   └── DaySelectionContext.tsx # Selected date state
├── db/
│   ├── idb.ts                 # IndexedDB read/write
│   ├── operations.ts          # All CRUD
│   ├── schema.ts              # TypeScript types
│   └── seed.ts                # Default metrics
├── hooks/
│   ├── useDayEntry.ts
│   ├── useHabits.ts
│   ├── useResponsive.ts       # phone / tablet / desktop
│   └── useBottomPadding.ts    # Tab bar safe area
├── utils/
│   ├── dates.ts
│   ├── export.ts              # JSON backup
│   └── calendar.ts            # ICS generation for iOS Calendar
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icon-*.png
└── docs/
    └── PROJECT.md             # This file
```

---

## 4. Data Model

All data lives in **one IndexedDB object** (`habit-tracker-pwa` → store `snapshot` → key `data`).

### Types (`db/schema.ts`)

```typescript
Habit {
  id, year, month, name,
  color: 'black' | 'blue' | 'red',
  type: 'boolean' | 'numeric',
  sortOrder
}

DayEntry {
  id, date: 'YYYY-MM-DD',
  memorableMoment: string | null,
  dayReminder: string | null,      // Future-day reminders
  sleepHours, sleepScore
}

HabitLog { id, dayEntryId, habitId, value: string }
MetricDefinition { id, name, scale, minVal, maxVal, sortOrder }
MetricLog { id, dayEntryId, metricId, value: number }
MonthConfig { id, year, month, nextMonthIdeas, reminderMessage }
```

### Rules
- Habits are **scoped per calendar month**
- One `DayEntry` per date (created on first save)
- Default metrics seeded on first launch: Mood, Stress, Pages Read, Screen Time, Deep Work, Phone Pickups

---

## 5. Key User Flows

### Daily entry (default)
1. App opens → **Daily** tab → **today** selected
2. Compact week picker (Mon–Sun names) + 📅 for any future/past date
3. Fill memorable moment, habits, sleep, metrics (auto-save on blur)

### Future reminder + Calendar
1. Select future date via calendar modal
2. Enter text in "Reminder for this day"
3. On blur → saved to IndexedDB + **ICS file** generated:
   - All-day event on that date
   - `VALARM` trigger **24 hours before**
4. iPhone/iPad: share sheet or `.ics` download → tap → Add to Calendar

> **Note:** Web apps cannot silently write to Calendar without user confirming the `.ics` file or share sheet. This is an iOS security limitation.

### Backup
- **Setup → Export JSON Backup** → downloads `.json`
- **Setup → Import JSON Backup** → restores full database

---

## 6. Responsive Layout

Breakpoints (`hooks/useResponsive.ts`):
| Width | Breakpoint | Layout |
|-------|------------|--------|
| < 640px | phone | Single column, full width |
| 640–1023px | tablet | max-width 820px, centered |
| ≥ 1024px | desktop | max-width 1100px, 2-column daily sections |

---

## 7. Development

```bash
cd habit-tracker
npm install
npm run dev:web        # Development server
npm run build:web      # Production static export → dist/
```

Local URL: `http://localhost:8081`

---

## 8. Deployment (Free / Cheapest Options)

### Recommended: **Cloudflare Pages** (free)
1. Push repo to GitHub
2. [dash.cloudflare.com](https://dash.cloudflare.com) → Pages → Create project
3. Build command: `cd habit-tracker && npm install && npm run build:web`
4. Output directory: `habit-tracker/dist`
5. Free HTTPS + global CDN

### Alternative: **Vercel** (free tier)
```bash
npm i -g vercel
cd habit-tracker
npm run build:web
vercel --prod
```
Set output directory to `dist`.

### Alternative: **Netlify** (free tier)
- Drag & drop `dist/` folder at [app.netlify.com/drop](https://app.netlify.com/drop)
- Or connect GitHub with same build settings as Cloudflare

### Alternative: **GitHub Pages** (free)
1. Build locally: `npm run build:web`
2. Push `dist/` contents to `gh-pages` branch
3. Enable Pages in repo settings

### Custom domain
All above support free custom domains. Point DNS to provider.

### Cost summary
| Option | Cost | HTTPS | Custom domain |
|--------|------|-------|---------------|
| Cloudflare Pages | $0 | ✓ | ✓ |
| Vercel | $0 | ✓ | ✓ |
| Netlify | $0 | ✓ | ✓ |
| GitHub Pages | $0 | ✓ | ✓ |

---

## 9. Migrating to Another Platform

### What to preserve (zero data loss)

1. **Export JSON** from Setup before leaving
2. Copy these files/concepts:
   - `db/schema.ts` — data model
   - `db/operations.ts` — business logic
   - `utils/dates.ts`, `utils/calendar.ts`, `utils/export.ts`
   - `constants/theme.ts` — visual system
   - `docs/PROJECT.md` — this document

### Platform migration paths

| Target | Approach |
|--------|----------|
| **Another web framework** (Next.js, Vue, Svelte) | Port schema + operations; replace RN components with HTML/CSS; keep IndexedDB or use localStorage |
| **Native iOS (SwiftUI)** | Port data model; use SwiftData/Core Data; rebuild UI; import JSON via file picker |
| **React Native (Expo native)** | Reuse most components; swap IndexedDB → expo-sqlite; keep navigation structure |
| **Flutter** | Port schema to Dart classes; use sqflite/hive; rebuild widgets |

### JSON import format
```json
{
  "version": 1,
  "exportedAt": "ISO-8601",
  "habits": [...],
  "dayEntries": [...],
  "habitLogs": [...],
  "metricDefinitions": [...],
  "metricLogs": [...],
  "monthConfig": [...]
}
```

Any new platform should implement `exportAllData()` / `importAllData()` with this shape.

### Checklist before switching platforms
- [ ] Export JSON backup from Setup
- [ ] Screenshot key UI flows for reference
- [ ] Copy `docs/PROJECT.md` to new repo
- [ ] Verify import works on new platform with test JSON
- [ ] Re-test Calendar ICS on target device if reminders are critical

---

## 10. Known Limitations

| Limitation | Reason |
|------------|--------|
| Calendar not 100% automatic on iOS | Web apps must use `.ics` download/share — Apple security |
| Data is per-browser | IndexedDB is not synced across devices unless user exports/imports |
| Habits are per-month | By design (analog journal monthly setup) |
| No push notifications | Intentional (distraction-free design) |

---

## 11. Visual Design System

```typescript
background: '#FAF8F5'    // warm paper
gridLine: '#E8E4DF'
pen.black: '#1A1A1A'     // non-negotiables
pen.blue: '#2563EB'      // positive habits
pen.red: '#DC2626'       // bad habits
accent: '#8B7355'        // UI chrome
Typography: Georgia (journal), SpaceMono (day numbers)
```

---

## 12. Changelog (Major Decisions)

| Date | Decision |
|------|----------|
| Initial | Native iOS Expo app with SQLite |
| PWA pivot | IndexedDB + installable web app |
| Charts | Replaced gifted-charts with SVG (web compatibility) |
| Daily UX | Today-first with compact week picker + calendar modal |
| Calendar | ICS export with all-day + 24h VALARM |

---

## 13. Contact / Handoff Notes

- **Repo path:** `habit-tracker/` inside workspace
- **Entry point:** `app/(tabs)/index.tsx` → `DayJournalView`
- **All CRUD:** `db/operations.ts` → `db/idb.ts`
- **No backend required** — fully client-side

When continuing in a new AI session or platform, attach this file and say: *"Continue Habit Journal per docs/PROJECT.md"*.
