import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
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
import { BidStatus, UNIQUE_CONSTRAINTS } from '../../common/constants';
import { Quotation } from '../../quotations/entities/quotation.entity';
import { Vendor } from '../../vendors/entities/vendor.entity';
import { BidItem } from './bid-item.entity';

/* one vendor's prices for one quotation; a resubmission replaces it in place */
@Entity('bids')
@Unique(UNIQUE_CONSTRAINTS.BID_QUOTATION_VENDOR.name, [
  'quotationId',
  'vendorId',
])
export class Bid {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  quotationId: string;

  @ApiHideProperty()
  @ManyToOne(() => Quotation, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'quotation_id' })
  quotation?: Quotation;

  @Column({ type: 'uuid' })
  vendorId: string;

  @ManyToOne(() => Vendor, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vendor_id' })
  vendor?: Vendor;

  @Column({ type: 'enum', enum: BidStatus, default: BidStatus.Submitted })
  status: BidStatus;

  /* NPR, computed by the database from the lines; pg returns numeric as a string */
  @ApiProperty({ type: String, example: '89000.00' })
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalAmount: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'date', nullable: true })
  validUntil: string | null;

  @OneToMany(() => BidItem, (item) => item.bid)
  items?: BidItem[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
