import {
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ProductVariantEntity } from './product-variant.entity';

/**
 * ProductEntity (TypeORM)
 *
 * Persistence model for Product aggregate root.
 * Maps domain aggregate to database table.
 */
@Entity('products')
@Index(['categoryId'])
@Index(['brand'])
@Index(['isActive'])
export class ProductEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 50 })
  @Index()
  sku!: string;

  @Column({ length: 200 })
  @Index()
  name!: string;

  @Column('text')
  description!: string;

  @Column('uuid')
  categoryId!: string;

  @Column({ length: 100 })
  brand!: string;

  // Store images as JSON array
  @Column('jsonb')
  images!: {
    url: string;
    altText: string;
    displayOrder: number;
    isPrimary: boolean;
  }[];

  @OneToMany(() => ProductVariantEntity, variant => variant.product, {
    cascade: true,
    eager: true,
  })
  variants!: ProductVariantEntity[];

  @Column('decimal', { precision: 10, scale: 2 })
  basePrice!: number;

  @Column({ length: 3, default: 'USD' })
  currency!: string;

  @Column('int', { default: 1 })
  minOrderQuantity!: number;

  @Column('int', { nullable: true })
  maxOrderQuantity!: number | null;

  @Column({ default: true })
  isActive!: boolean;

  // Store tags as JSON array for easier querying
  @Column('jsonb', { default: '[]' })
  @Index()
  tags!: string[];

  // Product specifications (key-value pairs)
  @Column('jsonb', { default: '{}' })
  specifications?: Record<string, any>;

  // Product documents (datasheets, manuals, CAD files)
  @Column('jsonb', { default: '[]' })
  documents?: Array<{
    title: string;
    type: string;
    size: string;
    url: string;
  }>;

  // Product reviews
  @Column('jsonb', { default: '[]' })
  reviews?: Array<{
    userName: string;
    date: string;
    rating: number;
    comment: string;
  }>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
