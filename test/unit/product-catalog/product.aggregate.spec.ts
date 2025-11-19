import { Product } from '../../../src/modules/product-catalog/domain/aggregates/product';
import { ProductVariant } from '../../../src/modules/product-catalog/domain/entities/product-variant';
import { SKU } from '../../../src/modules/product-catalog/domain/value-objects/sku';
import { Money } from '../../../src/modules/product-catalog/domain/value-objects/money';
import { InventoryInfo } from '../../../src/modules/product-catalog/domain/value-objects/inventory-info';
import { ProductImage } from '../../../src/modules/product-catalog/domain/value-objects/product-image';

describe('Product Aggregate', () => {
  describe('create', () => {
    it('should create a product with minimal required fields', () => {
      const product = Product.create(
        'product-id',
        new SKU('PROD-001'),
        'Test Product',
        'A test product description',
        'cat-123',
        'Brand A',
        [new ProductImage('http://example.com/image.jpg', 'Product image', 1, true)],
        new Money(99.99),
      );

      expect(product.id).toBe('product-id');
      expect(product.sku.value).toBe('PROD-001');
      expect(product.name).toBe('Test Product');
      expect(product.categoryId).toBe('cat-123');
      expect(product.brand).toBe('Brand A');
      expect(product.basePrice.amount).toBe(99.99);
      expect(product.isActive).toBe(true);
      expect(product.minOrderQuantity).toBe(1);
      expect(product.maxOrderQuantity).toBeNull();
      expect(product.variants).toHaveLength(0);
      expect(product.tags).toHaveLength(0);
    });

    it('should throw error for empty name', () => {
      expect(() =>
        Product.create(
          'product-id',
          new SKU('PROD-001'),
          '',
          'Description',
          'cat-123',
          'Brand',
          [new ProductImage('http://example.com/image.jpg', 'Product image', 1, true)],
          new Money(99.99),
        ),
      ).toThrow('Product name cannot be empty');
    });

    it('should throw error for name exceeding 200 characters', () => {
      const longName = 'A'.repeat(201);
      expect(() =>
        Product.create(
          'product-id',
          new SKU('PROD-001'),
          longName,
          'Description',
          'cat-123',
          'Brand',
          [new ProductImage('http://example.com/image.jpg', 'Product image', 1, true)],
          new Money(99.99),
        ),
      ).toThrow('Product name cannot exceed 200 characters');
    });

    it('should throw error for description exceeding 2000 characters', () => {
      const longDesc = 'A'.repeat(2001);
      expect(() =>
        Product.create(
          'product-id',
          new SKU('PROD-001'),
          'Product',
          longDesc,
          'cat-123',
          'Brand',
          [new ProductImage('http://example.com/image.jpg', 'Product image', 1, true)],
          new Money(99.99),
        ),
      ).toThrow('Product description cannot exceed 2000 characters');
    });

    it('should throw error for no images', () => {
      expect(() =>
        Product.create(
          'product-id',
          new SKU('PROD-001'),
          'Product',
          'Description',
          'cat-123',
          'Brand',
          [],
          new Money(99.99),
        ),
      ).toThrow('Product must have at least one image');
    });
  });

  describe('updateDetails', () => {
    it('should update product details', () => {
      const product = Product.create(
        'product-id',
        new SKU('PROD-001'),
        'Original Name',
        'Original Description',
        'cat-123',
        'Brand A',
        [new ProductImage('http://example.com/image.jpg', 'Product image', 1, true)],
        new Money(99.99),
      );

      product.updateDetails(
        'Updated Name',
        'Updated Description',
        'cat-456',
        'Brand B',
      );

      expect(product.name).toBe('Updated Name');
      expect(product.description).toBe('Updated Description');
      expect(product.categoryId).toBe('cat-456');
      expect(product.brand).toBe('Brand B');
    });
  });

  describe('variant management', () => {
    it('should add a variant to product', () => {
      const product = Product.create(
        'product-id',
        new SKU('PROD-001'),
        'T-Shirt',
        'Description',
        'cat-123',
        'Brand',
        [new ProductImage('http://example.com/image.jpg', 'Product image', 1, true)],
        new Money(19.99),
      );

      const variant = ProductVariant.create(
        'variant-1',
        new SKU('PROD-001-L'),
        new Map([['size', 'Large']]),
        new Money(2), // +$2 for large
        new InventoryInfo(100),
      );

      const result = product.addVariant(variant);

      expect(result.isSuccess).toBe(true);
      expect(product.variants).toHaveLength(1);
      expect(product.hasVariants()).toBe(true);
    });

    it('should fail to add variant with duplicate SKU', () => {
      const product = Product.create(
        'product-id',
        new SKU('PROD-001'),
        'T-Shirt',
        'Description',
        'cat-123',
        'Brand',
        [new ProductImage('http://example.com/image.jpg', 'Product image', 1, true)],
        new Money(19.99),
      );

      const variant1 = ProductVariant.create(
        'variant-1',
        new SKU('PROD-001-L'),
        new Map([['size', 'Large']]),
        null,
        new InventoryInfo(100),
      );

      const variant2 = ProductVariant.create(
        'variant-2',
        new SKU('PROD-001-L'), // Duplicate SKU
        new Map([['size', 'Medium']]),
        null,
        new InventoryInfo(50),
      );

      product.addVariant(variant1);
      const result = product.addVariant(variant2);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('already exists');
    });

    it('should fail to add variant with duplicate attributes', () => {
      const product = Product.create(
        'product-id',
        new SKU('PROD-001'),
        'T-Shirt',
        'Description',
        'cat-123',
        'Brand',
        [new ProductImage('http://example.com/image.jpg', 'Product image', 1, true)],
        new Money(19.99),
      );

      const variant1 = ProductVariant.create(
        'variant-1',
        new SKU('PROD-001-L-BLUE'),
        new Map([
          ['size', 'Large'],
          ['color', 'Blue'],
        ]),
        null,
        new InventoryInfo(100),
      );

      const variant2 = ProductVariant.create(
        'variant-2',
        new SKU('PROD-001-L-BLUE-2'),
        new Map([
          ['size', 'Large'],
          ['color', 'Blue'], // Same attributes
        ]),
        null,
        new InventoryInfo(50),
      );

      product.addVariant(variant1);
      const result = product.addVariant(variant2);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Variant with these attributes already exists');
    });

    it('should remove a variant', () => {
      const product = Product.create(
        'product-id',
        new SKU('PROD-001'),
        'T-Shirt',
        'Description',
        'cat-123',
        'Brand',
        [new ProductImage('http://example.com/image.jpg', 'Product image', 1, true)],
        new Money(19.99),
      );

      const variant = ProductVariant.create(
        'variant-1',
        new SKU('PROD-001-L'),
        new Map([['size', 'Large']]),
        null,
        new InventoryInfo(100),
      );

      product.addVariant(variant);
      const result = product.removeVariant('variant-1');

      expect(result.isSuccess).toBe(true);
      expect(product.variants).toHaveLength(0);
    });

    it('should fail to remove non-existent variant', () => {
      const product = Product.create(
        'product-id',
        new SKU('PROD-001'),
        'T-Shirt',
        'Description',
        'cat-123',
        'Brand',
        [new ProductImage('http://example.com/image.jpg', 'Product image', 1, true)],
        new Money(19.99),
      );

      const result = product.removeVariant('non-existent-id');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Variant not found');
    });
  });

  describe('pricing', () => {
    it('should update base price', () => {
      const product = Product.create(
        'product-id',
        new SKU('PROD-001'),
        'Product',
        'Description',
        'cat-123',
        'Brand',
        [new ProductImage('http://example.com/image.jpg', 'Product image', 1, true)],
        new Money(99.99),
      );

      product.updatePricing(new Money(89.99));

      expect(product.basePrice.amount).toBe(89.99);
    });
  });

  describe('order quantities', () => {
    it('should set minimum and maximum order quantities', () => {
      const product = Product.create(
        'product-id',
        new SKU('PROD-001'),
        'Product',
        'Description',
        'cat-123',
        'Brand',
        [new ProductImage('http://example.com/image.jpg', 'Product image', 1, true)],
        new Money(99.99),
      );

      const result = product.setOrderQuantities(10, 100);

      expect(result.isSuccess).toBe(true);
      expect(product.minOrderQuantity).toBe(10);
      expect(product.maxOrderQuantity).toBe(100);
    });

    it('should fail when min quantity is less than 1', () => {
      const product = Product.create(
        'product-id',
        new SKU('PROD-001'),
        'Product',
        'Description',
        'cat-123',
        'Brand',
        [new ProductImage('http://example.com/image.jpg', 'Product image', 1, true)],
        new Money(99.99),
      );

      const result = product.setOrderQuantities(0, 100);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Minimum order quantity must be at least 1');
    });

    it('should fail when max quantity is less than min', () => {
      const product = Product.create(
        'product-id',
        new SKU('PROD-001'),
        'Product',
        'Description',
        'cat-123',
        'Brand',
        [new ProductImage('http://example.com/image.jpg', 'Product image', 1, true)],
        new Money(99.99),
      );

      const result = product.setOrderQuantities(10, 5);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Maximum order quantity must be greater than or equal to minimum');
    });
  });

  describe('availability', () => {
    it('should check if product is available without variants', () => {
      const product = Product.create(
        'product-id',
        new SKU('PROD-001'),
        'Product',
        'Description',
        'cat-123',
        'Brand',
        [new ProductImage('http://example.com/image.jpg', 'Product image', 1, true)],
        new Money(99.99),
      );

      product.activate();
      expect(product.checkAvailability(10)).toBe(true);
    });

    it('should return false when product is inactive', () => {
      const product = Product.create(
        'product-id',
        new SKU('PROD-001'),
        'Product',
        'Description',
        'cat-123',
        'Brand',
        [new ProductImage('http://example.com/image.jpg', 'Product image', 1, true)],
        new Money(99.99),
      );

      product.deactivate();
      expect(product.checkAvailability(10)).toBe(false);
    });
  });

  describe('activate/deactivate', () => {
    it('should activate and deactivate product', () => {
      const product = Product.create(
        'product-id',
        new SKU('PROD-001'),
        'Product',
        'Description',
        'cat-123',
        'Brand',
        [new ProductImage('http://example.com/image.jpg', 'Product image', 1, true)],
        new Money(99.99),
      );

      expect(product.isActive).toBe(true);

      product.deactivate();
      expect(product.isActive).toBe(false);

      product.activate();
      expect(product.isActive).toBe(true);
    });
  });

  describe('tags', () => {
    it('should add tags to product', () => {
      const product = Product.create(
        'product-id',
        new SKU('PROD-001'),
        'Product',
        'Description',
        'cat-123',
        'Brand',
        [new ProductImage('http://example.com/image.jpg', 'Product image', 1, true)],
        new Money(99.99),
      );

      product.addTag('new');
      product.addTag('featured');

      expect(product.tags).toContain('new');
      expect(product.tags).toContain('featured');
      expect(product.tags).toHaveLength(2);
    });

    it('should not add duplicate tags', () => {
      const product = Product.create(
        'product-id',
        new SKU('PROD-001'),
        'Product',
        'Description',
        'cat-123',
        'Brand',
        [new ProductImage('http://example.com/image.jpg', 'Product image', 1, true)],
        new Money(99.99),
      );

      product.addTag('featured');
      product.addTag('featured');

      expect(product.tags).toHaveLength(1);
    });

    it('should remove tags', () => {
      const product = Product.create(
        'product-id',
        new SKU('PROD-001'),
        'Product',
        'Description',
        'cat-123',
        'Brand',
        [new ProductImage('http://example.com/image.jpg', 'Product image', 1, true)],
        new Money(99.99),
      );

      product.addTag('featured');
      product.removeTag('featured');

      expect(product.tags).toHaveLength(0);
    });
  });
});
