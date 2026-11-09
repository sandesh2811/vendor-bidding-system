import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, type FindOptionsWhere, type Repository } from 'typeorm';
import { BookingStatus, PaymentStatus } from '../common/constants';
import { Booking } from './entities/booking.entity';
import { Payment } from './entities/payment.entity';

export interface BookingFilter {
  skip: number;
  take: number;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  vendorId?: string;
}

export type BookingChanges = Partial<Pick<Booking, 'amount' | 'notes'>> & {
  status?: BookingStatus.Completed | BookingStatus.Cancelled;
};

export type NewPayment = Pick<
  Payment,
  | 'bookingId'
  | 'amount'
  | 'paidAt'
  | 'method'
  | 'reference'
  | 'note'
  | 'recordedById'
>;

/* the derived payment status as a condition on the stored amounts (same rule as Booking.applyMoney) */
const PAYMENT_STATUS_WHERE: Record<PaymentStatus, string> = {
  [PaymentStatus.Unpaid]: 'booking.paidAmount = 0 AND booking.amount > 0',
  [PaymentStatus.Partial]:
    'booking.paidAmount > 0 AND booking.paidAmount < booking.amount',
  [PaymentStatus.Paid]: 'booking.paidAmount = booking.amount',
};

@Injectable()
export class BookingsRepository {
  constructor(
    @InjectRepository(Booking) private readonly bookings: Repository<Booking>,
  ) {}

  /* newest first, with the quotation and vendor for the list columns */
  findAndCount({
    skip,
    take,
    status,
    paymentStatus,
    vendorId,
  }: BookingFilter): Promise<[Booking[], number]> {
    const query = this.bookings
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.quotation', 'quotation')
      .leftJoinAndSelect('booking.vendor', 'vendor')
      .orderBy('booking.createdAt', 'DESC')
      .addOrderBy('booking.id', 'DESC')
      .skip(skip)
      .take(take);

    if (status) query.andWhere('booking.status = :status', { status });
    if (vendorId) query.andWhere('booking.vendorId = :vendorId', { vendorId });
    if (paymentStatus) query.andWhere(PAYMENT_STATUS_WHERE[paymentStatus]);

    return query.getManyAndCount();
  }

  findDetail(id: string): Promise<Booking | null> {
    return this.bookings.findOne({
      where: { id },
      relations: { quotation: true, vendor: true, payments: true },
      order: { payments: { paidAt: 'DESC', createdAt: 'DESC' } },
    });
  }

  /* scoped by vendor: another vendor's booking is never found */
  findOwn(vendorId: string, id: string): Promise<Booking | null> {
    return this.bookings.findOne({
      where: { id, vendorId },
      relations: {
        quotation: { items: true },
        bid: { items: true },
        payments: true,
      },
      order: {
        quotation: { items: { position: 'ASC' } },
        payments: { paidAt: 'DESC', createdAt: 'DESC' },
      },
    });
  }

  findStatus(id: string): Promise<Pick<Booking, 'status'> | null> {
    return this.bookings.findOne({ where: { id }, select: { status: true } });
  }

  exists(id: string): Promise<boolean> {
    return this.bookings.existsBy({ id });
  }

  /**
   * One conditional UPDATE; false when no row matched (unknown, cancelled, or a status move that
   * isn't allowed). A cancelled booking never changes; a status change applies only from confirmed,
   * or to the status it already has (idempotent). The DB CHECK rejects an amount below what's paid.
   */
  async update(id: string, changes: BookingChanges): Promise<boolean> {
    const { status } = changes;
    /* repeating "cancel" alone is a no-op; anything else on a cancelled booking must not match */
    const repeatable =
      status &&
      (status !== BookingStatus.Cancelled || Object.keys(changes).length === 1);

    const where: FindOptionsWhere<Booking> = {
      id,
      status: status
        ? In(
            repeatable
              ? [BookingStatus.Confirmed, status]
              : [BookingStatus.Confirmed],
          )
        : Not(BookingStatus.Cancelled),
    };

    const { affected } = await this.bookings.update(where, changes);
    return Boolean(affected);
  }

  /**
   * Adds to the booking's paid total and inserts the payment, in one transaction. The increment is
   * a single UPDATE: concurrent payments queue on the row, and the CHECK
   * (paid_amount <= amount) rejects whichever would overpay. Null when the booking is unknown or
   * cancelled.
   */
  addPayment(payment: NewPayment): Promise<Payment | null> {
    return this.bookings.manager.transaction(async (manager) => {
      const { affected } = await manager.increment(
        Booking,
        { id: payment.bookingId, status: Not(BookingStatus.Cancelled) },
        'paidAmount',
        payment.amount,
      );
      if (!affected) return null;

      return manager.save(manager.create(Payment, payment));
    });
  }

  /**
   * Deletes the payment and takes its amount off the paid total, in one transaction. Idempotent:
   * only the delete that removed the row decrements. False when there was nothing to delete.
   */
  deletePayment(bookingId: string, paymentId: string): Promise<boolean> {
    return this.bookings.manager.transaction(async (manager) => {
      const payment = await manager.findOne(Payment, {
        where: { id: paymentId, bookingId },
        select: { id: true, amount: true },
      });
      if (!payment) return false;

      const { affected } = await manager.delete(Payment, { id: paymentId });
      if (!affected) return false;

      await manager.decrement(
        Booking,
        { id: bookingId },
        'paidAmount',
        payment.amount,
      );
      return true;
    });
  }
}
