# Quotations

## TL;DR

Mero Event admins create event work requests (event details, line items, reference photos) and send them to one or more vendors. Each vendor sees only the requests sent to it. Creates are idempotent, edits are serialized per quotation, and photos are deduplicated by content.

## Overview

- **Users**: `quotations.created_by_id` references the admin who created it. The id is visible only on admin routes.
- **Vendors**: `quotation_recipients` links a quotation to vendors. Only **active** vendors can be added.
- **Auth**: admin routes use `@Auth(UserRole.Admin)`. Vendor routes use `@Auth(UserRole.Vendor)` plus `@CurrentVendor()`, which `VendorContextMiddleware` sets.
- **Storage**: photo bytes go through the `PhotoStorage` port. Today it is bound to `LocalPhotoStorage` (`UPLOAD_DIR`).
- **Next modules**: bids will hang off `quotation_recipients` (one vendor, one quotation), and bookings off the chosen bid.

## Core working

- **Idempotent create** on the event's natural key, unique `(title, event_date, location)`:
  - `INSERT … ON CONFLICT DO NOTHING`; on a conflict the existing quotation is returned, nothing is written.
  - A double submit, a network retry or two admins creating the same event all end with one quotation.
  - Concurrent creates of one event: the unique index makes the second wait, then return the first.
  - An edit that renames into another quotation's key gives 409.
  - The quotation, its items and its recipients are written in **one transaction**.
- **Recipients**: a single `INSERT … SELECT` from active vendors, with `ON CONFLICT DO NOTHING`.
  - Re-sending to a vendor is a no-op.
  - If any requested vendor is unknown or inactive, the transaction rolls back (400) and nobody is added.
- **Edits**: `PATCH` takes `SELECT … FOR UPDATE` on the quotation row, so concurrent edits run one after another.
  - `items` is the full desired list: items with an `id` are updated, new ones inserted, unlisted ones deleted.
  - Item ids keep their identity across edits, so bids can reference them later.
- **Rules in the DB** (CHECK constraints, mapped to 400 in `DatabaseException`):
  - `response_deadline <= event_date`
  - `guest_count > 0`
  - `quantity > 0`
  - These hold for partial edits and concurrent writers, with no read-then-check.
- **Dates**: `eventDate` and `responseDeadline` are `date` columns (`YYYY-MM-DD`), not in the past by Nepal time.
- **Photos**: JPEG, PNG or WebP, up to 5 MB each, up to 10 per quotation.
  - The type comes from the file's magic number, never the client's mimetype.
  - Files are content-addressed (`sha256`), with unique `(quotation_id, sha256)`. Re-uploading the same image is a no-op.
  - The count limit is checked under the same row lock, so parallel uploads can't exceed it.
  - Files are written inside the transaction and removed again if it fails.
- **Isolation**: every vendor read starts from `quotation_recipients WHERE vendor_id = <session vendor>`. A quotation not sent to you is a 404, not a 403, so ids don't leak. Vendor responses never include other recipients.
- **Ordering**: admin lists sort by `created_at DESC, id DESC`. Vendor lists sort by `sent_at DESC, id DESC`, which is when the request reached that vendor. Both have matching indexes.

## Endpoints (`/api/v1`)

| Method | Path                                     | Who    | Notes                                                   |
| ------ | ---------------------------------------- | ------ | ------------------------------------------------------- |
| POST   | `/quotations`                            | admin  | `vendorIds` optional (draft)                            |
| GET    | `/quotations`                            | admin  | `page`, `limit`, `search` (title/location), `eventType` |
| GET    | `/quotations/:id`                        | admin  | items, photos, recipients                               |
| PATCH  | `/quotations/:id`                        | admin  | partial fields; `items` = full list                     |
| POST   | `/quotations/:id/recipients`             | admin  | `{ vendorIds }`, idempotent                             |
| POST   | `/quotations/:id/photos`                 | admin  | multipart field `photos` (1–10 files)                   |
| DELETE | `/quotations/:id/photos/:photoId`        | admin  | 204                                                     |
| GET    | `/quotations/:id/photos/:photoId`        | admin  | image bytes                                             |
| GET    | `/vendor/quotations`                     | vendor | received requests with `receivedAt`                     |
| GET    | `/vendor/quotations/:id`                 | vendor | 404 unless sent to this vendor                          |
| GET    | `/vendor/quotations/:id/photos/:photoId` | vendor | 404 unless sent to this vendor                          |

Suggested client flow: create without `vendorIds`, upload photos, then `POST /recipients`. Vendors never see a request before its photos are attached.

## Structure

```
quotations/
  controllers/   admin + vendor-portal controllers, photo-response helper
  dto/           request validation and response shapes
  entities/      quotation, quotation-item, quotation-photo, quotation-recipient
  storage/       PhotoStorage port + LocalPhotoStorage
  quotations.repository.ts   all SQL, transactions and locks
  quotations.service.ts      rules, idempotent create, error mapping, logging
  quotations.docs.ts         Swagger decorators
```

## Extending

- **Object storage**: implement `PhotoStorage` (`keyFor`, atomic `save`, `remove`, `open`), then change `useClass` in `quotations.module.ts`. `storage_key` already stores an opaque key.
- **Limits** live in `common/constants.ts` (`QUOTATION`, `QUOTATION_PHOTO`). Rule messages live in `CHECK_CONSTRAINTS`.
