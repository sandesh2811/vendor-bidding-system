import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  CHECK_CONSTRAINTS,
  PaymentMethod,
  UserRole,
} from '../../common/constants';
import { User } from '../../users/entities/user.entity';
import { Booking } from './booking.entity';

/* one payment to the vendor; append-only: a wrong entry is deleted, never edited */
@Entity('payments')
@Index('IDX_payments_booking_id', ['bookingId'])
@Check(CHECK_CONSTRAINTS.PAYMENT_AMOUNT.name, `"amount" > 0`)
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  bookingId: string;

  @ApiHideProperty()
  @ManyToOne(() => Booking, (booking) => booking.payments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'booking_id' })
  booking?: Booking;

  /* NPR */
  @ApiProperty({ type: String, example: '20000.00' })
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  /* calendar date (YYYY-MM-DD) the money was paid */
  @Column({ type: 'date' })
  paidAt: string;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  /* transaction id or cheque number */
  @Column({ type: 'varchar', nullable: true })
  reference: string | null;

  @Expose({ groups: [UserRole.Admin] })
  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Expose({ groups: [UserRole.Admin] })
  @Column({ type: 'uuid' })
  recordedById: string;

  @ApiHideProperty()
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'recorded_by_id' })
  recordedBy?: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
