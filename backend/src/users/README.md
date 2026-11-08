# Users

## TL;DR

Login accounts for both portals: Mero Event admins and vendor users (one per vendor). This module has no HTTP routes. Other modules use it to hash passwords and look up users.

## Overview

- **Auth**: verifies credentials (`findByEmailWithHash`, `verifyPassword`) and loads the session user (`findSessionUser`).
- **Vendors**: vendor creation inserts the vendor's login in the same transaction. `findByVendorId` resolves a vendor's login.
- **Quotations**: `quotations.created_by_id` references the admin user who created it.
- **Seeds**: `createAdmin` is used by `database/seeds/admin.seed.ts`.

## Core working

- **Roles**: `admin` (no vendor) or `vendor` (`vendor_id` set, unique, so one login per vendor).
- **Passwords**: bcrypt with `BCRYPT_COST`.
  - `passwordHash` is `select: false` and `@Exclude()`d, so it never reaches a response.
  - It is loaded only by `findByEmailWithHash` for login.
- **Emails** are unique and normalized (trimmed, lowercase) before storage and lookup.
- **`createAdmin` is idempotent on email** (`ON CONFLICT DO NOTHING`, then a read). It gives 409 if the email belongs to a non-admin.
- **Verify** compares in constant time via bcrypt. A missing user still returns `false`, never an error.

## Structure

```
users/
  entities/user.entity.ts
  users.repository.ts   queries
  users.service.ts      hashing, lookups, admin bootstrap
  users.module.ts       exports UsersService only
```

## Notes

- Deleting users is not supported. Vendors and quotations reference users with `ON DELETE RESTRICT`.
