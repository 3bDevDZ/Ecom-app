import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date;
}

