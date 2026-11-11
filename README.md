# VENDOR BIDDING SYSTEM

Vendor bidding and booking system for Mero Event. It has two portals:

- **Admin portal**: manage vendors, create quotations (event details, items, reference photos), send them to one or more vendors, compare bids, select the winner, and track the booking's amount, payments and pending balance.
- **Vendor portal**: see requests sent to you, review the details and photos, submit or decline a bid, follow your bids and bookings, and keep your profile up to date.

Each vendor sees only its own requests, bids and bookings.

## Tech stack

| Part | Stack |
| --- | --- |
| Frontend (`frontend/`) | Next.js, TypeScript, TanStack Query, shadcn/ui, Tailwind CSS |
| Backend (`backend/`) | NestJS, TypeORM, class-validator, Swagger |
| Database | PostgreSQL (Docker) |
| Auth | JWT in an httpOnly `access_token` cookie, admin and vendor roles |

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
| `DATABASE_URL` | backend | Postgres connection, matches `docker-compose.yml` by default |
| `JWT_SECRET` | backend | At least 32 characters |
| `JWT_EXPIRES_IN_SECONDS` | backend | Session length, 7 days by default |
| `FRONTEND_ORIGIN` | backend | Allowed CORS origin for the cookie |
| `UPLOAD_DIR` | backend | Folder for uploaded quotation photos |
| `NEXT_PUBLIC_API_URL` | frontend | API base URL, `http://localhost:4000/api/v1` |

## API

All routes live under `/api/v1`. Swagger UI is at http://localhost:4000/api/docs (not served when `NODE_ENV=production`). Admin routes sit at the root (`/vendors`, `/quotations`, `/bookings`), and vendor routes under `/vendor/...` are always scoped to the signed-in vendor.

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

- Photos are stored on local disk, so a second server or a container restart loses them.
- Logout doesn't revoke the JWT, so a stolen cookie works until it expires (7 days).
- No password reset, no login rate limiting and no audit log yet.
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
