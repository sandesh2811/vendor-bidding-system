import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Booking } from '../bookings/entities/booking.entity';
import { QuotationStatus } from '../common/constants';
import { formatCents, toCents } from '../common/money';
import { QuotationStateError } from '../quotations/quotations.repository';
import { BidsRepository, type NewBidLine } from './bids.repository';
import type { SubmitBidDto } from './dto/submit-bid.dto';
import type { Bid } from './entities/bid.entity';

@Injectable()
export class BidsService {
  private readonly logger = new Logger(BidsService.name);

  constructor(private readonly bids: BidsRepository) {}

  /**
   * Submits the vendor's bid on a quotation, or replaces the one it already has.
   *
   * @remarks
   * - One bid per vendor per quotation (unique (quotation_id, vendor_id)); a resubmission replaces prices, notes and validUntil.
   * - Idempotent: the same request again leaves the same single bid.
   * - Every item must be priced exactly once; line totals and the total are computed here in integer cents, never from client totals.
   * - The bid and its lines are written in one transaction; a selected or rejected bid is never overwritten.
   *
   * @param {string} vendorId - The logged-in vendor (from the session, never the request)
   * @param {string} quotationId - Quotation id
   * @param {SubmitBidDto} dto - Unit price per item, optional notes and validUntil
   * @returns {Promise<Bid>} The bid with its lines
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if the quotation wasn't sent to this vendor
   * @throws {ConflictException} Throws a `ConflictException` with HTTP status code 409 (Conflict) if the quotation isn't open (closed, past its deadline, awarded or cancelled)
   * @throws {ConflictException} Throws a `ConflictException` with HTTP status code 409 (Conflict) if the bid was already selected or rejected
   * @throws {BadRequestException} Throws a `BadRequestException` with HTTP status code 400 (Bad request) if an item is missing, repeated or from another quotation, or an amount is too large
   *
   * @example
   * ```ts
   * await bidsService.submit(vendor.id, quotationId, { items: [{ quotationItemId, unitPrice: 450 }], notes: 'Includes setup' });
   * ```
   */
  async submit(
    vendorId: string,
    quotationId: string,
    { items, notes = null, validUntil = null }: SubmitBidDto,
  ): Promise<Bid> {
    const quotation = await this.bids.findReceivedQuotation(
      vendorId,
      quotationId,
    );

    if (!quotation) throw this.quotationNotFound('submit', quotationId);

    if (quotation.status !== QuotationStatus.Open) {
      this.logger.warn({
        method: 'submit',
        message: 'Bidding not open',
        quotationId,
        status: quotation.status,
      });
      throw new ConflictException(
        `Bidding is closed: this quotation is ${quotation.status}`,
      );
    }

    /* items are unique (DTO), so equal sizes plus every quotation item present means an exact match */
    const prices = new Map(
      items.map((item) => [item.quotationItemId, item.unitPrice]),
    );
    if (
      prices.size !== quotation.items!.length ||
      quotation.items!.some((item) => !prices.has(item.id))
    ) {
      this.logger.warn({
        method: 'submit',
        message: 'Incomplete bid',
        quotationId,
      });
      throw new BadRequestException(
        'Every item of the quotation must be priced exactly once',
      );
    }

    let totalCents = 0n;
    const lines: NewBidLine[] = quotation.items!.map((item) => {
      const unitCents = toCents(prices.get(item.id)!);
      const lineCents = unitCents * BigInt(item.quantity);
      totalCents += lineCents;
      return {
        quotationItemId: item.id,
        unitPrice: formatCents(unitCents),
        lineTotal: formatCents(lineCents),
      };
    });

    const bid = await this.bids.upsert(
      {
        quotationId,
        vendorId,
        notes,
        validUntil,
        totalAmount: formatCents(totalCents),
      },
      lines,
    );

    if (!bid) {
      this.logger.warn({
        method: 'submit',
        message: 'Bid already decided',
        quotationId,
      });
      throw new ConflictException('This bid has already been decided');
    }

    this.logger.log({
      method: 'submit',
      message: 'Bid submitted',
      quotationId,
      bidId: bid.id,
      items: lines.length,
    });

    return bid;
  }

