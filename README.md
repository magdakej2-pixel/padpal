# PadPal 🏠

**Find your perfect flatmate, then find your perfect flat — together.**

PadPal is a mobile-first web app that matches people based on lifestyle compatibility using AI. Swipe, match, chat, and collaborate on house hunting — all in one place.

## Features

- **🔐 Verified Users** — Email OTP + phone verification + Google OAuth
- **🧠 AI Matching** — Weighted cosine similarity algorithm based on lifestyle quiz answers (schedule, cleanliness, budget, social habits, hobbies, pets)
- **👆 Tinder-Style Discovery** — Swipe left/right/up on profiles with drag gestures and match animations
- **💬 Real-Time Chat** — Supabase Realtime-powered messaging with unread counts
- **🏡 Room Listings** — Post, browse, and filter listings by type, price, and room type
- **🔍 Search Together** — Premium feature: browse listings collaboratively with your matched flatmate
- **⚡ Profile & Listing Boosts** — One-time Stripe payments for increased visibility
- **💎 Premium Subscriptions** — Weekly, monthly, or quarterly plans via Stripe Checkout
- **📱 PWA Ready** — Installable with Web App Manifest and proper viewport/safe-area handling

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, TypeScript |
| Styling | TailwindCSS 4, Inter font |
| Auth | Supabase Auth (OTP + OAuth) |
| Database | Supabase (PostgreSQL + RLS) |
| Storage | Supabase Storage (profile photos) |
| Payments | Stripe (Checkout + Webhooks) |
| Hosting | Vercel (recommended) |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local
# Fill in your Supabase URL, keys, and Stripe keys

# 3. Run Supabase migrations
# Copy and execute the SQL files in Supabase SQL Editor:
# - supabase-migration.sql
# - supabase-storage.sql
# - supabase-delete-policies.sql

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/              — Next.js App Router pages
├── api/          — API routes (checkout, subscription, webhooks, account)
├── discover/     — Tinder-style swipe UI
├── chats/        — Conversations & messages
├── listings/     — Room listings (browse, create, edit)
├── profile/      — User profile management
├── premium/      — Subscription plans
├── search-together/ — Collaborative house hunting
└── ...
components/       — Reusable UI components
lib/              — Utilities (Supabase, Stripe, matching algorithm, quiz)
types/            — TypeScript interfaces
```

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key variables:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase connection
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Stripe API
- `NEXT_PUBLIC_STRIPE_PRICE_*` — Stripe Price IDs for subscription plans and boosts

## License

Private — All rights reserved.
