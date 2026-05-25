# Habit Journal — Claude Code Instructions

> Read this file at the start of every session. 
> Then read `docs/FURKAN_CONTEXT.md` for personal system context.
> Then read `docs/PROJECT.md` for technical architecture.

## Active Sprint
**Sprint 1: My Foundation (PersonalSetup)**

### What to build
1. `db/schema.ts` — Add `PersonalSetup` type
2. `db/operations.ts` — Add 4 CRUD functions
3. `db/idb.ts` — Add PersonalSetup to IndexedDB store
4. `app/(tabs)/setup.tsx` — Add "My Foundation" section
5. `db/schema.ts` + `MonthConfig` — Add `hyperFocus: string | null`

### PersonalSetup type
```typescript
PersonalSetup {
  id: string
  type: 'anti-goal' | 'limiting-belief' | 'yearly-goal'
  text: string
  sortOrder: number
  createdAt: string
  targetDate?: string   // optional, for yearly-goal
  status?: 'active' | 'done'
}
```

### CRUD functions needed
```typescript
getPersonalSetups(type?: PersonalSetup['type']): Promise<PersonalSetup[]>
addPersonalSetup(type: PersonalSetup['type'], text: string): Promise<PersonalSetup>
updatePersonalSetup(id: string, text: string): Promise<void>
deletePersonalSetup(id: string): Promise<void>
```

### UI Rules (critical)
- NO hardcoded lists. Everything user-managed.
- Add / Edit / Delete for every item.
- Three sections: Anti-Goals / Limiting Beliefs / Yearly Goals
- Same visual language as existing Setup tab.
- This app will eventually be used by others — no personal content in code.

## Core Principles
- Mobile-first PWA
- No backend, IndexedDB only
- Ritual-first, not notification-heavy
- Minimal habits (≤8/month)
- Color system: black=non-negotiable, blue=positive, red=bad habits

## Stack
- Expo SDK 56 + React Native Web
- expo-router, IndexedDB, react-native-svg, date-fns
- NO expo-sqlite, NO gifted-charts, NO native builds

## Commands
```bash
cd habit-tracker
npm run dev:web     # development
npm run build:web   # production → dist/
```

## After completing Sprint 1
Read `docs/SPRINT_LOG.md` for next sprint.