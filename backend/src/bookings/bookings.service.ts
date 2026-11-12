import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus } from '../common/constants';
import type { PaginationQueryDto } from '../common/dto/pagination.dto';
import { formatCents, toCents } from '../common/money';
import {
  type Paginated,
  toPaginated,
  toSkipTake,
} from '../common/pagination.helper';
import { type BookingChanges, BookingsRepository } from './bookings.repository';
import type { CreatePaymentDto } from './dto/create-payment.dto';
import type { ListBookingsQueryDto } from './dto/list-bookings.dto';
import type { UpdateBookingDto } from './dto/update-booking.dto';
import type { Booking } from './entities/booking.entity';
import type { Payment } from './entities/payment.entity';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(private readonly bookings: BookingsRepository) {}

  /**
   * Lists bookings, newest first, with their quotation and vendor and the paid/pending amounts.
   *
   * @param {ListBookingsQueryDto} query - page, limit, and optional status, paymentStatus and vendorId
   * @returns {Promise<Paginated<Booking>>} One page plus pagination meta
   *
   * @example
   * ```ts
   * const { items } = await bookingsService.findAll({ page: 1, limit: 20, paymentStatus: PaymentStatus.Partial });
   * ```
   */
  async findAll({
    status,
    paymentStatus,
    vendorId,
    ...page
  }: ListBookingsQueryDto): Promise<Paginated<Booking>> {
    const [items, total] = await this.bookings.findAndCount({
      ...toSkipTake(page),
      status,
      paymentStatus,
      vendorId,
    });

    this.logger.debug({
      method: 'findAll',
      message: 'Listed bookings',
      ...page,
      total,
      status,
      paymentStatus,
      vendorId,
    });

    return toPaginated(items, total, page);
  }

  /**
   * Gets one booking with its quotation, vendor and payments (newest first).
   *
   * @param {string} id - Booking id
   * @returns {Promise<Booking>} The booking with paid, pending and payment status
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if no booking has this id
   *
   * @example
   * ```ts
   * const booking = await bookingsService.findOne(id);
   * ```
   */
  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookings.findDetail(id);
    if (!booking) throw this.notFound('findOne', id);

    return booking;
  }

  /**
   * Adjusts the amount (with a reason in notes), completes or cancels the booking, or edits notes.
   *
   * @remarks
   * - One conditional UPDATE, no locks. Idempotent: the same request again leaves the same booking.
   * - `confirmed → completed | cancelled`; both are final. A cancelled booking can't change at all; a completed one still takes notes changes, but not the amount.
   * - The amount can't go below what's paid: a DB CHECK rejects it, even against a payment saved at the same moment.
   * - An empty body changes nothing and returns the current booking.
   *
   * @param {string} id - Booking id
   * @param {UpdateBookingDto} dto - amount (requires notes), status and/or notes
   * @returns {Promise<Booking>} The updated booking with its payments
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if no booking has this id
   * @throws {ConflictException} Throws a `ConflictException` with HTTP status code 409 (Conflict) if the booking is cancelled, or completed and asked to change status or amount
   * @throws {BadRequestException} Throws a `BadRequestException` with HTTP status code 400 (Bad request) if the amount is below what's already paid
   *
   * @example
   * ```ts
   * await bookingsService.update(id, { amount: 85000, notes: 'Negotiated discount' });
   * ```
   */
  async update(
    id: string,
    { amount, status, notes }: UpdateBookingDto,
  ): Promise<Booking> {
    /* only set keys: TypeORM rejects undefined values, and the repository counts the keys */
    const changes: BookingChanges = {};
    if (amount !== undefined) changes.amount = formatCents(toCents(amount));
    if (status) changes.status = status;
    if (notes !== undefined) changes.notes = notes;

    if (
      Object.keys(changes).length &&
      !(await this.bookings.update(id, changes))
    ) {
      const current = await this.bookings.findStatus(id);
      if (!current) throw this.notFound('update', id);

      this.logger.warn({
        method: 'update',
        message: 'Booking change not allowed',
        bookingId: id,
        status: current.status,
        requested: changes.status,
      });
      throw new ConflictException(
        current.status === BookingStatus.Cancelled
          ? 'This booking is cancelled and can no longer change'
          : changes.amount !== undefined
            ? 'The amount can change only while the booking is confirmed'
            : `This booking is already ${current.status}`,
      );
    }

    this.logger.log({
      method: 'update',
      message: 'Booking updated',
      bookingId: id,
      fields: Object.keys(changes),
    });

    return this.findOne(id);
  }

  /**
   * Records a payment to the vendor and adds it to the booking's paid total.
   *
   * @remarks
   * - The paid total and the payment are written in one transaction; payments are never edited.
   * - No overpaying: a DB CHECK (paid ≤ amount) rejects it, even for two payments saved at the same moment.
   * - Allowed on confirmed and completed bookings, not cancelled ones.
   *
   * @param {string} bookingId - Booking id
   * @param {CreatePaymentDto} dto - amount, paidAt, method, optional reference and note
   * @param {string} recordedById - The admin recording it (from the session)
   * @returns {Promise<Payment>} The new payment
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if no booking has this id
   * @throws {ConflictException} Throws a `ConflictException` with HTTP status code 409 (Conflict) if the booking is cancelled
   * @throws {BadRequestException} Throws a `BadRequestException` with HTTP status code 400 (Bad request) if the amount is more than what's pending
   *
   * @example
   * ```ts
   * await bookingsService.addPayment(bookingId, { amount: 20000, paidAt: '2026-11-09', method: PaymentMethod.BankTransfer }, admin.id);
   * ```
   */
  async addPayment(
    bookingId: string,
    { amount, paidAt, method, reference = null, note = null }: CreatePaymentDto,
    recordedById: string,
  ): Promise<Payment> {
    const payment = await this.bookings.addPayment({
      bookingId,
      amount: formatCents(toCents(amount)),
      paidAt,
      method,
      reference,
      note,
      recordedById,
    });

    if (!payment) {
      if (!(await this.bookings.exists(bookingId)))
        throw this.notFound('addPayment', bookingId);

      this.logger.warn({
        method: 'addPayment',
        message: 'Booking cancelled',
        bookingId,
      });
      throw new ConflictException("A cancelled booking can't take payments");
    }

    this.logger.log({
      method: 'addPayment',
      message: 'Payment recorded',
      bookingId,
      paymentId: payment.id,
    });

    return payment;
  }

  /**
   * Deletes a wrong payment and takes it off the booking's paid total.
   *
   * @remarks
   * - Idempotent: deleting a payment that's already gone (or isn't on this booking) changes nothing.
   * - Allowed for any booking status, so mistakes can always be corrected.
   *
   * @param {string} bookingId - Booking id
   * @param {string} paymentId - Payment id
   * @returns {Promise<void>}
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if no booking has this id
   *
   * @example
   * ```ts
   * await bookingsService.deletePayment(bookingId, paymentId);
   * ```
   */
  async deletePayment(bookingId: string, paymentId: string): Promise<void> {
    const deleted = await this.bookings.deletePayment(bookingId, paymentId);

    if (!deleted && !(await this.bookings.exists(bookingId)))
      throw this.notFound('deletePayment', bookingId);

    this.logger.log({
      method: 'deletePayment',
      message: deleted ? 'Payment deleted' : 'Payment already gone',
      bookingId,
      paymentId,
    });
  }

  /**
   * Lists the vendor's own bookings, newest first.
   *
   * @param {string} vendorId - The logged-in vendor (from the session, never the request)
   * @param {PaginationQueryDto} query - page and limit
   * @returns {Promise<Paginated<Booking>>} One page plus pagination meta
   *
   * @example
   * ```ts
   * const { items } = await bookingsService.findVendorBookings(vendor.id, { page: 1, limit: 20 });
   * ```
   */
  async findVendorBookings(
    vendorId: string,
    { page, limit }: PaginationQueryDto,
  ): Promise<Paginated<Booking>> {
    const [items, total] = await this.bookings.findAndCount({
      ...toSkipTake({ page, limit }),
      vendorId,
    });

    this.logger.debug({
      method: 'findVendorBookings',
      message: 'Listed vendor bookings',
      page,
      limit,
      total,
    });

    return toPaginated(items, total, { page, limit });
  }

  /**
   * Gets one of the vendor's own bookings with the event, the agreed bid lines and the payments.
   *
   * @param {string} vendorId - The logged-in vendor
   * @param {string} id - Booking id
   * @returns {Promise<Booking>} The booking (admin notes and recorder are stripped by serialization)
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if it doesn't exist or isn't this vendor's
   *
   * @example
   * ```ts
   * const booking = await bookingsService.findVendorBooking(vendor.id, id);
   * ```
   */
  async findVendorBooking(vendorId: string, id: string): Promise<Booking> {
    const booking = await this.bookings.findOwn(vendorId, id);
    if (!booking) throw this.notFound('findVendorBooking', id);

    return booking;
  }

  private notFound(method: string, bookingId: string): NotFoundException {
    this.logger.warn({ method, message: 'Booking not found', bookingId });
    return new NotFoundException('Booking not found');
  }
}
