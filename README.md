# VENDOR BIDDING SYSTEM

**[▶ Watch the demo video](https://drive.google.com/file/d/108COrv-5c5EPq5hLQEJ1NzreMpqpMxv2/view?usp=sharing)**: both portals end to end, from creating a quotation to booking and paying a vendor.

Vendor bidding and booking system for Mero Event. It has two portals:

- **Admin portal**: manage vendors, create quotations (event details, items, reference photos), send them to one or more vendors, compare bids, select the winner, and track the booking's amount, payments and pending balance, with the vendor's payment details (bank account or QR) on the booking.
- **Vendor portal**: see requests sent to you, review the details and photos, submit or decline a bid, follow your bids and bookings, and keep your profile and payment details (bank account and/or QR) up to date.

Each vendor sees only its own requests, bids and bookings.

## Contents

- [Demo video](#demo-video)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Demo logins](#demo-logins)
- [Environment](#environment)
- [API](#api)
- [Migrations (backend)](#migrations-backend)
- [Useful scripts](#useful-scripts)
- [Known limits](#known-limits)
- [Future scope](#future-scope)
- [Module notes](#module-notes)

## Demo video

[Watch the full walkthrough on Google Drive](https://drive.google.com/file/d/108COrv-5c5EPq5hLQEJ1NzreMpqpMxv2/view?usp=sharing). It covers the admin portal (vendors, quotations, bid comparison, bookings and payments) and the vendor portal (requests, bidding, bookings and payment details).

## Tech stack

| Part | Stack |
| --- | --- |
| Frontend (`frontend/`) | Next.js, TypeScript, TanStack Query, react-hook-form + zod, shadcn/ui, Tailwind CSS |
| Backend (`backend/`) | NestJS, TypeORM, class-validator, Swagger, helmet, express-rate-limit |
| Database | PostgreSQL (Docker) |
| Auth | JWT in an httpOnly `access_token` cookie, backed by a revocable server-side session; admin and vendor roles |

## Prerequisites

Node 24, pnpm and Docker.

## Setup

```bash
# 1. Git hooks (husky pre-commit lints the backend and frontend)
pnpm install

# 2. Database
docker compose up -d

# 3. Backend on http://localhost:4000
cd backend
pnpm install
cp .env.example .env          # set JWT_SECRET: openssl rand -hex 32
pnpm migration:run
pnpm seed                     # demo admin and vendors; skips existing rows, refuses in production
pnpm start:dev

# 4. Frontend on http://localhost:3000, in another terminal
cd frontend
pnpm install
cp .env.example .env.local
pnpm dev
```

Open http://localhost:3000 and sign in with a demo login below.

## Demo logins

| Login | Password | Role |
| --- | --- | --- |
| `admin@meroevent.com` | `Admin@12345` | Admin |
| `decor@vendor.test`, `catering@vendor.test`, `sound@vendor.test` | `Vendor@12345` | Vendor, each linked to its own vendor |

## Environment

| Variable | Where | Purpose |
| --- | --- | --- |
| `NODE_ENV` | backend | Required: `development`, `test` or `production`. Production enables the `Secure` cookie and hides Swagger |
| `DATABASE_URL` | backend | Postgres connection, matches `docker-compose.yml` by default |
| `JWT_SECRET` | backend | At least 32 characters |
| `JWT_EXPIRES_IN_SECONDS` | backend | Session length, 7 days by default (logout revokes a session early) |
| `FRONTEND_ORIGIN` | backend | Allowed CORS origin for the cookie |
| `TRUST_PROXY` | backend | Reverse-proxy hops in front of the API, `0` by default; set it behind a proxy so rate limits count per client |
| `UPLOAD_DIR` | backend | Folder for uploaded quotation photos and vendor payment QR codes |
| `NEXT_PUBLIC_API_URL` | frontend | API base URL, `http://localhost:4000/api/v1` |

## API

All routes live under `/api/v1`. Swagger UI is at http://localhost:4000/api/docs (not served when `NODE_ENV=production`). Admin routes sit at the root (`/vendors`, `/quotations`, `/bookings`), and vendor routes under `/vendor/...` are always scoped to the signed-in vendor.

Security: logout revokes the server-side session behind the JWT; failed logins are limited to 10 per 15 minutes per IP and the whole API to 300 requests per minute per IP (`429` beyond that); `helmet` sets the standard security headers.

Validation: every form checks its fields with a zod schema that mirrors the API's DTO and shows errors under the field. The API re-validates everything (`class-validator`, unknown fields refused). Server errors appear as a toast, except on the login form, which shows them inline.

## Migrations (backend)

The TypeORM CLI runs the TypeScript source through ts-node (`src/database/data-source.ts`); `dist/` is only for `start:prod`.

```bash
pnpm migration:generate src/migrations/<name>   # kebab-case, e.g. src/migrations/create-bids
pnpm migration:run
pnpm migration:revert
```

Reset the local database with `docker compose down -v`, then run the migrations and seed again.

## Useful scripts

| Command | Where | What it does |
| --- | --- | --- |
| `pnpm start:dev` | backend | API with watch mode |
| `pnpm lint` | backend, frontend | oxlint (backend), eslint (frontend) |
| `pnpm seed` | backend | Demo data, development only |
| `pnpm build` | frontend | Production build |

## Known limits

- Photos and payment QR codes are stored on local disk, so a second server or a container restart loses them.
- No password reset and no audit log yet. Rate limits are kept in memory, so several API instances would each count separately.
- An unknown login email is rejected faster than a wrong password, so response timing can reveal which emails exist (slowed down by the login rate limit).
- No notifications: vendors only see new requests when they log in.
- One winner per quotation, and a bid is overwritten when the vendor edits it (no history).
- Retrying a payment request can record it twice (overpaying is still blocked by the database).
- No automated tests.

## Future scope

1. **Notifications** by email, later SMS: request sent, deadline near, bid selected, payment recorded.
2. **Vendor invites and password reset by email**, so admins stop sharing passwords by hand.
3. **Object storage** (S3 or Supabase) for photos and vendor documents.
4. **Award per item**, so one event can use several vendors.
5. **Vendor ratings and history** in the bid comparison, so "best" means more than "cheapest".
6. **Payment schedules, receipts and online payouts** (eSewa, Khalti).
7. **Reports**: spend per event and vendor, win rates, bid spread.

## Module notes

Each backend module (`backend/src/<module>/README.md`) has a short README with its routes, rules and design decisions.
