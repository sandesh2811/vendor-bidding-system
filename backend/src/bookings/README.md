# Bookings

## TL;DR

A booking is the winning bid of a quotation: what Mero Event owes the vendor, what has been paid, and what's pending. Admins adjust the amount, complete or cancel it, and record or delete payments. Vendors see their own bookings read-only. No explicit row locks: overpaying is made impossible by a DB CHECK on a stored paid total.

## Overview

- **Created by bids**: `POST /bids/:id/select` inserts a `confirmed` booking with `amount = bid total`, `paid_amount = 0`. There is no "create booking" endpoint.
- **Auth**: admin routes use `@Auth(UserRole.Admin)` with the `admin` serialization group; vendor routes use `@Auth(UserRole.Vendor)` and `@CurrentVendor()`.

## Core working

- **Money**: `numeric(12,2)` NPR strings, math in BigInt cents (`common/money.ts`).
  - `paid_amount` is stored and is always `SUM(payments.amount)`: only the payment add and delete transactions write it, each together with the payment row.
  - `pendingAmount = amount − paidAmount` and `paymentStatus` (`paid` when pending is 0, else `unpaid` when paid is 0, else `partial`) are computed in `@AfterLoad`, never stored.
- **No overpaying, no locks**: `CHK_bookings_paid_within_amount CHECK (paid_amount >= 0 AND paid_amount <= amount)`.
  - A payment is `UPDATE bookings SET paid_amount = paid_amount + x WHERE id = … AND status <> 'cancelled'`, then the insert, in one transaction.
  - Two concurrent payments queue on the row the `UPDATE` touches; the second re-checks against the committed total and fails the CHECK (400).
  - The same CHECK rejects lowering `amount` below what's paid, including against a payment saved at the same moment.
- **Status**: `confirmed → completed | cancelled`, both final.
  - `PATCH` is one conditional `UPDATE`: `status IN ('confirmed', <target>)` for a status change (repeating it is a no-op), `status <> 'cancelled'` otherwise. 0 rows → one read to tell 404 from 409.
  - A cancelled booking can't change or take payments; its payments stay on record. A completed one still takes amount/notes changes and payments.
  - An amount change requires `notes` (the reason), which replaces the booking's notes.
- **Payments** are append-only. A wrong one is deleted: the delete and the decrement run in one transaction, and only the delete that removed the row decrements, so deleting twice is a no-op (204). Payment POSTs are not retry-safe yet (see the `shortcut:` on the route).
- **Isolation**: vendor reads filter by `(id, vendor_id)` from the session; another vendor's booking is 404. `Booking.notes`, `Payment.note` and `Payment.recordedById` are admin-only (`@Expose({ groups: ['admin'] })`).

## Endpoints (`/api/v1`)

| Method | Path | Who | Notes |
| --- | --- | --- | --- |
| GET | `/bookings` | admin | `?status=&paymentStatus=&vendorId=&page=&limit=` |
| GET | `/bookings/:id` | admin | With quotation, vendor and payments |
| PATCH | `/bookings/:id` | admin | `{ amount?, status?, notes? }`; amount needs notes |
| POST | `/bookings/:id/payments` | admin | `{ amount, paidAt, method, reference?, note? }` → 201 |
| DELETE | `/bookings/:id/payments/:paymentId` | admin | 204, idempotent |
| GET | `/vendor/bookings` | vendor | Own bookings only |
| GET | `/vendor/bookings/:id` | vendor | With quotation items, bid lines and payments; 404 if not its own |

## Files

- `entities/booking.entity.ts`, `entities/payment.entity.ts`
- `bookings.repository.ts`: the only TypeORM user
- `bookings.service.ts`: rules, 404/409 mapping, logging
- `controllers/bookings.controller.ts` (admin), `controllers/vendor-bookings.controller.ts`
- `bookings.docs.ts`: Swagger
