<div align="center">

# Pulse

### A Next.js 16 admin dashboard on real PostgreSQL

KPIs that compare with the last period, revenue charts, and an orders table you can search, filter, sort, page, export and update.

[![Next.js 16](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?logo=drizzle&logoColor=000)](https://orm.drizzle.team)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[**Watch the build on YouTube**](https://www.youtube.com/@osamaayubdev) · [Run it locally](#quick-start) · [Deploy](#deploy)

![Switching date ranges, then searching, filtering and sorting orders](docs/demo.gif)

</div>

## Contents

- [Features](#features)
- [Quick start](#quick-start)
- [Use your own PostgreSQL](#use-your-own-postgresql)
- [How it works](#how-it-works)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Security and quality](#security-and-quality)
- [Deploy](#deploy)
- [Practise](#practise)

## Features

| | |
| --- | --- |
| **KPIs with context** | Revenue, orders, average order and new customers, each compared with the previous period |
| **Date ranges** | 7 days, 30 days, 90 days or 12 months, kept in the URL (`?range=90d`) so a view can be shared |
| **Charts** | Revenue over time (day, week or month buckets, gaps filled with zero) and revenue by category |
| **Orders table** | Search by name, email or `#order`, filter by status, sort by date or total, 12 rows per page |
| **All in SQL** | Filtering, sorting, counting and paging run in PostgreSQL; the browser gets one page of rows |
| **Mark shipped** | A Server Action with `useActionState`. The status check is inside the `UPDATE`, so double clicks are safe |
| **CSV export** | Downloads the current filtered view, with cells that spreadsheets can't run as formulas |
| **Real PostgreSQL** | `DATABASE_URL` or Netlify Database; creates its own tables and demo data on first start. Falls back to a built-in demo database |

<table>
  <tr>
    <td width="68%"><img src="docs/orders.jpg" alt="Orders page with search, status filters, sorting and Mark shipped buttons"></td>
    <td><img src="docs/mobile.jpg" alt="The overview page on a phone"></td>
  </tr>
  <tr>
    <td align="center">Orders: search, filter, sort, export, ship</td>
    <td align="center">Works on phones</td>
  </tr>
</table>

## Quick start

You need Node.js 20 or newer.

```bash
git clone https://github.com/osamaayub/pulse-dashboard.git
cd pulse-dashboard
npm install
npm run dev
```

Open http://localhost:3000. With no `.env.local`, the app runs on a built-in demo database (PGlite: PostgreSQL compiled to WebAssembly), seeded with two years of orders. Nothing to install, but changes reset when the server restarts.

## Use your own PostgreSQL

Any PostgreSQL works: one on your machine, Docker, [Neon](https://neon.tech), Supabase, Railway or AWS RDS.

**1. Start PostgreSQL** (skip if you have one). With Docker:

```bash
docker run --name pulse-db -e POSTGRES_USER=pulse -e POSTGRES_PASSWORD=pulse -e POSTGRES_DB=pulse -p 5432:5432 -d postgres:16
```

**2. Add the connection string** to `.env.local` (this file is git-ignored):

```bash
cp .env.example .env.local
# then edit: DATABASE_URL=postgres://pulse:pulse@localhost:5432/pulse
```

**3. Create the tables and demo data:**

```bash
npm run db:setup
```

```text
Created tables and added 420 customers, 15 products, 3911 orders and 7824 order items.
Done in 0.6s.
```

Run it again any time: it never duplicates data. Use `npm run db:setup -- --reset` to start over. (The app also creates the tables and demo data by itself on first start, so this step is optional.)

**4. Run the app** with `npm run dev`. Click **Mark shipped** on an order, then check the database:

```bash
psql "$DATABASE_URL" -c "select id, status from orders where status = 'shipped' order by id desc limit 3"
```

## How it works

```mermaid
flowchart LR
    U["Browser<br/>?range=30d&q=khan&page=2"] --> P["Server Component page"]
    P --> Z["Zod parses params<br/>bad input → safe defaults"]
    Z --> Q["queries.ts<br/>Drizzle, run in parallel"]
    Q --> DB[("PostgreSQL")]
    P --> H["HTML streams to the browser<br/>+ 2 small chart components"]
    B["Mark shipped button"] --> A["Server Action<br/>UPDATE ... WHERE status = 'paid'"]
    A --> DB
    A --> R["revalidatePath → fresh data"]
```

Design rules:

1. **The URL is the state.** Range, search, filter, sort and page live in the query string. Refresh, the back button and shared links all show the same view.
2. **Only charts run in the browser.** Everything else renders on the server, so the page ships little JavaScript.
3. **User input is parsed, never trusted.** Search params and environment variables go through Zod, and search text is escaped for `ILIKE`.
4. **Money is stored in cents** as integers, so totals never pick up decimal rounding errors.

## Architecture

The code is split by **feature**, not by file type. Everything about orders (its queries, Server Action, URL schema, CSV logic and components) lives in one folder, so a change to orders touches one place.

```mermaid
flowchart TB
    subgraph app["app/  (routes: thin, no logic)"]
      R1["page.tsx"]; R2["orders/page.tsx"]; R3["api/orders/export"]
    end
    subgraph features["features/  (business logic + UI per feature)"]
      A["analytics<br/>range · queries · overview · charts"]
      O["orders<br/>params · queries · actions · csv · table"]
    end
    subgraph server["server/  (infrastructure)"]
      DB["db.ts: Postgres pool or demo DB"]; ENV["env.ts: validated config"]; SC["schema.ts · ddl.ts · seed.ts"]
    end
    LIB["lib/  (pure helpers: format, url)"]
    R1 --> A; R2 --> O; R3 --> O; A --> O
    A --> DB; O --> DB; DB --> ENV; DB --> SC
    A --> LIB; O --> LIB
```

Rules the code follows:

| Layer | Can import | Never |
| --- | --- | --- |
| `app/` routes | features, components | SQL or business rules |
| `features/*/queries.ts`, `actions.ts` | `server/`, `lib/` | React components |
| `features/*/components` | its feature, `components/`, `lib/` | the database directly |
| `server/` | nothing above it | UI code (`server-only` makes the build fail if a client file imports it) |
| `lib/` | nothing | side effects (pure functions, unit tested) |

## Project structure

```text
src/
├── app/                              # Routes only: parse the URL, render a feature
│   ├── page.tsx
│   ├── orders/page.tsx
│   └── api/orders/export/route.ts    # CSV download
├── features/
│   ├── analytics/
│   │   ├── range.ts                  # ?range= schema, date windows, % change
│   │   ├── queries.ts                # KPIs, revenue series, categories, top products
│   │   └── components/               # overview.tsx, charts.tsx (Recharts, client)
│   └── orders/
│       ├── params.ts                 # ?q=&status=&sort=&page= schema
│       ├── queries.ts                # search, filter, sort, paginate in SQL
│       ├── actions.ts                # "Mark shipped" Server Action
│       ├── csv.ts                    # formula-safe CSV cells
│       └── components/               # orders-table, search-box, ship-button, status-badge
├── server/
│   ├── db.ts                         # Postgres pool + first-start setup, or the demo database
│   ├── env.ts                        # Environment variables, validated with Zod
│   ├── schema.ts                     # Tables for Drizzle
│   ├── ddl.ts                        # The same tables as SQL (used by db:setup)
│   └── seed.ts                       # Deterministic two-year demo store
├── components/                       # App shell: sidebar, panels, pills
└── lib/                              # format.ts, url.ts
scripts/db-setup.mjs                  # npm run db:setup
netlify/database/migrations/          # tables for Netlify Database
test/                                 # params, dates, deltas, seed, CSV
```

## Security and quality

- Security headers on every response (`nosniff`, `DENY` framing, strict referrer, permissions policy)
- Every URL param and form value is validated with Zod
- The ship action can only move `paid` orders to `shipped`, checked inside the SQL `UPDATE`
- CSV cells starting with `=`, `+`, `-` or `@` are escaped, so a customer name can't run a spreadsheet formula
- TLS is required for remote databases
- Environment variables validated at startup (`src/server/env.ts`)
- Tests (Vitest) for param parsing, date windows, deltas, seed consistency and CSV safety
- Keyboard focus styles, labelled controls, reduced-motion support

```bash
npm test            # unit tests
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run build       # production build
```

## Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/osamaayub/pulse-dashboard)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fosamaayub%2Fpulse-dashboard)

**Netlify (real PostgreSQL included).** The repo has a migration in `netlify/database/migrations/` and depends on `@netlify/database`, so Netlify creates a PostgreSQL database for the project on the first deploy and sets `NETLIFY_DB_URL` for you. On its first request the app adds two years of demo orders. No keys to copy.

**Any other host.** Add `DATABASE_URL` (Neon, Supabase, Railway, RDS...) to the host's environment variables and deploy. The app creates its tables and demo data on first start, so there's nothing else to run.

Which database runs, in order: `DATABASE_URL`, then `NETLIFY_DB_URL`, then the built-in demo database.

GitHub Pages can't host this app, because it runs server code and a database. The code lives on GitHub; the app runs on Netlify or Vercel.

## Practise

1. Add a Customers page with lifetime value per customer.
2. Add a custom date range picker.
3. Add sign-in so only admins can see the dashboard. (Video: sign in with GitHub and Google in Next.js 16.)

## Author

Built by [Osama Ayub](https://github.com/osamaayub), full-stack developer (React, Next.js, Node.js, PostgreSQL, AI integration).
Need a dashboard or internal tool for your business? [Hire me on Upwork](https://www.upwork.com/freelancers/~01c0c3cf471b66a427).

## License

[MIT](LICENSE)
