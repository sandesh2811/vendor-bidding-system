import { Expose } from 'class-transformer';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import {
  CHECK_CONSTRAINTS,
  EventType,
  UNIQUE_CONSTRAINTS,
  UserRole,
} from '../../common/constants';
import { User } from '../../users/entities/user.entity';
import { QuotationItem } from './quotation-item.entity';
import { QuotationPhoto } from './quotation-photo.entity';
import { QuotationRecipient } from './quotation-recipient.entity';

/* an event work request Mero Event sends to one or more vendors for pricing */
@Entity('quotations')
@Check(
  CHECK_CONSTRAINTS.QUOTATION_DEADLINE.name,
  `"response_deadline" IS NULL OR "response_deadline" <= "event_date"`,
)
@Check(
  CHECK_CONSTRAINTS.QUOTATION_GUESTS.name,
  `"guest_count" IS NULL OR "guest_count" > 0`,
)
/* the event's natural key: a repeated create (double submit, retry) hits it and returns the existing quotation */
@Unique(UNIQUE_CONSTRAINTS.QUOTATION_EVENT.name, [
  'title',
  'eventDate',
  'location',
])
@Index(['createdAt', 'id'])
export class Quotation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: EventType })
  eventType: EventType;

  /* calendar dates (YYYY-MM-DD), no time zone: an event happens on a local day */
  @Column({ type: 'date' })
  eventDate: string;

  @Column()
  location: string;

  @Column({ type: 'int', nullable: true })
  guestCount: number | null;

  @Column({ type: 'date', nullable: true })
  responseDeadline: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /* internal: serialized only on admin routes */
  @Expose({ groups: [UserRole.Admin] })
  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy?: User;

  @OneToMany(() => QuotationItem, (item) => item.quotation)
  items?: QuotationItem[];

  @OneToMany(() => QuotationPhoto, (photo) => photo.quotation)
  photos?: QuotationPhoto[];

  @OneToMany(() => QuotationRecipient, (recipient) => recipient.quotation)
  recipients?: QuotationRecipient[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
