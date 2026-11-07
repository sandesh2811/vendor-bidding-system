# VENDOR BIDDING SYSTEM

NestJS + TypeORM + PostgreSQL API (`backend/`) and a Next.js client (`frontend/`).

## Prerequisites

Node 24, pnpm, and Docker (for PostgreSQL).

## Run locally

```bash
# 0. Git hooks (husky pre-commit lints backend/frontend)
pnpm install

# 1. Database
docker compose up -d

# 2. Backend (http://localhost:4000)
cd backend
pnpm install
cp .env.example .env          # set JWT_SECRET: openssl rand -hex 32
pnpm migration:run
pnpm seed                     # demo admin + vendors (skips existing; refuses in production)
pnpm start:dev

# 3. Frontend (http://localhost:3000), in another terminal
cd frontend
pnpm install
cp .env.example .env.local
pnpm dev
```

Project docs (features, design, demo script): [docs/README.md](docs/README.md)

API docs (Swagger UI, not served when `NODE_ENV=production`): http://localhost:4000/api/docs

## API

All routes live under `/api/v1`. The session is an httpOnly `access_token` cookie.

| Method | Path                  | Notes                         |
| ------ | --------------------- | ----------------------------- |
| POST   | `/api/v1/auth/login`  | `{ email, password }`         |
| POST   | `/api/v1/auth/logout` | clears the cookie             |
| GET    | `/api/v1/auth/me`     | current user, 401 if no session |
| GET/POST | `/api/v1/vendors`   | admin: list (paginated) / create vendor + login |
| GET/PATCH | `/api/v1/vendors/:id` | admin: view / edit, `isActive: false` deactivates |

## Migrations (backend)

The TypeORM CLI runs the TypeScript source directly via ts-node (`src/database/data-source.ts`); `dist/` is only for `start:prod`.

```bash
pnpm migration:generate src/migrations/<name>   # kebab-case, no `--`, e.g. src/migrations/create-bids: diffs entities against the DB into src/migrations/
pnpm migration:run
pnpm migration:revert
```

Reset the local database: `docker compose down -v`.

## Seed data (backend, not in production)

`pnpm seed` runs `src/database/seeds/seed.ts`, which calls each seeder in order and exits if `NODE_ENV=production`.

| Login | Password | Role |
| --- | --- | --- |
| `admin@meroevent.com` | `Admin@12345` | admin (no vendor) |
| `decor@vendor.test`, `catering@vendor.test`, `sound@vendor.test` | `Vendor@12345` | vendor, each linked to its own vendor |
