# LocalPro

A local services marketplace where customers find, compare, and book trusted local service
providers — and providers manage their business from the same app.

**Core loop:** Customer browses approved providers in their city → books a time slot → provider
accepts and completes the job → customer reviews it. LocalPro takes a 10% commission on every
booking.

## Start small, then expand

The pitch behind this app covers nine service categories (plumbing, cleaning, haircuts, handyman,
car detailing, gardening, moving, tech repair, pet services). Building all of them at once is how
marketplace MVPs die before anyone uses them, so v1 launches with exactly one:

**Home Cleaning, one city.** The schema and UI already support more categories (see the
`categories` table and the "coming soon" tiles on the browse screen) — turning one on is a
one-row update, not a rebuild.

## v1 feature set

**Customers**

- Browse approved providers by category + city, sorted by rating or price
- Provider profile: bio, services & prices, reviews, weekly availability
- Book a service: pick a date, see real open time slots (computed from the provider's working
  hours minus their existing bookings), add notes
- My bookings: upcoming / completed / cancelled, cancel a pending or accepted booking
- Leave a star rating + comment after a completed booking

**Providers**

- Onboard as a provider (business name, city) — starts unapproved until an admin reviews it
- Add/remove services with price & duration
- Set weekly working hours
- Accept, decline, or mark a booking completed
- Earnings summary: completed jobs, total earned, pending payout (after the platform fee)

**Admin**

- Approve or suspend provider accounts
- View all bookings platform-wide
- Platform stats: approved providers, completed bookings, gross booking value, fee revenue

Explicitly out of scope for v1: real payment collection (Stripe), geo-distance search (city is a
text match, not lat/lng), multi-category providers, disputes/refunds tooling, and push
notifications (email only, and only if Resend is configured).

## Commission model

Every booking snapshots `price`, `platform_fee` (10% of price), and `provider_payout` at the
moment it's created — computed **server-side** by a Postgres trigger from the service's current
price, never trusted from the client. Changing `platform_fee_percent()` in
`supabase/migrations/0001_init.sql` only affects bookings created after the change.

## Tech stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Supabase (Postgres + Auth + Row Level Security)
- **Auth:** Supabase email magic links (no passwords to manage)
- **Notifications:** Supabase Edge Function on booking create/status-change, emailing via
  [Resend](https://resend.com) (optional — the app works without it)

## Getting started

### 1. Create a Supabase project

Create a free project at [supabase.com](https://supabase.com), then apply the schema:

```bash
# using the Supabase CLI, from the project root
supabase link --project-ref your-project-ref
supabase db push
```

Or paste the contents of `supabase/migrations/0001_init.sql` into the Supabase SQL editor. This
creates the `categories`, `profiles`, `provider_profiles`, `services`, `availability`, `bookings`,
and `reviews` tables, seeds the nine categories (only `cleaning` is `is_live`), and sets up Row
Level Security so:

- anyone can browse approved providers, their services, availability and reviews
- a provider can only manage their own business
- a customer can only see/create/cancel their own bookings; a provider can only see and act on
  bookings made with them
- an admin (see below) can see and manage everything

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

Sign in with your email — Supabase sends a magic link, no password needed. On first sign-in
you'll choose whether you're finding a service or offering one.

### 4. Make yourself an admin (optional)

There's no admin sign-up flow by design — grant it manually once you have a user:

```sql
update public.profiles set role = 'admin' where id = 'the-users-auth-uid';
```

### 5. Approve a provider

A new provider's profile is created but hidden from customers (`is_approved = false`) until an
admin approves it from the **Providers** tab of the admin dashboard.

### 6. Booking notification emails (optional)

The notifier lives in `supabase/functions/notify-booking`. The client calls it right after a
booking is created (emails the provider) and right after its status changes (emails the
customer).

```bash
supabase functions deploy notify-booking
supabase secrets set RESEND_API_KEY=your_resend_key NOTIFY_FROM_EMAIL=notify@yourdomain.com
```

Without Resend configured, the function still runs but silently skips sending — nothing else in
the app depends on it.

## Project structure

```
src/
  components/
    customer/    Browse providers, provider profile + booking modal, my bookings + reviews
    provider/    Bookings, services, availability, earnings
    admin/       Provider approvals, all bookings, platform stats
    AuthGate.tsx, RoleSetup.tsx, Header.tsx
  hooks/         useAuth, useProfile, useMarketplace, useCustomerBookings,
                 useProviderPortal, useAdmin
  lib/           Supabase client
  utils/         formatting + the availability-slot generator
  types.ts       shared types + weekday labels
supabase/
  migrations/    schema, RLS policies, price/rating triggers, provider_busy_slots() RPC
  functions/     notify-booking Edge Function
```

## Roadmap (v2+)

- Real payment capture at booking time (Stripe), instead of a snapshotted fee/payout on trust
- Turn on more categories from the pitch (plumbing, handyman, gardening, …) once cleaning proves
  the model in one city
- Geo-distance search (Mapbox/Google Maps) instead of a city text match
- DB-level constraints on which booking-status transitions each side may make
- Provider subscriptions, featured listings, and a premium customer membership
- Push notifications alongside email
