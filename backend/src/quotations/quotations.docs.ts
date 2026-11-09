import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { QUOTATION_PHOTO } from '../common/constants';
import {
  QuotationPageDto,
  ReceivedQuotationDto,
  ReceivedQuotationPageDto,
} from './dto/list-quotations.dto';
import { QuotationPhoto } from './entities/quotation-photo.entity';
import { Quotation } from './entities/quotation.entity';

const MAX_MB = QUOTATION_PHOTO.MAX_BYTES / 1024 / 1024;

const photoFile = (): ReturnType<typeof applyDecorators> =>
  applyDecorators(
    ApiProduces('image/jpeg', 'image/png', 'image/webp'),
    ApiOkResponse({ description: 'The image bytes' }),
    ApiNotFoundResponse({ description: 'Photo not found' }),
  );

export const QuotationsDocs = {
  controller: () => ApiTags('Quotations (admin)'),

  create: () =>
    applyDecorators(
      ApiOperation({
        summary:
          'Create a quotation with items, optionally sending it to vendors (idempotent on title + eventDate + location)',
      }),
      ApiCreatedResponse({
        type: Quotation,
        description: 'Created, or the existing quotation for the same event',
      }),
      ApiBadRequestResponse({
        description: 'Validation failed, or unknown/inactive vendor',
      }),
    ),

  findAll: () =>
    applyDecorators(
      ApiOperation({ summary: 'List quotations, newest first' }),
      ApiOkResponse({ type: QuotationPageDto }),
      ApiBadRequestResponse({ description: 'Invalid query' }),
    ),

  findOne: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Get a quotation with items, photos and recipients',
      }),
      ApiOkResponse({ type: Quotation }),
      ApiNotFoundResponse({ description: 'Quotation not found' }),
    ),

  update: () =>
    applyDecorators(
      ApiOperation({
        summary:
          'Edit details; `items` replaces the list (ids kept are updated, new ones added, missing removed)',
      }),
      ApiOkResponse({ type: Quotation }),
      ApiBadRequestResponse({
        description: 'Validation failed or foreign item id',
      }),
      ApiConflictResponse({
        description:
          'Another quotation has this title, event date and location; the quotation is awarded or cancelled; or items changed after a bid',
      }),
      ApiNotFoundResponse({ description: 'Quotation not found' }),
    ),

  addRecipients: () =>
    applyDecorators(
      ApiOperation({
        summary:
          'Send the quotation to more vendors (idempotent; existing recipients skipped)',
      }),
      ApiOkResponse({ type: Quotation }),
      ApiBadRequestResponse({ description: 'Unknown or inactive vendor' }),
      ApiConflictResponse({
        description: 'Quotation is closed, awarded or cancelled',
      }),
      ApiNotFoundResponse({ description: 'Quotation not found' }),
    ),

  close: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Close an open quotation early (no more bids or edits)',
      }),
      ApiOkResponse({ type: Quotation }),
      ApiConflictResponse({ description: 'Quotation is not open' }),
      ApiNotFoundResponse({ description: 'Quotation not found' }),
    ),

  cancel: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Cancel a quotation and reject every submitted bid',
      }),
      ApiOkResponse({ type: Quotation }),
      ApiConflictResponse({
        description: 'Quotation is already awarded or cancelled',
      }),
      ApiNotFoundResponse({ description: 'Quotation not found' }),
    ),

  uploadPhotos: () =>
    applyDecorators(
      ApiOperation({
        summary: `Upload reference photos (JPEG/PNG/WebP, up to ${MAX_MB} MB each and ${QUOTATION_PHOTO.MAX_PER_QUOTATION} per quotation; re-uploads are deduplicated)`,
      }),
      ApiConsumes('multipart/form-data'),
      ApiBody({
        schema: {
          type: 'object',
          required: ['photos'],
          properties: {
            photos: {
              type: 'array',
              items: { type: 'string', format: 'binary' },
            },
          },
        },
      }),
      ApiCreatedResponse({ type: [QuotationPhoto] }),
      ApiBadRequestResponse({
        description: 'Not an image, or photo limit exceeded',
      }),
      ApiPayloadTooLargeResponse({ description: 'File too large' }),
      ApiNotFoundResponse({ description: 'Quotation not found' }),
    ),

  removePhoto: () =>
    applyDecorators(
      ApiOperation({ summary: 'Delete a photo' }),
      ApiNoContentResponse(),
      ApiNotFoundResponse({ description: 'Photo not found' }),
    ),

  photoFile: () =>
    applyDecorators(ApiOperation({ summary: 'Download a photo' }), photoFile()),
};

export const VendorQuotationsDocs = {
  controller: () => ApiTags('Quotations (vendor portal)'),

  findAll: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Quotations sent to me, most recently received first',
      }),
      ApiOkResponse({ type: ReceivedQuotationPageDto }),
    ),

  findOne: () =>
    applyDecorators(
      ApiOperation({
        summary: 'A quotation sent to me, with items and photos',
      }),
      ApiOkResponse({ type: ReceivedQuotationDto }),
      ApiNotFoundResponse({ description: 'Not found or not sent to me' }),
    ),

  photoFile: () =>
    applyDecorators(
      ApiOperation({ summary: 'Download a photo of a quotation sent to me' }),
      photoFile(),
    ),
};
