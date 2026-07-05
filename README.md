# The Weekly Reset

A free 5-minute guided ritual that closes out your week without judgment and
sets up the next one with less friction — no streaks, no scores, no starting
over. An [Undisciplined](https://stan.store) system.

## Status

- **Phase 1 — Skeleton + wizard: ✅ built.** Landing page, 5-step wizard with
  localStorage autosave/resume, summary card with client-side 1080×1920 PNG
  download, recurring-weekly `.ics` generation. A stranger on a phone can
  complete a reset and download their card with zero accounts and zero
  backend writes.
- Phase 2 — Capture + persistence (Supabase + Resend + magic-link `/history`): pending credentials.
- Phase 3 — Reminders + analytics + polish: not started.
- Phase 4 — Launch hardening: not started.

## Stack

Next.js (App Router, TypeScript) · Tailwind CSS 4 · Supabase (Phase 2) ·
Resend (Phase 2) · Plausible (Phase 3) · Vercel.

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

No env vars are required for Phase 1 — the anonymous flow is fully client-side.

## Environment variables

| Variable | Used from | Purpose |
|----------|-----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Phase 1 | Absolute URL used in the .ics event description |
| `NEXT_PUBLIC_STAN_STORE_HABIT_TRACKER_URL` | Phase 1 | Product bridge link (hidden until set) |
| `NEXT_PUBLIC_STAN_STORE_CALM_BUDGET_URL` | Phase 1 | Secondary product link (hidden until set) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE` | Phase 2 | Database + magic-link auth |
| `RESEND_API_KEY` / `MAILING_AUDIENCE_ID` | Phase 2 | Transactional email + marketing list |
| `NOTION_TEMPLATE_URL` | Phase 2 | Lead-magnet delivery |
| `PLAUSIBLE_DOMAIN` | Phase 3 | Analytics |
| `ADMIN_STATS_PASSWORD` | Phase 3 | `/admin/stats` gate |

## Deploy

Push to Vercel; every branch gets a preview deploy. Production needs the
`NEXT_PUBLIC_*` vars only until Phase 2 lands.

## Product rules (non-negotiable)

No streaks, scores, grades, percentages, or completion rates anywhere. No red
for user "failure" — red is for genuine technical errors only. Gaps in usage
are never counted, displayed, or referenced. Interrupted resets resume
silently. See `COPY_REVIEW.md` for the strings that need sign-off.
