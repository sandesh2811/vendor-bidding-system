# Vendors

## TL;DR

Admins add and manage the partner vendors who receive work requests. Creating a vendor also creates its portal login. Deactivating a vendor locks that login out immediately.

## Overview

- **Users**: each vendor has exactly one portal login (`users.vendor_id`, unique). Both are created together.
- **Auth**: `VendorContextMiddleware` runs after `UserContextMiddleware`. A vendor user passes only if its vendor is active, and the vendor is attached as `user.vendor`, which `@CurrentVendor()` reads.
- **Quotations**: vendors are the recipients of quotations (`quotation_recipients.vendor_id`, `ON DELETE RESTRICT`). Only active vendors can be sent new requests.

## Core working

- **Create is idempotent on phone** (unique):
  - The vendor and its login are inserted in **one transaction** with `ON CONFLICT DO NOTHING`.
  - Repeating the same request (same phone and login email) returns the existing vendor.
  - A phone that belongs to a different vendor gives 409. A login email already in use gives 409 via `DatabaseException`.
- **Update** is a single `UPDATE … RETURNING`, with no read-then-write window. Zero rows matched gives 404.
  - Fields not sent are dropped, so they don't overwrite stored values.
  - `isActive: false` deactivates the vendor. Its next request gets 403 "Vendor account is inactive".
- **List** is paginated and newest first. Optional `search` (name or contact person, with `ILIKE` escaped), `category` and `isActive`.
- **Serialization**: `notes` is internal and only serialized on admin routes (`@SerializeOptions({ groups: [admin] })`).

## Endpoints (`/api/v1`, admin only)

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/vendors` | vendor details + `login { name, email, password }` |
| GET | `/vendors` | `page`, `limit`, `search`, `category`, `isActive` |
| GET | `/vendors/:id` | |
| PATCH | `/vendors/:id` | partial; `isActive` toggles access |

## Vendor portal endpoints (vendor only)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/vendor/profile` | the session's own vendor; admin `notes` stripped |
| PATCH | `/vendor/profile` | the vendor edits its own `name`, `phone`, `contactName`, `address`; any other field is refused (400) |
| GET | `/vendor/summary` | `{ newRequests, bidsInProgress, upcomingBookings }` for the portal home |

## Structure

```
vendors/
  dto/                         create / update / list DTOs
  entities/vendor.entity.ts
  vendor-context.middleware.ts vendor-portal gate (active vendor only)
  vendors.repository.ts        SQL and transactions
  vendors.service.ts           rules, idempotency, logging
  vendors.controller.ts        admin routes
  vendors.docs.ts              Swagger decorators
```

## Notes

- Categories (`VendorCategory`) live in `common/constants.ts`. The frontend mirrors them.
- Vendors are never hard-deleted: quotations and later bids/bookings reference them.
