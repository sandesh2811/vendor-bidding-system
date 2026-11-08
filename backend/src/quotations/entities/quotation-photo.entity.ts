import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Quotation } from './quotation.entity';

/* a reference photo stored on local disk; the bytes are served only through authorized routes */
@Entity('quotation_photos')
@Unique(['quotationId', 'sha256'])
export class QuotationPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  quotationId: string;

  @ApiHideProperty()
  @ManyToOne(() => Quotation, (quotation) => quotation.photos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'quotation_id' })
  quotation?: Quotation;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column({ type: 'int' })
  size: number;

  /* content hash: unique per quotation, so re-uploading the same image is a no-op */
  @ApiHideProperty()
  @Exclude()
  @Column({ type: 'char', length: 64 })
  sha256: string;

  /* PhotoStorage key (a path under UPLOAD_DIR for local storage); never sent to clients */
  @ApiHideProperty()
  @Exclude()
  @Column()
  storageKey: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
