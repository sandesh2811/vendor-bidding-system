# Auth

## TL;DR

Cookie-based sessions for both portals. Login sets an httpOnly JWT cookie. Middleware turns it into `req.user` on every request, and `@Auth(...roles)` guards routes by role.

## Overview

- **Users**: credentials and session users come from `UsersService`.
- **Vendors**: `VendorContextMiddleware` (vendors module) runs right after `UserContextMiddleware` and only lets **active** vendors through.
- **Every other module**: controllers use `@Auth(UserRole.Admin)` or `@Auth(UserRole.Vendor)`, plus `@CurrentUser()` or `@CurrentVendor()`.
- **Logging**: the middleware adds `userId`, `role` (and `vendorId`) to the request context, which `ContextLogger` merges into every log line.

## Core working

- **Login** (`POST /auth/login`):
  - Bcrypt-verifies the password. A wrong email and a wrong password give the same 401 "Invalid credentials".
  - Signs a JWT (`sub` = user id) and sets the `access_token` cookie: httpOnly, `sameSite=lax`, `secure` in production, max-age `JWT_EXPIRES_IN_SECONDS`.
- **UserContextMiddleware** runs on all routes except login and logout:
  - Reads the token from the cookie, or a `Bearer` header for non-browser clients.
  - Resolves the user and attaches `req.user`, or answers 401.
  - The excluded routes include the URI version (`version: API_DEFAULT_VERSION`). Without it, the exclusion never matches `/api/v1/...`.
- **AuthGuard** (`@Auth()`): 401 without a user, 403 for the wrong role.
- **Logout** clears the cookie (204). The JWT is stateless, so there is no server-side revocation. Deactivating a vendor blocks it through `VendorContextMiddleware` instead.

## Endpoints (`/api/v1`)

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/auth/login` | `{ email, password }`, sets cookie |
| POST | `/auth/logout` | clears cookie |
| GET | `/auth/me` | current user, 401 if no session |

## Structure

```
auth/
  dto/login.dto.ts
  auth.controller.ts           login / logout / me
  auth.service.ts              credential check, JWT sign/verify
  auth.guard.ts                role check
  auth.decorators.ts           @Auth, @CurrentUser, @CurrentVendor
  user-context.middleware.ts   session → req.user
  auth.docs.ts                 Swagger decorators
```
