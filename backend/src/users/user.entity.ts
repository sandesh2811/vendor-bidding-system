import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserRole } from '../common/constants';
import { Vendor } from '../vendors/vendor.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @ApiHideProperty()
  @Exclude()
  @Column({ select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ type: 'uuid', nullable: true })
  vendorId: string | null;

  @OneToOne(() => Vendor, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vendor_id' })
  vendor?: Vendor | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
