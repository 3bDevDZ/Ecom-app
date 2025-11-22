import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from '../../src/app.module';

/**
 * Checkout E2E Tests
 * T117: End-to-end test for checkout flow
 *
 * Tests the complete user journey:
 * 1. Browse products
 * 2. Add products to cart
 * 3. View cart
 * 4. Update cart items
 * 5. Remove items from cart
 * 6. Proceed to checkout
 * 7. Place order
 * 8. Verify order creation
 *
 * User Story 2: Add Products to Cart and Checkout
 */
describe('Checkout Flow (E2E)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let authToken: string;
    let userId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        dataSource = moduleFixture.get<DataSource>(DataSource);

        // Mock authentication - in real scenario, this would call Keycloak
        userId = 'test-user-' + uuidv4();
        authToken = 'mock-jwt-token'; // In real test, get from Keycloak or mock auth service
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Complete Checkout Flow', () => {
        let productId: string;
        let cartItemId: string;

        it('should allow browsing products', async () => {
            // Act
            const response = await request(app.getHttpServer())
                .get('/products')
                .set('Accept', 'application/json')
                .expect(200);

            // Assert
            expect(response.body).toHaveProperty('items');
            expect(Array.isArray(response.body.items)).toBe(true);
            expect(response.body.items.length).toBeGreaterThan(0);

            // Save first product ID for cart operations
            productId = response.body.items[0].id;
        });

        it('should add product to cart', async () => {
            // Skip if no products available
            if (!productId) {
                console.log('Skipping: No products available for testing');
                return;
            }

            // Act
            const response = await request(app.getHttpServer())
                .post('/cart/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    productId: productId,
                    quantity: 5,
                })
                .expect(200);

            // Assert
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('items');
            expect(response.body.items).toHaveLength(1);
            expect(response.body.items[0].productId).toBe(productId);
            expect(response.body.items[0].quantity).toBe(5);

            cartItemId = response.body.items[0].id;
        });

        it('should retrieve cart', async () => {
            // Skip if cart not created
            if (!cartItemId) {
                console.log('Skipping: Cart not created');
                return;
            }

            // Act
            const response = await request(app.getHttpServer())
                .get('/cart')
                .set('Authorization', `Bearer ${authToken}`)
                .set('Accept', 'application/json')
                .expect(200);

            // Assert
            expect(response.body).toHaveProperty('items');
            expect(response.body.items).toHaveLength(1);
            expect(response.body.items[0].id).toBe(cartItemId);
        });

        it('should update cart item quantity', async () => {
            // Skip if cart not created
            if (!cartItemId) {
                console.log('Skipping: Cart not created');
                return;
            }

            // Act
            const response = await request(app.getHttpServer())
                .put(`/cart/items/${cartItemId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    quantity: 10,
                })
                .expect(200);

            // Assert
            expect(response.body.items[0].quantity).toBe(10);
        });

        it('should add another product to cart', async () => {
            // Get second product
            const productsResponse = await request(app.getHttpServer())
                .get('/products')
                .set('Accept', 'application/json');

            if (productsResponse.body.items.length < 2) {
                console.log('Skipping: Need at least 2 products for this test');
                return;
            }

            const secondProductId = productsResponse.body.items[1].id;

            // Act
            const response = await request(app.getHttpServer())
                .post('/cart/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    productId: secondProductId,
                    quantity: 3,
                })
                .expect(200);

            // Assert
            expect(response.body.items).toHaveLength(2);
        });

        it('should remove item from cart', async () => {
            // Skip if cart not created
            if (!cartItemId) {
                console.log('Skipping: Cart not created');
                return;
            }

            // Get current cart to find second item
            const cartResponse = await request(app.getHttpServer())
                .get('/cart')
                .set('Authorization', `Bearer ${authToken}`)
                .set('Accept', 'application/json');

            if (cartResponse.body.items.length < 2) {
                console.log('Skipping: Need 2 items in cart');
                return;
            }

            const itemToRemove = cartResponse.body.items[1].id;

            // Act
            const response = await request(app.getHttpServer())
                .delete(`/cart/items/${itemToRemove}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Assert
            expect(response.body.items).toHaveLength(1);
        });

        it('should place order (checkout)', async () => {
            // Skip if cart not created
            if (!cartItemId) {
                console.log('Skipping: Cart not created');
                return;
            }

            // Act
            const response = await request(app.getHttpServer())
                .post('/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    shippingAddress: {
                        street: '123 Main Street',
                        city: 'Springfield',
                        state: 'IL',
                        postalCode: '62701',
                        country: 'US',
                        contactName: 'John Doe',
                        contactPhone: '+1-555-0100',
                    },
                    poNumber: 'PO-12345',
                    notes: 'Please deliver between 9 AM and 5 PM',
                })
                .expect(201);

            // Assert
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('orderNumber');
            expect(response.body).toHaveProperty('status');
            expect(response.body.status).toBe('pending');
            expect(response.body).toHaveProperty('items');
            expect(response.body.items.length).toBeGreaterThan(0);
            expect(response.body).toHaveProperty('total');
            expect(response.body.shippingAddress.city).toBe('Springfield');
        });

        it('should have empty cart after placing order', async () => {
            // Act
            const response = await request(app.getHttpServer())
                .get('/cart')
                .set('Authorization', `Bearer ${authToken}`)
                .set('Accept', 'application/json')
                .expect(200);

            // Assert
            // Cart should either be empty or a new cart should be created
            expect(response.body.items).toHaveLength(0);
        });
    });

    describe('Error Handling', () => {
        it('should return 401 when not authenticated', async () => {
            await request(app.getHttpServer())
                .get('/cart')
                .expect(401);
        });

        it('should return 400 when adding item with invalid productId', async () => {
            await request(app.getHttpServer())
                .post('/cart/items')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    productId: 'invalid-uuid',
                    quantity: 5,
                })
                .expect(400);
        });

        it('should return 400 when placing order without shipping address', async () => {
            await request(app.getHttpServer())
                .post('/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    poNumber: 'PO-12345',
                })
                .expect(400);
        });

        it('should return 400 when placing order with empty cart', async () => {
            // Clear cart first
            await request(app.getHttpServer())
                .post('/cart/clear')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(204);

            // Try to place order
            await request(app.getHttpServer())
                .post('/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    shippingAddress: {
                        street: '123 Main Street',
                        city: 'Springfield',
                        state: 'IL',
                        postalCode: '62701',
                        country: 'US',
                        contactName: 'John Doe',
                        contactPhone: '+1-555-0100',
                    },
                })
                .expect(400);
        });
    });
});

