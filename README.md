# AI Subscription Tracker

A dashboard that tracks all your AI tool subscriptions (ChatGPT, Claude, Midjourney, etc.) — what
you're paying, when they renew, and which ones are overlapping or going unused.

**Core loop:** Add your subscriptions → see total spend → get nudged when something's unused or
overlapping.

## v1 feature set

- Manual subscription entry: name, cost, billing cycle, renewal date, category, notes
- Dashboard: monthly/annual spend totals, upcoming renewals
- Renewal reminder emails, 3 days before a charge (Supabase Edge Function + Resend)
- Manual "last used" check-in (`Used today` button) to flag stale tools
- Category-based overlap detection (writing, image, video, audio, code, productivity, research)

Explicitly out of scope for v1: bank/email auto-detection, per-tool usage API integrations, team
accounts, and a "switch to X and save $Y" recommendation engine.

## Tech stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Supabase (Postgres + Auth + Row Level Security)
- **Auth:** Supabase email magic links (no passwords to manage)
- **Reminders:** Supabase Edge Function on a schedule, emailing via [Resend](https://resend.com)

## Getting started

### 1. Create a Supabase project

Create a free project at [supabase.com](https://supabase.com), then apply the schema:

```bash
# using the Supabase CLI, from the project root
supabase link --project-ref your-project-ref
supabase db push
```

Or paste the contents of `supabase/migrations/0001_init.sql` into the Supabase SQL editor.

This creates a `subscriptions` table with Row Level Security so each user can only see their own
rows.

### 2. Configure the frontend

```bash
cp .env.example .env.local
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from **Project Settings → API** in the
Supabase dashboard.

Under **Authentication → URL Configuration**, make sure your local dev URL (e.g.
`http://localhost:5173`) is in the allowed redirect URLs so magic links work.

### 3. Install and run

```bash
npm install
npm run dev
```

Sign in with your email — Supabase sends a magic link, no password needed.

### 4. Renewal reminder emails (optional for local dev)

The reminder job lives in `supabase/functions/renewal-reminders`. It finds every active
subscription renewing in exactly 3 days and emails the owner via Resend.

```bash
supabase functions deploy renewal-reminders
supabase secrets set RESEND_API_KEY=your_resend_key REMINDER_FROM_EMAIL=reminders@yourdomain.com
```

Then schedule it to run daily. The simplest approach is Postgres `pg_cron` + `pg_net` calling the
function URL:

```sql
select cron.schedule(
  'renewal-reminders-daily',
  '0 13 * * *', -- 1pm UTC daily; adjust to taste
  $$
  select net.http_post(
    url := 'https://<your-project-ref>.functions.supabase.co/renewal-reminders',
    headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>')
  );
  $$
);
```

(Enable the `pg_cron` and `pg_net` extensions first under **Database → Extensions**.)
Alternatively, use the Supabase Dashboard's built-in Cron UI for Edge Functions if available on
your project, or an external scheduler (GitHub Actions cron, cron-job.org) hitting the function URL.

## Project structure

```
src/
  components/    UI: dashboard, forms, tables, auth screen
  hooks/         useAuth, useSubscriptions (Supabase queries)
  lib/           Supabase client
  utils/         billing math (monthly/annual normalization, staleness, dates)
  types.ts       shared types + category/billing-cycle options
supabase/
  migrations/    SQL schema + RLS policies
  functions/     renewal-reminders Edge Function
```

## Roadmap (v2+)

- Auto-detect subscriptions via bank or email parsing
- Per-tool usage API integrations (token counts, message counts, etc.)
- Team/shared subscription tracking
- "Switch to X, save $Y" recommendations based on category overlap
