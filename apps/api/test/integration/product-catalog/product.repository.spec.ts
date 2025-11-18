import { DataSource } from 'typeorm';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductRepository } from '../../../src/modules/product-catalog/infrastructure/persistence/repositories/product.repository';
import { ProductEntity } from '../../../src/modules/product-catalog/infrastructure/persistence/entities/product.entity';
import { ProductVariantEntity } from '../../../src/modules/product-catalog/infrastructure/persistence/entities/product-variant.entity';
import { CategoryEntity } from '../../../src/modules/product-catalog/infrastructure/persistence/entities/category.entity';
import { TestDatabaseHelper } from '../../helpers/database.helper';
import { Product } from '../../../src/modules/product-catalog/domain/aggregates/product';
import { SKU } from '../../../src/modules/product-catalog/domain/value-objects/sku';
import { Money } from '../../../src/modules/product-catalog/domain/value-objects/money';
import { ProductImage } from '../../../src/modules/product-catalog/domain/value-objects/product-image';

describe('ProductRepository (Integration)', () => {
  let dataSource: DataSource;
  let repository: ProductRepository;

  beforeAll(async () => {
    dataSource = await TestDatabaseHelper.createTestDatabase([
      ProductEntity,
      ProductVariantEntity,
      CategoryEntity,
    ]);

    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          ...(dataSource.options as any),
        }),
        TypeOrmModule.forFeature([ProductEntity, ProductVariantEntity, CategoryEntity]),
      ],
      providers: [ProductRepository],
    }).compile();

    repository = module.get<ProductRepository>(ProductRepository);
  });

  afterAll(async () => {
    await TestDatabaseHelper.closeTestDatabase(dataSource);
  });

  afterEach(async () => {
    await TestDatabaseHelper.clearDatabase(dataSource);
  });

  describe('save', () => {
    it('should save a new product', async () => {
      const product = Product.create(
        'product-1',
        new SKU('TEST-001'),
        'Test Product',
        'A test product',
        'cat-123',
        'Test Brand',
        [new ProductImage('http://example.com/image.jpg', 'Test image', 1, true)],
        new Money(99.99),
      );

      const saved = await repository.save(product);

      expect(saved.id).toBe('product-1');
      expect(saved.name).toBe('Test Product');
    });

    it('should update an existing product', async () => {
      const product = Product.create(
        'product-1',
        new SKU('TEST-001'),
        'Test Product',
        'A test product',
        'cat-123',
        'Test Brand',
        [new ProductImage('http://example.com/image.jpg', 'Test image', 1, true)],
        new Money(99.99),
      );

      await repository.save(product);

      product.updateDetails('Updated Product', 'Updated description', 'cat-123', 'Test Brand');
      const updated = await repository.save(product);

      expect(updated.name).toBe('Updated Product');
    });
  });

  describe('findById', () => {
    it('should find product by ID', async () => {
      const product = Product.create(
        'product-1',
        new SKU('TEST-001'),
        'Test Product',
        'A test product',
        'cat-123',
        'Test Brand',
        [new ProductImage('http://example.com/image.jpg', 'Test image', 1, true)],
        new Money(99.99),
      );

      await repository.save(product);

      const found = await repository.findById('product-1');

      expect(found).not.toBeNull();
      expect(found?.id).toBe('product-1');
      expect(found?.name).toBe('Test Product');
    });

    it('should return null for non-existent product', async () => {
      const found = await repository.findById('non-existent');

      expect(found).toBeNull();
    });
  });

  describe('findBySku', () => {
    it('should find product by SKU', async () => {
      const product = Product.create(
        'product-1',
        new SKU('TEST-001'),
        'Test Product',
        'A test product',
        'cat-123',
        'Test Brand',
        [new ProductImage('http://example.com/image.jpg', 'Test image', 1, true)],
        new Money(99.99),
      );

      await repository.save(product);

      const found = await repository.findBySku('TEST-001');

      expect(found).not.toBeNull();
      expect(found?.sku.value).toBe('TEST-001');
    });
  });

  describe('findByCategory', () => {
    it('should find products by category', async () => {
      const product1 = Product.create(
        'product-1',
        new SKU('TEST-001'),
        'Product 1',
        'Description',
        'cat-electronics',
        'Brand',
        [new ProductImage('http://example.com/image.jpg', 'Test image', 1, true)],
        new Money(99.99),
      );

      const product2 = Product.create(
        'product-2',
        new SKU('TEST-002'),
        'Product 2',
        'Description',
        'cat-electronics',
        'Brand',
        [new ProductImage('http://example.com/image.jpg', 'Test image', 1, true)],
        new Money(79.99),
      );

      await repository.save(product1);
      await repository.save(product2);

      const found = await repository.findByCategory('cat-electronics');

      expect(found).toHaveLength(2);
    });
  });

  describe('delete', () => {
    it('should delete a product', async () => {
      const product = Product.create(
        'product-1',
        new SKU('TEST-001'),
        'Test Product',
        'A test product',
        'cat-123',
        'Test Brand',
        [new ProductImage('http://example.com/image.jpg', 'Test image', 1, true)],
        new Money(99.99),
      );

      await repository.save(product);
      await repository.delete('product-1');

      const found = await repository.findById('product-1');
      expect(found).toBeNull();
    });
  });

  describe('count', () => {
    it('should count total products', async () => {
      const product1 = Product.create(
        'product-1',
        new SKU('TEST-001'),
        'Product 1',
        'Description',
        'cat-123',
        'Brand',
        [new ProductImage('http://example.com/image.jpg', 'Test image', 1, true)],
        new Money(99.99),
      );

      const product2 = Product.create(
        'product-2',
        new SKU('TEST-002'),
        'Product 2',
        'Description',
        'cat-123',
        'Brand',
        [new ProductImage('http://example.com/image.jpg', 'Test image', 1, true)],
        new Money(79.99),
      );

      await repository.save(product1);
      await repository.save(product2);

      const count = await repository.count();
      expect(count).toBe(2);
    });
  });
});