  /**
   * Gets the vendor's own bid on a quotation.
   *
   * @param {string} vendorId - The logged-in vendor
   * @param {string} quotationId - Quotation id
   * @returns {Promise<Bid>} The bid with its lines
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if the vendor has no bid on it (or it wasn't sent to them)
   *
   * @example
   * ```ts
   * const bid = await bidsService.findOwn(vendor.id, quotationId);
   * ```
   */
  async findOwn(vendorId: string, quotationId: string): Promise<Bid> {
    const bid = await this.bids.findOwn(vendorId, quotationId);

    if (!bid) {
      this.logger.debug({
        method: 'findOwn',
        message: 'No bid yet',
        quotationId,
      });
      throw new NotFoundException('Bid not found');
    }

    return bid;
  }

  /**
   * Lists every bid on a quotation with its vendor and lines, for the admin comparison.
   *
   * @param {string} quotationId - Quotation id
   * @returns {Promise<Bid[]>} Bids, oldest first; empty if nobody has bid
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if no quotation has this id
   *
   * @example
   * ```ts
   * const bids = await bidsService.findForQuotation(quotationId);
   * ```
   */
  async findForQuotation(quotationId: string): Promise<Bid[]> {
    const bids = await this.bids.findForQuotation(quotationId);

    /* only an empty list needs telling apart from an unknown quotation */
    if (!bids.length && !(await this.bids.quotationExists(quotationId)))
      throw this.quotationNotFound('findForQuotation', quotationId);

    this.logger.debug({
      method: 'findForQuotation',
      message: 'Listed bids',
      quotationId,
      total: bids.length,
    });

    return bids;
  }

  /**
   * Selects the winning bid and creates the booking.
   *
   * @remarks
   * - One transaction of conditional updates: the quotation is awarded only while open or closed, the bid is selected only if unchanged since it was read, every other bid is rejected, and a confirmed booking is created with the bid's total.
   * - Idempotent: repeating a select that already won returns its booking.
   * - Two admins selecting different bids at once: one wins, the other gets 409. A quotation never has two bookings.
   * - Can't be undone.
   *
   * @param {string} bidId - Bid id
   * @returns {Promise<Booking>} The new booking
   * @throws {NotFoundException} Throws a `NotFoundException` with HTTP status code 404 (Not found) if no bid has this id
   * @throws {ConflictException} Throws a `ConflictException` with HTTP status code 409 (Conflict) if the quotation is already awarded (to another bid) or cancelled, or the bid changed meanwhile
   *
   * @example
   * ```ts
   * const booking = await bidsService.select(bidId);
   * ```
   */
  async select(bidId: string): Promise<Booking> {
    const booking = await this.bids
      .select(bidId)
      .catch((error: unknown) => this.rethrowDomainError(error, 'select'));

    if (!booking) {
      this.logger.warn({ method: 'select', message: 'Bid not found', bidId });
      throw new NotFoundException('Bid not found');
    }

    this.logger.log({
      method: 'select',
      message: 'Bid selected, booking created',
      bidId,
      quotationId: booking.quotationId,
      bookingId: booking.id,
    });

    return booking;
  }

  /* repository errors thrown to roll back a transaction, as HTTP errors */
  private rethrowDomainError(error: unknown, method: string): never {
    if (error instanceof QuotationStateError) {
      this.logger.warn({ method, message: error.message });
      throw new ConflictException(error.message);
    }

    throw error;
  }

  private quotationNotFound(
    method: string,
    quotationId: string,
  ): NotFoundException {
    this.logger.warn({ method, message: 'Quotation not found', quotationId });
    return new NotFoundException('Quotation not found');
  }
}
