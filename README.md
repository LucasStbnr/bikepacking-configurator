# Packrig — bikepacking setup builder

Configure your bikepacking rig: pick a bike, mount bags on an interactive diagram, pack your gear, compare setups by weight/volume/price, and run a packing checklist before you leave.

## Stack

- **Next.js 16** (App Router, React 19, TypeScript) — Server Actions for all mutations
- **Tailwind CSS v4** with a custom light "spec-sheet" design system
- **SQLite + Drizzle ORM** (`better-sqlite3`) — single-file DB, migrations run automatically at boot
- Dynamic OG images (`next/og`), sitemap/robots, Umami analytics

## Development

```bash
npm install
npm run db:seed   # optional demo data
npm run dev
```

Data (SQLite DB + uploaded images) lives in `./data/` (override with `DATA_DIR`).

Useful scripts:

- `npm run db:generate` — generate a new Drizzle migration after editing `src/db/schema.ts`
- `npm run db:seed` — seed demo products and a demo setup (no-ops if products exist)

## Deploying on Coolify

One single app resource — **no separate database instance needed** (SQLite):

1. Create an **Application** from this repo, build pack **Dockerfile**.
2. Add a **persistent volume** mounted at **`/app/data`** (holds the SQLite DB and uploaded images).
3. Set the environment variable **`SITE_URL`** to your public URL (e.g. `https://packrig.example.com`) — used for canonical URLs, OG tags and the sitemap.
4. Deploy. Migrations run automatically on boot.

## Structure

```
src/
  app/                 pages (setups, configurator, checklist, compare, gear library)
  components/bike/     SVG bike diagram (4 styles, mount zones, geometry)
  components/setups/   configurator, gear panel, totals, checklist, compare
  components/products/ gear library CRUD
  actions/             Server Actions (products, setups, checklist)
  db/                  Drizzle schema, client (auto-migrate), queries
  lib/                 totals, formatting, analytics, OG helpers
drizzle/               SQL migrations
```
