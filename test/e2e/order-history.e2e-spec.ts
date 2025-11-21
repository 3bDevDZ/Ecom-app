import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Order History E2E', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let orderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // TODO: Replace with actual authentication when Keycloak integration is ready
    authToken = 'mock-jwt-token';
    userId = 'test-user-123';
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/orders (GET)', () => {
    it('should return order history for authenticated user', () => {
      return request(app.getHttpServer())
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/orders?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(5);
          expect(res.body.data.length).toBeLessThanOrEqual(5);
        });
    });

    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer())
        .get('/api/orders')
        .expect(401);
    });
  });

  describe('/api/orders/:id (GET)', () => {
    beforeEach(async () => {
      // Create a test order first
      const cartResponse = await request(app.getHttpServer())
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'test-product-id',
          quantity: 2,
        });

      const orderResponse = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TC',
            postalCode: '12345',
            country: 'USA',
          },
        });

      orderId = orderResponse.body.orderId || orderResponse.body.id;
    });

    it('should return order details by ID', () => {
      return request(app.getHttpServer())
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('orderNumber');
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('shippingAddress');
          expect(res.body).toHaveProperty('subtotal');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });

    it('should return 404 for non-existent order', () => {
      return request(app.getHttpServer())
        .get('/api/orders/non-existent-order-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer())
        .get(`/api/orders/${orderId}`)
        .expect(401);
    });
  });

  describe('/api/orders/:id/reorder (POST)', () => {
    beforeEach(async () => {
      // Create a test order first
      await request(app.getHttpServer())
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'test-product-id',
          quantity: 2,
        });

      const orderResponse = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TC',
            postalCode: '12345',
            country: 'USA',
          },
        });

      orderId = orderResponse.body.orderId || orderResponse.body.id;
    });

    it('should create a new cart from previous order', () => {
      return request(app.getHttpServer())
        .post(`/api/orders/${orderId}/reorder`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('cartId');
          expect(res.body.cartId).toBeDefined();
        });
    });

    it('should return 404 for non-existent order', () => {
      return request(app.getHttpServer())
        .post('/api/orders/non-existent-order-id/reorder')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer())
        .post(`/api/orders/${orderId}/reorder`)
        .expect(401);
    });
  });

  describe('Order History Flow', () => {
    it('should complete full order history workflow', async () => {
      // Step 1: Add items to cart
      await request(app.getHttpServer())
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'product-1',
          quantity: 2,
        })
        .expect(201);

      // Step 2: Place order
      const orderResponse = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          shippingAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA',
          },
          poNumber: 'PO-12345',
        })
        .expect(201);

      const createdOrderId = orderResponse.body.orderId || orderResponse.body.id;

      // Step 3: View order history
      const historyResponse = await request(app.getHttpServer())
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(historyResponse.body.data.length).toBeGreaterThan(0);
      const orderInHistory = historyResponse.body.data.find(
        (o: any) => o.id === createdOrderId,
      );
      expect(orderInHistory).toBeDefined();

      // Step 4: View order details
      await request(app.getHttpServer())
        .get(`/api/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(createdOrderId);
          expect(res.body.poNumber).toBe('PO-12345');
        });

      // Step 5: Reorder from history
      const reorderResponse = await request(app.getHttpServer())
        .post(`/api/orders/${createdOrderId}/reorder`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(reorderResponse.body.cartId).toBeDefined();

      // Step 6: Verify cart has reordered items
      await request(app.getHttpServer())
        .get('/api/cart')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.items.length).toBeGreaterThan(0);
        });
    });
  });
});

