import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Booking } from '../bookings/entities/booking.entity';
import { Bid } from './entities/bid.entity';

export const BidsDocs = {
  controller: () => ApiTags('Bids (admin)'),

  findForQuotation: () =>
    applyDecorators(
      ApiOperation({
        summary:
          'Every bid on a quotation with its vendor and lines, for comparison',
      }),
      ApiOkResponse({ type: [Bid] }),
      ApiNotFoundResponse({ description: 'Quotation not found' }),
    ),

  select: () =>
    applyDecorators(
      ApiOperation({
        summary:
          'Select the winning bid: rejects the others, awards the quotation and creates the booking',
      }),
      ApiOkResponse({ type: Booking }),
      ApiConflictResponse({
        description: 'Quotation is already awarded or cancelled',
      }),
      ApiNotFoundResponse({ description: 'Bid not found' }),
    ),
};

export const VendorBidsDocs = {
  controller: () => ApiTags('Bids (vendor portal)'),

  submit: () =>
    applyDecorators(
      ApiOperation({
        summary:
          'Submit my bid, or replace it (one per quotation; totals computed by the server)',
      }),
      ApiOkResponse({ type: Bid }),
      ApiBadRequestResponse({
        description:
          'Validation failed, an item is missing or repeated, or an amount is too large',
      }),
      ApiConflictResponse({
        description: 'Bidding is closed (closed, awarded or cancelled)',
      }),
      ApiNotFoundResponse({ description: 'Not found or not sent to me' }),
    ),

  findOwn: () =>
    applyDecorators(
      ApiOperation({ summary: 'My bid on a quotation' }),
      ApiOkResponse({ type: Bid }),
      ApiNotFoundResponse({ description: 'No bid yet, or not sent to me' }),
    ),
};
