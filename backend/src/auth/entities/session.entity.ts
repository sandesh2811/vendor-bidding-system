import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/* one login; its id is the JWT's `jti`. A token is valid only while its row is unrevoked and unexpired */
@Entity('sessions')
@Index('IDX_sessions_user_id', ['userId'])
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  /* same moment as the JWT's `exp` */
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  /* set by logout; a revoked session never becomes valid again */
  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
