import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { BookingPageDto } from './dto/list-bookings.dto';
import { Booking } from './entities/booking.entity';
import { Payment } from './entities/payment.entity';

export const BookingsDocs = {
  controller: () => ApiTags('Bookings (admin)'),

  findAll: () =>
    applyDecorators(
      ApiOperation({
        summary:
          'List bookings, newest first, with paid, pending and payment status',
      }),
      ApiOkResponse({ type: BookingPageDto }),
      ApiBadRequestResponse({ description: 'Invalid query' }),
    ),

  findOne: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Get a booking with its quotation, vendor and payments',
      }),
      ApiOkResponse({ type: Booking }),
      ApiNotFoundResponse({ description: 'Booking not found' }),
    ),

  update: () =>
    applyDecorators(
      ApiOperation({
        summary:
          'Adjust the amount (notes = reason), complete or cancel, or edit notes (idempotent)',
      }),
      ApiOkResponse({ type: Booking }),
      ApiBadRequestResponse({
        description:
          'Validation failed, reason missing, or amount below what is already paid',
      }),
      ApiConflictResponse({
        description:
          'Booking is cancelled, or completed and asked to change status',
      }),
      ApiNotFoundResponse({ description: 'Booking not found' }),
    ),

  addPayment: () =>
    applyDecorators(
      ApiOperation({
        summary: 'Record a payment to the vendor (never more than pending)',
      }),
      ApiCreatedResponse({ type: Payment }),
      ApiBadRequestResponse({
        description: 'Validation failed, or amount is more than pending',
      }),
      ApiConflictResponse({ description: 'Booking is cancelled' }),
      ApiNotFoundResponse({ description: 'Booking not found' }),
    ),

  deletePayment: () =>
    applyDecorators(
      ApiOperation({
        summary:
          'Delete a wrong payment and take it off the paid total (idempotent)',
      }),
      ApiNoContentResponse({ description: 'Deleted, or already gone' }),
      ApiNotFoundResponse({ description: 'Booking not found' }),
    ),
};

export const VendorBookingsDocs = {
  controller: () => ApiTags('Bookings (vendor)'),

  findAll: () =>
    applyDecorators(
      ApiOperation({ summary: 'My bookings, newest first' }),
      ApiOkResponse({ type: BookingPageDto }),
      ApiBadRequestResponse({ description: 'Invalid query' }),
    ),

  findOne: () =>
    applyDecorators(
      ApiOperation({
        summary:
          'One of my bookings with the event, the agreed bid lines and the payments',
      }),
      ApiOkResponse({ type: Booking }),
      ApiNotFoundResponse({ description: 'Booking not found' }),
    ),
};
