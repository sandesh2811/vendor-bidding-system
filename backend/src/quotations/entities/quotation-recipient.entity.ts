import { ApiHideProperty } from '@nestjs/swagger';
import {
  CreateDateColumn,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Vendor } from '../../vendors/entities/vendor.entity';
import { Quotation } from './quotation.entity';

/* a quotation sent to one vendor; the vendor portal sees only quotations it has a row for */
@Entity('quotation_recipients')
@Unique(['quotationId', 'vendorId'])
@Index(['vendorId', 'sentAt', 'id'])
export class QuotationRecipient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  quotationId: string;

  @ApiHideProperty()
  @ManyToOne(() => Quotation, (quotation) => quotation.recipients, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'quotation_id' })
  quotation?: Quotation;

  @Column({ type: 'uuid' })
  vendorId: string;

  @ManyToOne(() => Vendor, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vendor_id' })
  vendor?: Vendor;

  @CreateDateColumn({ type: 'timestamptz' })
  sentAt: Date;

  /* first time the vendor opened it; null until then */
  @Column({ type: 'timestamptz', nullable: true })
  viewedAt: Date | null;

  /* set when the vendor declines; cleared when the admin sends it to the vendor again */
  @Column({ type: 'timestamptz', nullable: true })
  declinedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  declineReason: string | null;
}
