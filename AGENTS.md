# Agent rules

Read **CLAUDE.md** + **docs/PROJECT.md** + **docs/SPRINT_LOG.md** before any change. This file mirrors CLAUDE.md for non-Claude agents (Cursor / Codex / etc).

## Top-level rules

1. **All CRUD goes through `db/operations.ts`** — never touch `@supabase/supabase-js` directly outside `db/`
2. **Schema changes** require BOTH a Supabase migration AND a `db/schema.ts` update AND row-mapper updates in `db/idb.ts`
3. **Theme:** use `useTheme()` for colors/spacing/fonts. Never hardcode. Use `FONT_*` constants
4. **Don't add new dependencies** without asking — the stack is intentionally minimal
5. **Run `npx tsc --noEmit`** before every commit
6. **Mark sprint done** in `docs/SPRINT_LOG.md` after shipping
7. **Update CLAUDE.md + docs/PROJECT.md + docs/SPRINT_LOG.md** every time the architecture changes

## Expo

Expo SDK 56. Read https://docs.expo.dev/versions/v56.0.0/ for the exact API surface before writing platform code.

## File-naming notes

- `db/idb.ts` is a legacy filename — it is the Supabase-backed snapshot store, not IndexedDB
- `JournalTheme` in `constants/theme.ts` is a legacy export — prefer `useTheme()` everywhere
