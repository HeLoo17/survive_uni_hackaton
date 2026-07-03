# Survive Uni

A minimal web app helping university students survive uni life — assignment deadlines, class schedules, to-dos, subscription payments, and finance tracking.

Built for Malaysia: **MYR** currency, **DD/MM/YYYY** dates, week starts **Monday**.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Features

- **Dashboard** — overview of deadlines, today's classes, todos, subscriptions, and monthly budget
- **Deadlines** — track assignments with course, priority, and overdue filters
- **Schedule** — weekly timetable + one-off events (exams)
- **To-dos** — general tasks with optional "Make assignment" linking
- **Subscriptions** — recurring payments with mark-as-paid (auto-advances next date)
- **Finance** — income/expense log with monthly budget progress bar
- **Settings** — manage courses, load demo data, export/import JSON

Data is stored in **localStorage** (single-user, browser-only). Demo data loads automatically on first visit.

## Git workflow

- **Hackathon:** `dev/hackathon` branch with full MVP
- **Post-demo:** split into `feature/*` branches with Vitest coverage before merge

## License

Apache 2.0 — see [LICENSE](LICENSE).
