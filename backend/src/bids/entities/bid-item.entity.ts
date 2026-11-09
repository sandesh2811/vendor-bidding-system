import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { CHECK_CONSTRAINTS, UNIQUE_CONSTRAINTS } from '../../common/constants';
import { QuotationItem } from '../../quotations/entities/quotation-item.entity';
import { Bid } from './bid.entity';

/* the price of one quotation item in one bid; RESTRICT keeps priced items from being deleted */
@Entity('bid_items')
@Unique(UNIQUE_CONSTRAINTS.BID_ITEM.name, ['bidId', 'quotationItemId'])
@Check(CHECK_CONSTRAINTS.BID_UNIT_PRICE.name, `"unit_price" >= 0`)
export class BidItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  bidId: string;

  @ApiHideProperty()
  @ManyToOne(() => Bid, (bid) => bid.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bid_id' })
  bid?: Bid;

  @Column({ type: 'uuid' })
  quotationItemId: string;

  @ApiHideProperty()
  @ManyToOne(() => QuotationItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'quotation_item_id' })
  quotationItem?: QuotationItem;

  /* 0 means the vendor doesn't offer this item */
  @ApiProperty({ type: String, example: '450.00' })
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  unitPrice: string;

  /* unitPrice × the item's quantity, computed by the database */
  @ApiProperty({ type: String, example: '9000.00' })
  @Column({ type: 'numeric', precision: 12, scale: 2 })
  lineTotal: string;
}
