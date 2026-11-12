import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { VENDOR_PAYMENT } from '../common/constants';
import { VendorPageDto } from './dto/list-vendors.dto';
import { VendorSummaryDto } from './dto/vendor-summary.dto';
import { VendorPaymentDetails } from './entities/vendor-payment-details.entity';
import { Vendor } from './entities/vendor.entity';

const QR_MAX_MB = VENDOR_PAYMENT.QR_MAX_BYTES / 1024 / 1024;

const qrFile = (): ReturnType<typeof applyDecorators> =>
  applyDecorators(
    ApiProduces('image/jpeg', 'image/png', 'image/webp'),
    ApiOkResponse({ description: 'The image bytes' }),
    ApiNotFoundResponse({ description: 'No payment QR' }),
  );

export const VendorsDocs = {
  controller: () => ApiTags('Vendors (admin)'),

  create: () =>
    applyDecorators(
      ApiOperation({
        summary:
          'Create a vendor and its portal login (idempotent on phone + login email)',
      }),
      ApiCreatedResponse({
        type: Vendor,
        description: 'Created, or the existing vendor on a repeat',
      }),
      ApiBadRequestResponse({ description: 'Validation failed' }),
      ApiConflictResponse({
        description:
          'Phone belongs to another vendor, or login email already used',
      }),
    ),

  findAll: () =>
    applyDecorators(
      ApiOperation({ summary: 'List vendors (paginated, filterable)' }),
      ApiOkResponse({ type: VendorPageDto }),
      ApiBadRequestResponse({ description: 'Invalid query' }),
    ),

  findOne: () =>
    applyDecorators(
      ApiOperation({ summary: 'Get a vendor' }),
      ApiOkResponse({ type: Vendor }),
      ApiNotFoundResponse({ description: 'Vendor not found' }),
    ),

  update: () =>
    applyDecorators(
      ApiOperation({ summary: 'Edit a vendor; isActive=false deactivates it' }),
      ApiOkResponse({ type: Vendor }),
      ApiBadRequestResponse({ description: 'Validation failed' }),
      ApiNotFoundResponse({ description: 'Vendor not found' }),
    ),

  paymentDetails: () =>
    applyDecorators(
      ApiOperation({
        summary:
          "A vendor's bank account and QR, as the vendor entered them (check updatedAt before paying)",
      }),
      ApiOkResponse({ type: VendorPaymentDetails }),
      ApiNotFoundResponse({ description: 'Vendor not found' }),
    ),

  paymentQr: () =>
    applyDecorators(
      ApiOperation({ summary: "Download a vendor's payment QR" }),
      qrFile(),
    ),
};

export const VendorPortalDocs = {
  controller: () => ApiTags('Vendor portal'),

  profile: () =>
    applyDecorators(
      ApiOperation({ summary: 'My vendor profile' }),
      ApiOkResponse({ type: Vendor }),
    ),

  updateProfile: () =>
    applyDecorators(
      ApiOperation({
        summary:
          'Edit my business name, phone, contact person or address (not emails or password)',
      }),
      ApiOkResponse({ type: Vendor }),
      ApiBadRequestResponse({ description: 'Validation failed' }),
      ApiConflictResponse({ description: 'Phone belongs to another vendor' }),
    ),

  summary: () =>
    applyDecorators(
      ApiOperation({
        summary:
          'Counts for my home: new requests, bids in progress, upcoming bookings',
      }),
      ApiOkResponse({ type: VendorSummaryDto }),
    ),

  paymentDetails: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Where Mero Event pays me: bank account and QR',
      }),
      ApiOkResponse({ type: VendorPaymentDetails }),
    ),

  updateBank: () =>
    applyDecorators(
      ApiOperation({ summary: 'Set or replace my bank account (idempotent)' }),
      ApiOkResponse({ type: VendorPaymentDetails }),
      ApiBadRequestResponse({ description: 'Validation failed' }),
    ),

  clearBank: () =>
    applyDecorators(
      ApiOperation({ summary: 'Remove my bank account (idempotent)' }),
      ApiOkResponse({ type: VendorPaymentDetails }),
    ),

  replaceQr: () =>
    applyDecorators(
      ApiOperation({
        summary: `Upload my payment QR (JPEG/PNG/WebP, up to ${QR_MAX_MB} MB); replaces the old one`,
      }),
      ApiConsumes('multipart/form-data'),
      ApiBody({
        schema: {
          type: 'object',
          required: ['qr'],
          properties: { qr: { type: 'string', format: 'binary' } },
        },
      }),
      ApiOkResponse({ type: VendorPaymentDetails }),
      ApiBadRequestResponse({ description: 'Missing or not an image' }),
      ApiPayloadTooLargeResponse({ description: 'File too large' }),
    ),

  removeQr: () =>
    applyDecorators(
      ApiOperation({ summary: 'Remove my payment QR (idempotent)' }),
      ApiOkResponse({ type: VendorPaymentDetails }),
    ),

  paymentQr: () =>
    applyDecorators(
      ApiOperation({ summary: 'Download my payment QR' }),
      qrFile(),
    ),
};
