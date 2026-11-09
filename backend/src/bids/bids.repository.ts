import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, type Repository } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { BidStatus, QuotationStatus } from '../common/constants';
import { QuotationRecipient } from '../quotations/entities/quotation-recipient.entity';
import { Quotation } from '../quotations/entities/quotation.entity';
import { QuotationStateError } from '../quotations/quotations.repository';
import { BidItem } from './entities/bid-item.entity';
import { Bid } from './entities/bid.entity';

export type NewBid = Pick<
  Bid,
  'quotationId' | 'vendorId' | 'totalAmount' | 'notes' | 'validUntil'
>;
export type NewBidLine = Pick<
  BidItem,
  'quotationItemId' | 'unitPrice' | 'lineTotal'
>;

const SELECTABLE = [QuotationStatus.Open, QuotationStatus.Closed];

@Injectable()
export class BidsRepository {
  constructor(@InjectRepository(Bid) private readonly bids: Repository<Bid>) {}

  /* the quotation with its items, only if it was sent to this vendor; status is effective (@AfterLoad) */
  async findReceivedQuotation(
    vendorId: string,
    quotationId: string,
  ): Promise<Quotation | null> {
    const recipient = await this.bids.manager.findOne(QuotationRecipient, {
      where: { vendorId, quotationId },
      relations: { quotation: { items: true } },
    });

    return recipient?.quotation ?? null;
  }

  /**
   * Upserts the bid on (quotation_id, vendor_id) and its lines on (bid_id, quotation_item_id), in
   * one transaction. Idempotent: the same input leaves the same single bid. A decided bid
   * (selected/rejected) is never overwritten: the ON CONFLICT update is conditional, and then
   * null is returned. The upsert's own row lock serializes two submissions by one vendor.
   */
  upsert(bid: NewBid, lines: NewBidLine[]): Promise<Bid | null> {
    return this.bids.manager.transaction(async (manager) => {
      const result = await manager
        .createQueryBuilder()
        .insert()
        .into(Bid)
        .values(bid)
        .orUpdate(
          ['notes', 'valid_until', 'total_amount', 'updated_at'],
          ['quotation_id', 'vendor_id'],
          { overwriteCondition: { where: { status: BidStatus.Submitted } } },
        )
        .returning(
          '"id", "status", "created_at" AS "createdAt", "updated_at" AS "updatedAt"',
        )
        .execute();

      const [row] = result.raw as Pick<
        Bid,
        'id' | 'status' | 'createdAt' | 'updatedAt'
      >[];
      if (!row) return null;

      /* every quotation item is priced on every submit, so upserting all lines replaces them all */
      const saved = await manager
        .createQueryBuilder()
        .insert()
        .into(BidItem)
        .values(lines.map((line) => ({ ...line, bidId: row.id })))
        .orUpdate(['unit_price', 'line_total'], ['bid_id', 'quotation_item_id'])
        .returning('"id", "quotation_item_id" AS "quotationItemId"')
        .execute();

      /* only generated columns come back; the rest is what was written (pg would turn dates into Date objects) */
      const ids = new Map(
        (saved.raw as Pick<BidItem, 'id' | 'quotationItemId'>[]).map((line) => [
          line.quotationItemId,
          line.id,
        ]),
      );

      return manager.create(Bid, {
        ...bid,
        ...row,
        items: lines.map((line) =>
          manager.create(BidItem, {
            ...line,
            id: ids.get(line.quotationItemId),
            bidId: row.id,
          }),
        ),
      });
    });
  }

  /**
   * Awards the quotation and books the bid in one transaction, using conditional updates only:
   * - the quotation is awarded only while open or closed; a second select finds 0 rows
   * - the bid is selected only if it is still the bid that was read (status and total unchanged)
   *
   * Idempotent: repeating a select that already won returns its booking. Returns null if the
   * bid doesn't exist; throws QuotationStateError when the selection can't happen.
   */
  select(bidId: string): Promise<Booking | null> {
    return this.bids.manager.transaction(async (manager) => {
      const bid = await manager.findOne(Bid, {
        where: { id: bidId },
        select: {
          id: true,
          quotationId: true,
          vendorId: true,
          totalAmount: true,
        },
      });
      if (!bid) return null;

      const awarded = await manager.update(
        Quotation,
        { id: bid.quotationId, status: In(SELECTABLE) },
        { status: QuotationStatus.Awarded },
      );

      if (!awarded.affected) {
        const existing = await manager.findOneBy(Booking, { bidId });
        if (existing) return existing;

        throw new QuotationStateError(
          'This quotation is already awarded or cancelled',
        );
      }

      const selected = await manager.update(
        Bid,
        {
          id: bidId,
          status: BidStatus.Submitted,
          totalAmount: bid.totalAmount,
        },
        { status: BidStatus.Selected },
      );
      if (!selected.affected)
        throw new QuotationStateError(
          'This bid changed while selecting it. Review it and select again',
        );

      await manager.update(
        Bid,
        { quotationId: bid.quotationId, id: Not(bidId) },
        { status: BidStatus.Rejected },
      );

      return manager.save(
        manager.create(Booking, {
          quotationId: bid.quotationId,
          bidId,
          vendorId: bid.vendorId,
          amount: bid.totalAmount,
        }),
      );
    });
  }

  /* scoped by vendor and quotation: another vendor's bid is never found */
  findOwn(vendorId: string, quotationId: string): Promise<Bid | null> {
    return this.bids.findOne({
      where: { vendorId, quotationId },
      relations: { items: true },
    });
  }

  findForQuotation(quotationId: string): Promise<Bid[]> {
    return this.bids.find({
      where: { quotationId },
      relations: { vendor: true, items: true },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
  }

  quotationExists(id: string): Promise<boolean> {
    return this.bids.manager.existsBy(Quotation, { id });
  }
}
