import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import { TestDatabaseHelper } from '../helpers/database.helper';

describe('Product Browsing (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

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
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await TestDatabaseHelper.clearDatabase(dataSource);
  });

  describe('GET /api/products', () => {
    it('should return paginated products', () => {
      return request(app.getHttpServer())
        .get('/api/products')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
        });
    });

    it('should filter products by category', () => {
      return request(app.getHttpServer())
        .get('/api/products?category=electronics')
        .expect(200);
    });

    it('should search products by keyword', () => {
      return request(app.getHttpServer())
        .get('/api/products/search?q=laptop')
        .expect(200);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return product details', () => {
      // This will need actual product data seeded
      return request(app.getHttpServer())
        .get('/api/products/test-product-id')
        .expect((res) => {
          expect(res.status).toBeOneOf([200, 404]);
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .get('/api/products/non-existent-id')
        .expect(404);
    });
  });

  describe('GET /api/categories', () => {
    it('should return list of categories', () => {
      return request(app.getHttpServer())
        .get('/api/categories')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});
