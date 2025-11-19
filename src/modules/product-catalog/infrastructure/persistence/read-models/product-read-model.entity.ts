import { ViewEntity, ViewColumn, DataSource } from 'typeorm';

/**
 * ProductReadModel
 *
 * Denormalized read model for product queries (CQRS pattern).
 * Optimized for fast reads by pre-joining and flattening data.
 * Updated asynchronously via domain events.
 *
 * This view improves query performance by avoiding joins at query time.
 */
@ViewEntity({
  expression: (dataSource: DataSource) =>
    dataSource
      .createQueryBuilder()
      .select('p.id', 'id')
      .addSelect('p.sku', 'sku')
      .addSelect('p.name', 'name')
      .addSelect('p.description', 'description')
      .addSelect('p.categoryId', 'categoryId')
      .addSelect('c.name', 'categoryName')
      .addSelect('c.slug', 'categorySlug')
      .addSelect('p.brand', 'brand')
      .addSelect('p.images', 'images')
      .addSelect('p.basePrice', 'basePrice')
      .addSelect('p.currency', 'currency')
      .addSelect('p.minOrderQuantity', 'minOrderQuantity')
      .addSelect('p.maxOrderQuantity', 'maxOrderQuantity')
      .addSelect('p.isActive', 'isActive')
      .addSelect('p.tags', 'tags')
      .addSelect(
        'COALESCE(MIN(p.basePrice + COALESCE(v.priceDelta, 0)), p.basePrice)',
        'minPrice',
      )
      .addSelect(
        'COALESCE(MAX(p.basePrice + COALESCE(v.priceDelta, 0)), p.basePrice)',
        'maxPrice',
      )
      .addSelect('COALESCE(SUM(v.availableQuantity), 0)', 'totalAvailableQuantity')
      .addSelect('COUNT(v.id)', 'variantCount')
      .addSelect('p.createdAt', 'createdAt')
      .addSelect('p.updatedAt', 'updatedAt')
      .from('products', 'p')
      .leftJoin('categories', 'c', 'c.id = p.categoryId')
      .leftJoin('product_variants', 'v', 'v.productId = p.id AND v.isActive = true')
      .groupBy('p.id')
      .addGroupBy('c.id'),
})
export class ProductReadModel {
  @ViewColumn()
  id!: string;

  @ViewColumn()
  sku!: string;

  @ViewColumn()
  name!: string;

  @ViewColumn()
  description!: string;

  @ViewColumn()
  categoryId!: string;

  @ViewColumn()
  categoryName!: string;

  @ViewColumn()
  categorySlug!: string;

  @ViewColumn()
  brand!: string;

  @ViewColumn()
  images!: {
    url: string;
    altText: string;
    displayOrder: number;
    isPrimary: boolean;
  }[];

  @ViewColumn()
  basePrice!: number;

  @ViewColumn()
  currency!: string;

  @ViewColumn()
  minOrderQuantity!: number;

  @ViewColumn()
  maxOrderQuantity!: number | null;

  @ViewColumn()
  isActive!: boolean;

  @ViewColumn()
  tags!: string[];

  @ViewColumn()
  minPrice!: number;

  @ViewColumn()
  maxPrice!: number;

  @ViewColumn()
  totalAvailableQuantity!: number;

  @ViewColumn()
  variantCount!: number;

  @ViewColumn()
  createdAt!: Date;

  @ViewColumn()
  updatedAt!: Date;
}
