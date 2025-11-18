import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ProductEntity } from './product.entity';

/**
 * ProductVariantEntity (TypeORM)
 *
 * Persistence model for ProductVariant entity.
 * Maps domain entity to database table.
 */
@Entity('product_variants')
@Index(['productId'])
@Index(['sku'], { unique: true })
export class ProductVariantEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  productId!: string;

  @ManyToOne(() => ProductEntity, product => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product!: ProductEntity;

  @Column({ unique: true, length: 50 })
  sku!: string;

  // Store attributes as JSON object: { size: 'Large', color: 'Blue' }
  @Column('jsonb')
  attributes!: Record<string, string>;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  priceDelta!: number | null;

  @Column({ length: 3, default: 'USD' })
  currency!: string;

  @Column('int', { default: 0 })
  availableQuantity!: number;

  @Column('int', { default: 0 })
  reservedQuantity!: number;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
