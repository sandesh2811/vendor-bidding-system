# Vendors

## TL;DR

Admins add and manage the partner vendors who receive work requests. Creating a vendor also creates its portal login. Deactivating a vendor locks that login out immediately. Vendors maintain their own payment details (bank account and/or QR), which admins read when paying a booking.

## Overview

- **Users**: each vendor has exactly one portal login (`users.vendor_id`, unique). Both are created together.
- **Auth**: `VendorContextMiddleware` runs after `UserContextMiddleware`. A vendor user passes only if its vendor is active, and the vendor is attached as `user.vendor`, which `@CurrentVendor()` reads.
- **Quotations**: vendors are the recipients of quotations (`quotation_recipients.vendor_id`, `ON DELETE RESTRICT`). Only active vendors can be sent new requests.
- **Bookings**: the admin booking page reads the booked vendor's payment details from `/vendors/:id/payment-details`.
- **Storage**: QR images go through the shared `FileStorage` (`common/storage/`), keys `vendors/<vendorId>/payment-qr/<sha256>.<ext>`.

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
- **Payment details** (`vendor_payment_details`, one row per vendor, `vendor_id` PK):
  - Vendor-owned: portal routes always use the session's vendor. Admins can only read.
  - Bank name, account name and number are all-or-nothing (`CHK_vendor_payment_details_bank_complete`); `branch` is optional. Setting the bank is one upsert on `vendor_id`.
  - QR: JPEG/PNG/WebP by magic number, up to 2 MB. The file is written first, then the row is switched under a row lock and the old file deleted. Re-uploading the same image writes nothing. The storage key and type are never serialized; `hasQr` is.
  - Both halves are independent: clearing one leaves the other. A vendor with none gets all-null fields, not 404.
  - Fraud safeguard: every change is logged (never the account number) and bumps `updatedAt`, which the admin booking page shows next to the details.

## Endpoints (`/api/v1`, admin only)

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/vendors` | vendor details + `login { name, email, password }` |
| GET | `/vendors` | `page`, `limit`, `search`, `category`, `isActive` |
| GET | `/vendors/:id` | |
| PATCH | `/vendors/:id` | partial; `isActive` toggles access |
| GET | `/vendors/:id/payment-details` | read only; 404 if the vendor doesn't exist |
| GET | `/vendors/:id/payment-details/qr` | the QR image |

## Vendor portal endpoints (vendor only)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/vendor/profile` | the session's own vendor; admin `notes` stripped |
| PATCH | `/vendor/profile` | the vendor edits its own `name`, `phone`, `contactName`, `address`; any other field is refused (400) |
| GET | `/vendor/summary` | `{ newRequests, bidsInProgress, upcomingBookings }` for the portal home |
| GET | `/vendor/payment-details` | own bank fields, `hasQr`, `updatedAt` |
| PUT / DELETE | `/vendor/payment-details/bank` | `{ bankName, accountName, accountNumber, branch? }` / clear; both idempotent |
| PUT / DELETE | `/vendor/payment-details/qr` | multipart `qr` / remove; both idempotent |
| GET | `/vendor/payment-details/qr` | own QR image |

## Structure

```
vendors/
  controllers/                 vendors (admin), vendor-portal (profile, summary, payment details)
  services/                    vendors (rules, idempotency), payment-details (bank + QR files)
  dto/                         create / update / list / bank-account DTOs
  entities/                    vendor, vendor-payment-details
  vendor-context.middleware.ts vendor-portal gate (active vendor only)
  vendors.repository.ts        vendor SQL and transactions
  payment-details.repository.ts upserts and QR swap under a row lock
  vendors.docs.ts              Swagger decorators
```

## Notes

- Categories (`VendorCategory`) live in `common/constants.ts`. The frontend mirrors them.
- Vendors are never hard-deleted: quotations and later bids/bookings reference them.
