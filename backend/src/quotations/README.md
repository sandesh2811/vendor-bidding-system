# Quotations

## TL;DR

Mero Event admins create event work requests (event details, line items, reference photos) and send them to one or more vendors. Each vendor sees only the requests sent to it. Creates are idempotent, edits are serialized per quotation, and photos are deduplicated by content.

## Overview

- **Users**: `quotations.created_by_id` references the admin who created it. The id is visible only on admin routes.
- **Vendors**: `quotation_recipients` links a quotation to vendors. Only **active** vendors can be added.
- **Auth**: admin routes use `@Auth(UserRole.Admin)`. Vendor routes use `@Auth(UserRole.Vendor)` plus `@CurrentVendor()`, which `VendorContextMiddleware` sets.
- **Storage**: photo bytes go through the `PhotoStorage` interface, injected with the `PHOTO_STORAGE` token. Today the token is bound to `LocalPhotoStorage` (`UPLOAD_DIR`).
- **Bids**: the `bids` module prices a quotation per recipient. Bookings are created when a bid is selected (see `bids/README.md`).

## Core working

- **Status** (`draft`, `open`, `closed`, `awarded`, `cancelled`), returned on every admin and vendor response:
  - Created with `vendorIds` it starts `open`, otherwise `draft`. The first `POST /recipients` opens a draft.
  - An `open` quotation whose `responseDeadline` is before today (Nepal time) is reported and treated as `closed`. `Quotation`'s `@AfterLoad` applies this, so no cron job is needed. Extending the deadline reopens it, but an admin close stays closed.
  - `POST /close` and `POST /cancel` are conditional `UPDATE`s (`WHERE status = 'open'` and `WHERE status NOT IN ('awarded', 'cancelled')`). 0 rows means 404 or 409. Cancel also rejects submitted bids in the same transaction.
  - Sending is also a conditional `UPDATE`: it matches a draft, or an open quotation before its deadline, and sets `open`.
  - A selected bid sets `awarded` (bids module).
- **Edit locks**:
  - `PATCH` gives 409 on `awarded` or `cancelled`. The status sits in the `UPDATE`'s `WHERE`.
  - `PATCH` gives 409 on `items` once any bid exists. Details and the deadline stay editable.
  - Sending more recipients gives 409 unless the quotation is `draft` or `open` before its deadline.
  - The RESTRICT FK from `bid_items` to `quotation_items` makes deleting a priced item fail even if the bid check races a first bid.

## Endpoints (`/api/v1`)

| Method | Path                                     | Who    | Notes                                                   |
| ------ | ---------------------------------------- | ------ | ------------------------------------------------------- |
| POST   | `/quotations`                            | admin  | `vendorIds` optional (draft)                            |
| GET    | `/quotations`                            | admin  | `page`, `limit`, `search` (title/location), `eventType` |
| GET    | `/quotations/:id`                        | admin  | items, photos, recipients                               |
| PATCH  | `/quotations/:id`                        | admin  | partial fields; `items` = full list                     |
| POST   | `/quotations/:id/recipients`             | admin  | `{ vendorIds }`, idempotent; opens a draft              |
| POST   | `/quotations/:id/close`                  | admin  | `open` → `closed`                                       |
| POST   | `/quotations/:id/cancel`                 | admin  | rejects submitted bids                                  |
| POST   | `/quotations/:id/photos`                 | admin  | multipart field `photos` (1–10 files)                   |
| DELETE | `/quotations/:id/photos/:photoId`        | admin  | 204                                                     |
| GET    | `/quotations/:id/photos/:photoId`        | admin  | image bytes                                             |
| GET    | `/vendor/quotations`                     | vendor | received requests with `receivedAt`, `bidStatus`        |
| GET    | `/vendor/quotations/:id`                 | vendor | 404 unless sent to this vendor                          |
| GET    | `/vendor/quotations/:id/photos/:photoId` | vendor | 404 unless sent to this vendor                          |

Suggested client flow: create without `vendorIds`, upload photos, then `POST /recipients`. Vendors never see a request before its photos are attached.

## Structure

```
quotations/
  controllers/   admin + vendor-portal controllers, photo-response helper
  dto/           request validation and response shapes
  entities/      quotation, quotation-item, quotation-photo, quotation-recipient
  storage/       PhotoStorage interface + PHOTO_STORAGE token, LocalPhotoStorage
  quotations.repository.ts   all SQL, transactions and locks
  quotations.service.ts      rules, idempotent create, error mapping, logging
  quotations.docs.ts         Swagger decorators
```

## Extending

- **Object storage**: write a class that `implements PhotoStorage` (`keyFor`, atomic `save`, `remove`, `open`), then bind it to `PHOTO_STORAGE` in `quotations.module.ts`. `storage_key` already stores an opaque key.
- **Limits** live in `common/constants.ts` (`QUOTATION`, `QUOTATION_PHOTO`). Rule messages live in `CHECK_CONSTRAINTS`.
