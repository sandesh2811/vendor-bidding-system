# Auth

## TL;DR

Cookie-based sessions for both portals. Login opens a server-side session and sets an httpOnly JWT cookie pointing to it. Middleware turns it into `req.user` on every request, and `@Auth(...roles)` guards routes by role. Logout revokes the session, so a copied token stops working.

## Overview

- **Users**: credentials and session users come from `UsersService`.
- **Vendors**: `VendorContextMiddleware` (vendors module) runs right after `UserContextMiddleware` and only lets **active** vendors through.
- **Every other module**: controllers use `@Auth(UserRole.Admin)` or `@Auth(UserRole.Vendor)`, plus `@CurrentUser()` or `@CurrentVendor()`.
- **Logging**: the middleware adds `userId`, `role` (and `vendorId`) to the request context, which `ContextLogger` merges into every log line.

## Core working

- **Login** (`POST /auth/login`):
  - Bcrypt-verifies the password. A wrong email and a wrong password give the same 401 "Invalid credentials".
  - Known trade-off: an unknown email is rejected before bcrypt runs, so it answers faster than a wrong password and response timing can reveal which emails exist. The login rate limit keeps this slow to exploit.
  - Inserts a `sessions` row (`expires_at` = now + `JWT_EXPIRES_IN_SECONDS`) and prunes the user's expired and revoked rows.
  - If the request already carried a session (switching accounts), that session is revoked, so the replaced cookie stops working.
  - Signs a JWT (`sub` = user id, `jti` = session id) and sets the `access_token` cookie: httpOnly, `sameSite=lax`, `secure` in production, max-age `JWT_EXPIRES_IN_SECONDS`.
- **Rate limits** (`common/rate-limit.ts`, registered in `main.ts` before any middleware): 300 requests/min per IP on the whole API, and 10 failed logins per 15 min per IP. Fixed windows, in memory; set `TRUST_PROXY` behind a reverse proxy.
- **UserContextMiddleware** runs on all routes except login and logout:
  - Reads the token from the cookie, or a `Bearer` header for non-browser clients.
  - Verifies the JWT, then loads the session joined to its user in one query: the session must match `sub`, be unrevoked and unexpired (DB clock). A token without `jti` (issued before sessions existed) is rejected.
  - Attaches `req.user`, or answers 401.
  - The excluded routes include the URI version (`version: API_DEFAULT_VERSION`). Without it, the exclusion never matches `/api/v1/...`.
- **AuthGuard** (`@Auth()`): 401 without a user, 403 for the wrong role.
- **Logout** (204) sets `revoked_at` on the token's session and clears the cookie. It is excluded from the middleware so a stale cookie can still be cleared, and is idempotent: no token, a bad token or an already revoked session is a no-op. It logs out only that device. Deactivating a vendor also blocks it through `VendorContextMiddleware`.

## Endpoints (`/api/v1`)

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/login` | `{ email, password }`, sets cookie |
| POST | `/auth/logout` | revokes the session, clears cookie |
| GET | `/auth/me` | current user, 401 if no session |

## Structure

```
auth/
  dto/login.dto.ts
  entities/session.entity.ts   one row per login (id = JWT jti)
  auth.controller.ts           login / logout / me
  auth.service.ts              credential check, session + JWT issue/verify/revoke
  sessions.repository.ts       session insert/prune, active-session lookup, revoke
  auth.guard.ts                role check
  auth.decorators.ts           @Auth, @CurrentUser, @CurrentVendor
  user-context.middleware.ts   session → req.user
  auth.docs.ts                 Swagger decorators
```
