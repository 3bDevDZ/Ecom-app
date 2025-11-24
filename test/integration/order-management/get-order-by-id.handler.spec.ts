import { Test } from '@nestjs/testing';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { GetOrderByIdQueryHandler } from '../../../src/modules/order-management/application/handlers/get-order-by-id.handler';
import { GetOrderByIdQuery } from '../../../src/modules/order-management/application/queries/get-order-by-id.query';
import { OrderRepository } from '../../../src/modules/order-management/infrastructure/persistence/repositories/order.repository';
import { OrderEntity } from '../../../src/modules/order-management/infrastructure/persistence/entities/order.entity';
import { OrderItemEntity } from '../../../src/modules/order-management/infrastructure/persistence/entities/order-item.entity';
import { TestDatabaseHelper } from '../../helpers/database.helper';
import { Order } from '../../../src/modules/order-management/domain/aggregates/order';
import { Address } from '../../../src/modules/order-management/domain/value-objects/address';
import { v4 as uuidv4 } from 'uuid';

describe('GetOrderByIdQueryHandler (Integration)', () => {
  let dataSource: DataSource;
  let handler: GetOrderByIdQueryHandler;
  let orderRepository: OrderRepository;
  let orderEntityRepository: Repository<OrderEntity>;

  // Helper function to create test address
  const createTestAddress = (overrides?: Partial<{
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    contactName: string;
    contactPhone: string;
  }>) => Address.create({
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
    contactName: 'John Doe',
    contactPhone: '+1-555-123-4567',
    ...overrides,
  });

  // Helper function to create test order
  const createTestOrder = (userId: string, cartId?: string, items?: Array<{
    id: string;
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    currency: string;
  }>) => Order.create({
    userId,
    cartId: cartId || uuidv4(),
    items: items || [{
      id: uuidv4(),
      productId: uuidv4(),
      productName: 'Test Product',
      sku: 'TEST-SKU-001',
      quantity: 2,
      unitPrice: 99.99,
      currency: 'USD',
    }],
    shippingAddress: createTestAddress(),
    billingAddress: createTestAddress(),
  });

  beforeAll(async () => {
    dataSource = await TestDatabaseHelper.createTestDatabase([
      OrderEntity,
      OrderItemEntity,
    ]);

    const module = await Test.createTestingModule({
      imports: [
        CqrsModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST || 'localhost',
          port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
          username: process.env.TEST_DB_USERNAME || 'postgres',
          password: process.env.TEST_DB_PASSWORD || 'postgres',
          database: dataSource.options.database as string,
          entities: [OrderEntity, OrderItemEntity],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([OrderEntity, OrderItemEntity]),
      ],
      providers: [
        GetOrderByIdQueryHandler,
        OrderRepository,
        {
          provide: 'IOrderRepository',
          useClass: OrderRepository,
        },
      ],
    }).compile();

    handler = module.get<GetOrderByIdQueryHandler>(GetOrderByIdQueryHandler);
    orderRepository = module.get<OrderRepository>(OrderRepository);
    orderEntityRepository = dataSource.getRepository(OrderEntity);
  });

  afterAll(async () => {
    await TestDatabaseHelper.closeTestDatabase(dataSource);
  });

  beforeEach(async () => {
    // Clear database before each test
    await TestDatabaseHelper.clearDatabase(dataSource);
  });

  describe('execute', () => {
    it('should return order by ID when order exists and belongs to user', async () => {
      // Arrange
      const userId = uuidv4();
      const order = createTestOrder(userId);
      await orderRepository.save(order);

      const query = new GetOrderByIdQuery(order.id, userId);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(order.id);
      expect(result.userId).toBe(userId);
      expect(result.orderNumber).toBe(order.orderNumber.value);
      expect(result.status).toBe(order.status.value);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].productName).toBe('Test Product');
      expect(result.items[0].sku).toBe('TEST-SKU-001');
      expect(result.items[0].quantity).toBe(2);
      expect(result.items[0].unitPrice).toBe(99.99);
      expect(result.items[0].currency).toBe('USD');
      expect(result.shippingAddress.street).toBe('123 Main St');
      expect(result.shippingAddress.city).toBe('New York');
      expect(result.shippingAddress.state).toBe('NY');
      expect(result.shippingAddress.postalCode).toBe('10001');
      expect(result.shippingAddress.country).toBe('US');
    });

    it('should throw NotFoundException when order does not exist', async () => {
      // Arrange
      const userId = uuidv4();
      const nonExistentOrderId = uuidv4();
      const query = new GetOrderByIdQuery(nonExistentOrderId, userId);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow(
        `Order with ID ${nonExistentOrderId} not found`,
      );
    });

    it('should throw NotFoundException when order belongs to different user', async () => {
      // Arrange
      const userId1 = uuidv4();
      const userId2 = uuidv4();

      const order = createTestOrder(userId1); // Order belongs to user1
      await orderRepository.save(order);

      // Try to access with user2
      const query = new GetOrderByIdQuery(order.id, userId2);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow(
        `Order with ID ${order.id} not found`,
      );
    });

    it('should include receipt URL when available', async () => {
      // Arrange
      const userId = uuidv4();
      const order = createTestOrder(userId);
      await orderRepository.save(order);

      // Set receipt URL on entity
      const entity = await orderEntityRepository.findOne({ where: { id: order.id } });
      if (entity) {
        entity.receiptUrl = 'https://example.com/receipts/receipt-456.pdf';
        await orderEntityRepository.save(entity);
      }

      const query = new GetOrderByIdQuery(order.id, userId);
      const result = await handler.execute(query);

      // Assert
      expect(result.receiptUrl).toBe('https://example.com/receipts/receipt-456.pdf');
    });

    it('should return order with multiple items', async () => {
      // Arrange
      const userId = uuidv4();
      const order = createTestOrder(userId, undefined, [
        {
          id: uuidv4(),
          productId: uuidv4(),
          productName: 'Product 1',
          sku: 'SKU-001',
          quantity: 1,
          unitPrice: 50.00,
          currency: 'USD',
        },
        {
          id: uuidv4(),
          productId: uuidv4(),
          productName: 'Product 2',
          sku: 'SKU-002',
          quantity: 3,
          unitPrice: 25.00,
          currency: 'USD',
        },
      ]);
      await orderRepository.save(order);

      const query = new GetOrderByIdQuery(order.id, userId);
      const result = await handler.execute(query);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.items[0].productName).toBe('Product 1');
      expect(result.items[1].productName).toBe('Product 2');
      expect(result.itemCount).toBe(2);
      expect(result.totalAmount).toBe(125.00); // (1 * 50) + (3 * 25)
    });

    it('should return order with billing address', async () => {
      // Arrange
      const userId = uuidv4();
      const shippingAddress = createTestAddress();
      const billingAddress = createTestAddress({
        street: '456 Business Ave',
        city: 'Boston',
        state: 'MA',
        postalCode: '02101',
      });

      const order = Order.create({
        userId,
        cartId: uuidv4(),
        items: [{
          id: uuidv4(),
          productId: uuidv4(),
          productName: 'Test Product',
          sku: 'TEST-001',
          quantity: 1,
          unitPrice: 99.99,
          currency: 'USD',
        }],
        shippingAddress,
        billingAddress,
      });
      await orderRepository.save(order);

      const query = new GetOrderByIdQuery(order.id, userId);
      const result = await handler.execute(query);

      // Assert
      expect(result.billingAddress).toBeDefined();
      expect(result.billingAddress.street).toBe('456 Business Ave');
      expect(result.billingAddress.city).toBe('Boston');
      expect(result.billingAddress.state).toBe('MA');
      expect(result.billingAddress.postalCode).toBe('02101');
      expect(result.billingAddress.country).toBe('US');
    });

    it('should return order with contact information in addresses', async () => {
      // Arrange
      const userId = uuidv4();
      const shippingAddress = createTestAddress({
        contactName: 'John Doe',
        contactPhone: '+1-555-123-4567',
      });

      const order = Order.create({
        userId,
        cartId: uuidv4(),
        items: [{
          id: uuidv4(),
          productId: uuidv4(),
          productName: 'Test Product',
          sku: 'TEST-001',
          quantity: 1,
          unitPrice: 99.99,
          currency: 'USD',
        }],
        shippingAddress,
        billingAddress: shippingAddress,
      });
      await orderRepository.save(order);

      const query = new GetOrderByIdQuery(order.id, userId);
      const result = await handler.execute(query);

      // Assert
      expect(result.shippingAddress.contactName).toBe('John Doe');
      expect(result.shippingAddress.contactPhone).toBe('+1-555-123-4567');
    });
  });
});
