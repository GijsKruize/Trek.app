# Trek?

"Het eten dat voor iedereen aan tafel werkt." A Dutch-language web app for shared meals in student houses, sororities and friend groups: a recipe feed, group dining events (loose and recurring), surprise meals, cost splitting, and no-login guest RSVPs via a share link.

Stack: **Next.js 16** (App Router, TypeScript, Tailwind CSS v4, shadcn/ui on Radix) + **PocketBase** (self-hosted backend, SQLite).

For how the app is put together and what to do next, see **[`HANDOVER.md`](./HANDOVER.md)**. For the full PocketBase schema and the reasoning behind it, see **[`docs/schema.md`](./docs/schema.md)**.

## Setup

Requires Node 20+. PocketBase (arm64/amd64 macOS binary) is already vendored under `pocketbase/pocketbase` — if you're on a different platform, download the matching build from [pocketbase.io/docs](https://pocketbase.io/docs/) and place it there instead.

```bash
npm install
```

Run PocketBase and Next.js in two terminals:

```bash
# Terminal 1 — PocketBase (applies pb_migrations/, loads pb_hooks/)
npm run pb

# first run only: create the local superuser
npm run pb:superuser

# Terminal 2 — Next.js
npm run dev
```

Seed demo data (recipes, ingredients, a group, a recurring series, a shareable event, a surprise event):

```bash
npm run db:seed
```

Open [http://localhost:3000](http://localhost:3000). PocketBase's own admin UI is at [http://127.0.0.1:8090/\_/](http://127.0.0.1:8090/_/) (login: `admin@trek.app` / `TrekAdmin123!`, from `npm run pb:superuser`).

### Demo credentials

All demo users share the password `Wachtwoord123!`:

| Email | Diet / allergy |
|---|---|
| `sanne@trek.app` | vegetarisch |
| `tom@trek.app` | allergisch voor pinda's |
| `ahmed@trek.app` | halal |
| `femke@trek.app` | lactosevrij, allergisch voor amandelen |

Sanne's group "Huize Vrolik" has invite code `VROLIK24`. The seeded loose event's public share link is printed by the seed script (`/share/vrolik-buren-demo`).

### Resetting local data

PocketBase's data lives in `pocketbase/pb_data/` (gitignored). To start over:

```bash
rm -rf pocketbase/pb_data
npm run pb          # re-applies migrations on boot
npm run pb:superuser
npm run db:seed
```

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run pb` | PocketBase, with this repo's migrations and hooks |
| `npm run pb:superuser` | Create/update the local superuser |
| `npm run db:seed` | Populate demo data (see above) |
| `npm run lint` | ESLint |

## Project layout

See `HANDOVER.md` → "Architecture & decisions" for the full picture. Short version: `pb_migrations/` and `pb_hooks/` are the backend (schema + server logic); `src/app/` is the Next.js frontend, split into `(auth)` (login/register), `(app)` (the authenticated bottom-nav shell), and `share/[token]` (the public, unauthenticated page).
