import { Product } from '../../../domain/aggregates/product';
import { Category } from '../../../domain/aggregates/category';
import { ProductVariant } from '../../../domain/entities/product-variant';
import { SKU } from '../../../domain/value-objects/sku';
import { Money } from '../../../domain/value-objects/money';
import { ProductImage } from '../../../domain/value-objects/product-image';
import { InventoryInfo } from '../../../domain/value-objects/inventory-info';
import { ProductEntity } from '../entities/product.entity';
import { ProductVariantEntity } from '../entities/product-variant.entity';
import { CategoryEntity } from '../entities/category.entity';

/**
 * ProductMapper
 *
 * Handles bidirectional mapping between domain objects and persistence entities.
 * Separates domain logic from infrastructure concerns.
 */
export class ProductMapper {
  /**
   * Convert Product aggregate to ProductEntity
   */
  static toPersistence(product: Product): ProductEntity {
    const entity = new ProductEntity();
    entity.id = product.id;
    entity.sku = product.sku.value;
    entity.name = product.name;
    entity.description = product.description;
    entity.categoryId = product.categoryId;
    entity.brand = product.brand;
    entity.images = product.images.map(img => ({
      url: img.url,
      altText: img.altText,
      displayOrder: img.displayOrder,
      isPrimary: img.isPrimary,
    }));
    entity.variants = product.variants.map(v => this.variantToPersistence(v, product.id));
    entity.basePrice = product.basePrice.amount;
    entity.currency = product.basePrice.currency;
    entity.minOrderQuantity = product.minOrderQuantity;
    entity.maxOrderQuantity = product.maxOrderQuantity;
    entity.isActive = product.isActive;
    entity.tags = product.tags;
    entity.createdAt = product.createdAt;
    entity.updatedAt = product.updatedAt;

    return entity;
  }

  /**
   * Convert ProductEntity to Product aggregate
   */
  static toDomain(entity: ProductEntity): Product {
    const product = Product.create(
      entity.id,
      new SKU(entity.sku),
      entity.name,
      entity.description,
      entity.categoryId,
      entity.brand,
      entity.images.map(
        img => new ProductImage(img.url, img.altText, img.displayOrder, img.isPrimary),
      ),
      new Money(entity.basePrice, entity.currency),
    );

    // Set order quantities
    product.setOrderQuantities(entity.minOrderQuantity, entity.maxOrderQuantity);

    // Add variants
    entity.variants.forEach(variantEntity => {
      const variant = this.variantToDomain(variantEntity);
      product.addVariant(variant);
    });

    // Set active status
    if (!entity.isActive) {
      product.deactivate();
    }

    // Add tags
    entity.tags.forEach(tag => product.addTag(tag));

    // Set timestamps (using reflection to access private properties)
    Object.defineProperty(product, '_createdAt', { value: entity.createdAt });
    Object.defineProperty(product, '_updatedAt', { value: entity.updatedAt });

    return product;
  }

  /**
   * Convert ProductVariant entity to ProductVariantEntity
   */
  private static variantToPersistence(
    variant: ProductVariant,
    productId: string,
  ): ProductVariantEntity {
    const entity = new ProductVariantEntity();
    entity.id = variant.id;
    entity.productId = productId;
    entity.sku = variant.sku.value;
    entity.attributes = Object.fromEntries(variant.attributes);
    entity.priceDelta = variant.priceDelta?.amount ?? null;
    entity.currency = variant.priceDelta?.currency ?? 'USD';
    entity.availableQuantity = variant.inventory.availableQuantity;
    entity.reservedQuantity = variant.inventory.reservedQuantity;
    entity.isActive = variant.isActive;
    entity.createdAt = variant.createdAt;
    entity.updatedAt = variant.updatedAt;

    return entity;
  }

  /**
   * Convert ProductVariantEntity to ProductVariant entity
   */
  private static variantToDomain(entity: ProductVariantEntity): ProductVariant {
    const variant = ProductVariant.create(
      entity.id,
      new SKU(entity.sku),
      new Map(Object.entries(entity.attributes)),
      entity.priceDelta !== null ? new Money(entity.priceDelta, entity.currency) : null,
      new InventoryInfo(entity.availableQuantity, entity.reservedQuantity),
    );

    if (!entity.isActive) {
      variant.deactivate();
    }

    // Set timestamps
    Object.defineProperty(variant, '_createdAt', { value: entity.createdAt });
    Object.defineProperty(variant, '_updatedAt', { value: entity.updatedAt });

    return variant;
  }
}

/**
 * CategoryMapper
 *
 * Handles bidirectional mapping between Category aggregate and CategoryEntity.
 */
export class CategoryMapper {
  /**
   * Convert Category aggregate to CategoryEntity
   */
  static toPersistence(category: Category): CategoryEntity {
    const entity = new CategoryEntity();
    entity.id = category.id;
    entity.name = category.name;
    entity.slug = category.slug;
    entity.description = category.description;
    entity.parentId = category.parentId;
    entity.displayOrder = category.displayOrder;
    entity.isActive = category.isActive;
    entity.createdAt = category.createdAt;
    entity.updatedAt = category.updatedAt;

    return entity;
  }

  /**
   * Convert CategoryEntity to Category aggregate
   */
  static toDomain(entity: CategoryEntity): Category {
    const category = Category.create(
      entity.id,
      entity.name,
      entity.slug,
      entity.description,
      entity.parentId,
    );

    category.setDisplayOrder(entity.displayOrder);

    if (!entity.isActive) {
      category.deactivate();
    }

    // Set timestamps
    Object.defineProperty(category, '_createdAt', { value: entity.createdAt });
    Object.defineProperty(category, '_updatedAt', { value: entity.updatedAt });

    return category;
  }
}
