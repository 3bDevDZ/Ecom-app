import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderEntity } from './order.entity';

@Entity('order_items')
export class OrderItemEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  orderId: string;

  @ManyToOne(() => OrderEntity, order => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: OrderEntity;

  @Column('uuid')
  productId: string;

  @Column({ type: 'varchar', length: 255 })
  productName: string;

  @Column({ type: 'varchar', length: 100 })
  sku: string;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;
}

