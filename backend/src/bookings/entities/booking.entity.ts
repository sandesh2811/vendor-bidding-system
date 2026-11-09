import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Bid } from '../../bids/entities/bid.entity';
import { BookingStatus, UNIQUE_CONSTRAINTS } from '../../common/constants';
import { Quotation } from '../../quotations/entities/quotation.entity';
import { Vendor } from '../../vendors/entities/vendor.entity';

/* the winning bid of a quotation; created only by selecting a bid, at most one per quotation */
@Entity('bookings')
@Unique(UNIQUE_CONSTRAINTS.BOOKING_QUOTATION.name, ['quotationId'])
@Unique(UNIQUE_CONSTRAINTS.BOOKING_BID.name, ['bidId'])
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

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.Confirmed,
  })
  status: BookingStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
