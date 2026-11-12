# Bids

## TL;DR

A vendor puts one price on every item of a quotation it was sent. Mero Event admins compare the bids and select one. Selecting rejects the rest, awards the quotation and creates the booking, all in one transaction. Every write is an idempotent upsert or a conditional update; nothing takes an explicit row lock.

## Overview

- **Quotations**: a bid belongs to a quotation and a vendor that is a recipient of it. Bids are accepted only while the quotation's effective status is `open` (see `quotations/README.md`), and never from a vendor that declined it (409 until Mero Event sends it again).
- **Bookings**: `bookings/entities/booking.entity.ts` holds the winning bid (see `bookings/README.md`). Bookings are created only by `POST /bids/:id/select`.
- **Auth**: vendor routes use `@Auth(UserRole.Vendor)` and `@CurrentVendor()`. Admin routes use `@Auth(UserRole.Admin)`.

## Core working

- **One bid per vendor per quotation**: `UQ_bids_quotation_vendor`.
  - `PUT` upserts the bid on `(quotation_id, vendor_id)` and its lines on `(bid_id, quotation_item_id)`, in one transaction. A repeated `PUT` leaves the same single bid.
  - The bid upsert only overwrites while `status = 'submitted'` (`ON CONFLICT … DO UPDATE … WHERE`). A selected or rejected bid is never changed (409).
  - Two submissions from one vendor serialize on the upserted row itself, so lines are never mixed.
- **Every item priced exactly once**: the service reads the quotation's items once (scoped to the vendor's recipient row). It rejects missing or foreign items (400) before writing; duplicates are rejected by the DTO. Items can't change once a bid exists, so upserting every line replaces the whole bid.
- **Money**: `numeric(12,2)` NPR, returned as strings.
  - `line_total = quantity × unit_price` and `total_amount = SUM(line_total)` are computed in the service in integer cents (BigInt), never from client totals.
  - `unit_price >= 0` is a DB CHECK. `0` means "not offered".
  - An overflow (PG `22003`) is a 400.
- **No explicit locks**:
  - The open-status check before a submit is a plain read. A submit racing a close by milliseconds can still land.
  - Decided bids are protected by the conditional upsert, and priced items by the RESTRICT FK from `bid_items`.
- **Select**, in one transaction of conditional updates:
  1. The quotation becomes `awarded` only `WHERE status IN ('open', 'closed')`.
  2. The bid becomes `selected` only if its status and total are unchanged since it was read. If a resubmission landed in between, this is a 409, so the booked amount is always the one the admin saw.
  3. Every other bid becomes `rejected`.
  4. A `confirmed` booking is inserted with `amount = total_amount`.

  The Postgres row lock that the first `UPDATE` takes makes a concurrent select wait. That select then matches 0 rows: it returns the existing booking if it selected the same bid (idempotent), and 409 otherwise. `UQ_bookings_quotation` and `UQ_bookings_bid` are the backstop. There is no undo.

- **Isolation**:
  - Vendor reads are scoped by `(quotation_id, vendor_id)` from the session.
  - Vendors never see other bids or counts.
  - "No bid" and "not sent to you" are both 404.

## Endpoints (`/api/v1`)

| Method | Path                         | Who    | Notes                                                              |
| ------ | ---------------------------- | ------ | ------------------------------------------------------------------ |
| PUT    | `/vendor/quotations/:id/bid` | vendor | `{ items: [{ quotationItemId, unitPrice }], notes?, validUntil? }` |
| GET    | `/vendor/quotations/:id/bid` | vendor | own bid, 404 if none                                               |
| GET    | `/quotations/:id/bids`       | admin  | every bid with vendor and lines                                    |
| POST   | `/bids/:id/select`           | admin  | returns the booking                                                |

## Structure

```
bids/
  controllers/   admin (comparison, select) + vendor-portal (submit, own bid)
  dto/           submit-bid
  entities/      bid, bid-item
  bids.repository.ts   all queries and transactions (upserts, conditional updates)
  bids.service.ts      error mapping, logging
  bids.docs.ts         Swagger decorators
```

## Extending

- **Bid history**: a resubmission overwrites the bid in place. Keeping revisions would need an append-only `bid_revisions` table, with the bid pointing at its latest revision.
- **Award per item**: `select` books one bid for the whole quotation. Splitting items across vendors would mean one booking per selected bid line group.
