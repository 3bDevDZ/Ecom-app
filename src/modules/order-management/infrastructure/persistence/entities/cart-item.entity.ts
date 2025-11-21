import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CartEntity } from './cart.entity';

@Entity('cart_items')
export class CartItemEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  cartId: string;

  @ManyToOne(() => CartEntity, cart => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cartId' })
  cart: CartEntity;

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

  @Column({ type: 'varchar', length: 3 })
  currency: string;
}

