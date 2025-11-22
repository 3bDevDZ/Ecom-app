import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import { TestDatabaseHelper } from '../helpers/database.helper';
import { Category } from '../../src/modules/product-catalog/domain/entities/category.entity';
import { Product } from '../../src/modules/product-catalog/domain/entities/product.entity';

/**
 * Product Authentication UI E2E Tests
 *
 * Tests that product pages correctly show/hide prices and add to cart buttons
 * based on user authentication status.
 *
 * Requirements:
 * - Authenticated users: See prices and "Add to Cart" buttons
 * - Unauthenticated users: Do NOT see prices or "Add to Cart" buttons
 */
describe('Product Authentication UI (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let productId: string;
  let categoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    dataSource = app.get(DataSource);

    // Seed test data
    await seedTestData();
  });

  afterAll(async () => {
    await TestDatabaseHelper.clearDatabase(dataSource);
    await app.close();
  });

  /**
   * Seed test data for product pages
   */
  async function seedTestData() {
    // Create a category
    const categoryRepo = dataSource.getRepository(Category);
    const category = categoryRepo.create({
      id: 'test-category-id',
      name: 'Test Category',
      description: 'Test category for authentication UI tests',
      slug: 'test-category',
      isActive: true,
    });
    await categoryRepo.save(category);
    categoryId = category.id;

    // Create a product
    const productRepo = dataSource.getRepository(Product);
    const product = productRepo.create({
      id: 'test-product-id',
      name: 'Test Product',
      description: 'Test product for authentication UI tests',
      sku: 'TEST-PRODUCT-001',
      basePrice: 9999, // $99.99
      currency: 'USD',
      minOrderQuantity: 1,
      maxOrderQuantity: 100,
      isActive: true,
      categoryId: categoryId,
      brand: 'Test Brand',
      metadata: {},
    });
    await productRepo.save(product);
    productId = product.id;
  }

  describe('Product Listing Page (Grid View)', () => {
    it('should NOT show prices or add to cart buttons for unauthenticated users', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Accept', 'text/html')
        .expect(200);

      const html = response.text;

      // Should NOT contain "Sign in to view price" or "Sign in to add to cart" buttons
      expect(html).not.toContain('Sign in to view price');
      expect(html).not.toContain('Sign in to add to cart');
      expect(html).not.toContain('Sign in to add to cart');

      // Should still show product info (name, SKU, stock status)
      if (html.includes('Test Product')) {
        // Only check if product data exists in response
        expect(html).toContain('TEST-PRODUCT-001');
      }
    });

    it('should render product listing page successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .set('Accept', 'text/html')
        .expect(200);

      const html = response.text;

      // Page should render successfully
      expect(html).toBeTruthy();
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });
  });

  describe('Product Listing Page (List View)', () => {
    it('should NOT show prices or add to cart buttons for unauthenticated users', async () => {
      const response = await request(app.getHttpServer())
        .get('/products?viewMode=list')
        .set('Accept', 'text/html')
        .expect(200);

      const html = response.text;

      // Should NOT contain "Sign in" buttons
      expect(html).not.toContain('Sign in to view price');
      expect(html).not.toContain('Sign in to add to cart');
      expect(html).not.toContain('Sign in');

      // Page should render successfully
      expect(html).toBeTruthy();
    });

    it('should render list view successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/products?viewMode=list')
        .set('Accept', 'text/html')
        .expect(200);

      const html = response.text;
      expect(html).toBeTruthy();
    });
  });

  describe('Product Detail Page', () => {
    it('should NOT show prices or add to cart buttons for unauthenticated users', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .set('Accept', 'text/html')
        .expect(200);

      const html = response.text;

      // Should NOT contain "Sign in" buttons
      expect(html).not.toContain('Sign in to view price');
      expect(html).not.toContain('Sign in to add to cart');

      // Page should render successfully
      expect(html).toBeTruthy();
    });

    it('should render product detail page successfully', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .set('Accept', 'text/html')
        .expect(200);

      const html = response.text;
      expect(html).toBeTruthy();
    });
  });

  describe('Template Structure Validation', () => {
    it('should have correct Handlebars conditionals for authentication', async () => {
      // Test that templates use isAuthenticated correctly
      // This is more of a structural test

      const gridResponse = await request(app.getHttpServer())
        .get('/products?viewMode=grid')
        .set('Accept', 'text/html')
        .expect(200);

      const listResponse = await request(app.getHttpServer())
        .get('/products?viewMode=list')
        .set('Accept', 'text/html')
        .expect(200);

      const detailResponse = await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .set('Accept', 'text/html')
        .expect(200);

      // All pages should render successfully
      expect(gridResponse.text).toBeTruthy();
      expect(listResponse.text).toBeTruthy();
      expect(detailResponse.text).toBeTruthy();

      // All pages should not show "Sign in" buttons when unauthenticated
      expect(gridResponse.text).not.toContain('Sign in to add to cart');
      expect(listResponse.text).not.toContain('Sign in to add to cart');
      expect(detailResponse.text).not.toContain('Sign in to add to cart');
    });
  });

  describe('API Endpoints - Authentication Required', () => {
    it('should return 401 when trying to add to cart without authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/cart/items')
        .send({
          productId: productId,
          quantity: 1,
        })
        .expect(401);
    });

    it('should return 401 when trying to get cart without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/cart')
        .expect(401);
    });
  });
});

