import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { OrderItemEntity } from './order-item.entity';

@Entity('orders')
export class OrderEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  orderNumber: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  cartId: string;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @OneToMany(() => OrderItemEntity, item => item.order, { cascade: true, eager: true })
  items: OrderItemEntity[];

  @Column('json')
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    contactName: string;
    contactPhone: string;
  };

  @Column('json')
  billingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    contactName: string;
    contactPhone: string;
  };

  @Column({ type: 'varchar', length: 500, nullable: true })
  cancellationReason?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shipping: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discount?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  receiptUrl?: string;

  @VersionColumn()
  version: number;
}

