import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import {
  Check,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CHECK_CONSTRAINTS } from '../../common/constants';
import { Vendor } from './vendor.entity';

/* where Mero Event pays a vendor: a bank account and/or a payment QR image. The vendor maintains it; admins read it */
@Entity('vendor_payment_details')
@Check(
  CHECK_CONSTRAINTS.VENDOR_BANK_COMPLETE.name,
  `("bank_name" IS NULL AND "account_name" IS NULL AND "account_number" IS NULL) OR ("bank_name" IS NOT NULL AND "account_name" IS NOT NULL AND "account_number" IS NOT NULL)`,
)
export class VendorPaymentDetails {
  @PrimaryColumn({ type: 'uuid' })
  vendorId: string;

  @ApiHideProperty()
  @OneToOne(() => Vendor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor?: Vendor;

  @Column({ type: 'varchar', nullable: true })
  bankName: string | null;

  /* the account holder's name, as the bank has it */
  @Column({ type: 'varchar', nullable: true })
  accountName: string | null;

  @Column({ type: 'varchar', nullable: true })
  accountNumber: string | null;

  @Column({ type: 'varchar', nullable: true })
  branch: string | null;

  /* FileStorage key; never sent to clients, the image is served by the payment-details/qr routes */
  @ApiHideProperty()
  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  qrStorageKey: string | null;

  @ApiHideProperty()
  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  qrMimeType: string | null;

  /* shown to admins before paying: a recent change to where money goes deserves a second look */
  @ApiProperty({ type: Date, nullable: true })
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date | null;

  @ApiProperty()
  @Expose()
  get hasQr(): boolean {
    return Boolean(this.qrStorageKey);
  }
}
