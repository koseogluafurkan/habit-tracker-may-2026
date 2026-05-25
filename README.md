# Habit Journal — Mobile Web PWA

Installable habit tracker with analog journal aesthetic. See **[docs/PROJECT.md](docs/PROJECT.md)** for full architecture, data model, migration, and deployment guide.

## Quick Start

```bash
cd habit-tracker
npm install
npm run dev:web
```

Open `http://localhost:8081` → add to Home Screen on iPhone/iPad for full-screen app.

## Features

- **Daily** — Today-first journal with week picker + calendar for any date
- **Month** — Monthly spread + habit matrix
- **Graphs** — Sleep + lifestyle correlation (SVG charts)
- **Setup** — Habits, export/import, month notes
- **Calendar sync** — Future reminders → iOS Calendar (.ics, all-day, 24h alert)
- **Offline** — IndexedDB + service worker

## Deploy (Free)

```bash
npm run build:web   # outputs to dist/
```

Deploy `dist/` to **Cloudflare Pages**, **Vercel**, **Netlify**, or **GitHub Pages** — all have free tiers. Details in [docs/PROJECT.md §8](docs/PROJECT.md).

## Backup Your Data

Setup → **Export JSON Backup**. Required before switching browsers or platforms.

## Full Documentation

→ [docs/PROJECT.md](docs/PROJECT.md) — architecture, data model, platform migration, deployment, design system
