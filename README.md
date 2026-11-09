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

## Project docs

Features, data model, workflow, design decisions, the demo script and future scope are in [docs/README.md](docs/README.md). Each backend module also has its own `README.md`.
