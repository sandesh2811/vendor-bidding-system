import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  AfterLoad,
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Bid } from '../../bids/entities/bid.entity';
import {
  BookingStatus,
  CHECK_CONSTRAINTS,
  PaymentStatus,
  UNIQUE_CONSTRAINTS,
  UserRole,
} from '../../common/constants';
import { formatCents, parseCents } from '../../common/money';
import { Quotation } from '../../quotations/entities/quotation.entity';
import { Vendor } from '../../vendors/entities/vendor.entity';
import { Payment } from './payment.entity';

/* the winning bid of a quotation; created only by selecting a bid, at most one per quotation */
@Entity('bookings')
@Unique(UNIQUE_CONSTRAINTS.BOOKING_QUOTATION.name, ['quotationId'])
@Unique(UNIQUE_CONSTRAINTS.BOOKING_BID.name, ['bidId'])
/* paid_amount moves only with payment inserts/deletes; this CHECK is what makes overpaying impossible under concurrency */
@Check(
  CHECK_CONSTRAINTS.BOOKING_PAID.name,
  `"paid_amount" >= 0 AND "paid_amount" <= "amount"`,
)
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  quotationId: string;

  @ApiHideProperty()
  @ManyToOne(() => Quotation, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'quotation_id' })
  quotation?: Quotation;

  @Column({ type: 'uuid' })
  bidId: string;

  @ApiHideProperty()
  @ManyToOne(() => Bid, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'bid_id' })
  bid?: Bid;

  @Column({ type: 'uuid' })
  vendorId: string;

  @ApiHideProperty()
  @ManyToOne(() => Vendor, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vendor_id' })
  vendor?: Vendor;

  /* NPR; starts as the bid total */
  @ApiProperty({ type: String, example: '89000.00' })
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  /* NPR; always the sum of this booking's payments (written in the same transaction) */
  @ApiProperty({ type: String, example: '20000.00' })
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  paidAmount: string;

  /* derived on load, never stored */
  @ApiProperty({ type: String, example: '69000.00' })
  pendingAmount: string;

  @ApiProperty({ enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.Confirmed,
  })
  status: BookingStatus;

  /* admin notes (e.g. the reason for an amount change): serialized only on admin routes */
  @Expose({ groups: [UserRole.Admin] })
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => Payment, (payment) => payment.booking)
  payments?: Payment[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @AfterLoad()
  protected applyMoney(): void {
    if (this.amount === undefined || this.paidAmount === undefined) return;

    const pending = parseCents(this.amount) - parseCents(this.paidAmount);
    this.pendingAmount = formatCents(pending);
    this.paymentStatus =
      pending === 0n
        ? PaymentStatus.Paid
        : parseCents(this.paidAmount) === 0n
          ? PaymentStatus.Unpaid
          : PaymentStatus.Partial;
  }
}
