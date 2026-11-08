import { ApiHideProperty } from '@nestjs/swagger';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CHECK_CONSTRAINTS } from '../../common/constants';
import { Quotation } from './quotation.entity';

/* a line the vendor prices, e.g. "Round tables, 20 pcs" */
@Entity('quotation_items')
@Check(CHECK_CONSTRAINTS.ITEM_QUANTITY.name, `"quantity" > 0`)
@Index(['quotationId', 'position'])
export class QuotationItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  quotationId: string;

  @ApiHideProperty()
  @ManyToOne(() => Quotation, (quotation) => quotation.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'quotation_id' })
  quotation?: Quotation;

  @Column()
  name: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'varchar', nullable: true })
  unit: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /* display order, the item's index in the last saved list */
  @Column({ type: 'int' })
  position: number;
}
