import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CartItemEntity } from './cart-item.entity';

@Entity('carts')
export class CartEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @OneToMany(() => CartItemEntity, item => item.cart, { cascade: true })
  items: CartItemEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;
}

