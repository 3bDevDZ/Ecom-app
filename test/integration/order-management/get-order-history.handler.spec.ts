import { Test } from '@nestjs/testing';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { GetOrderHistoryQueryHandler } from '../../../src/modules/order-management/application/handlers/get-order-history.handler';
import { GetOrderHistoryQuery } from '../../../src/modules/order-management/application/queries/get-order-history.query';
import { OrderRepository } from '../../../src/modules/order-management/infrastructure/persistence/repositories/order.repository';
import { OrderEntity } from '../../../src/modules/order-management/infrastructure/persistence/entities/order.entity';
import { OrderItemEntity } from '../../../src/modules/order-management/infrastructure/persistence/entities/order-item.entity';
import { TestDatabaseHelper } from '../../helpers/database.helper';
import { Order } from '../../../src/modules/order-management/domain/aggregates/order';
import { Address } from '../../../src/modules/order-management/domain/value-objects/address';
import { UnitOfWorkContextService } from '../../../src/shared/infrastructure/uow/uow-context.service';
import { EventBusService } from '../../../src/shared/event/event-bus.service';
import { OutboxEntity } from '../../../src/shared/infrastructure/outbox/outbox.entity';
import { OutboxService } from '../../../src/shared/infrastructure/outbox/outbox.service';
import { v4 as uuidv4 } from 'uuid';

describe('GetOrderHistoryQueryHandler (Integration)', () => {
  let dataSource: DataSource;
  let handler: GetOrderHistoryQueryHandler;
  let orderRepository: OrderRepository;
  let orderEntityRepository: Repository<OrderEntity>;
  let orderItemEntityRepository: Repository<OrderItemEntity>;

  // Helper function to create test address
  const createTestAddress = () => Address.create({
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
    contactName: 'John Doe',
    contactPhone: '+1-555-123-4567',
  });

  // Helper function to create test order
  const createTestOrder = (userId: string, cartId?: string) => Order.create({
    userId,
    cartId: cartId || uuidv4(),
    items: [{
      id: uuidv4(),
      productId: uuidv4(),
      productName: 'Test Product',
      sku: 'TEST-SKU',
      quantity: 1,
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
          host: process.env.TEST_DB_HOST || process.env.DATABASE_HOST || 'localhost',
          port: parseInt(process.env.TEST_DB_PORT || process.env.DATABASE_PORT || '5432', 10),
          username: process.env.TEST_DB_USERNAME || process.env.DATABASE_USER || 'ecommerce',
          password: process.env.TEST_DB_PASSWORD || process.env.DATABASE_PASSWORD || 'ecommerce_password',
          database: dataSource.options.database as string,
          entities: [OrderEntity, OrderItemEntity, OutboxEntity],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([OrderEntity, OrderItemEntity, OutboxEntity]),
      ],
      providers: [
        GetOrderHistoryQueryHandler,
        OrderRepository,
        UnitOfWorkContextService,
        OutboxService,
        EventBusService,
        {
          provide: 'IOrderRepository',
          useClass: OrderRepository,
        },
        {
          provide: 'AmqpConnection',
          useValue: {
            publish: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    handler = module.get<GetOrderHistoryQueryHandler>(GetOrderHistoryQueryHandler);
    orderRepository = module.get<OrderRepository>(OrderRepository);
    orderEntityRepository = dataSource.getRepository(OrderEntity);
    orderItemEntityRepository = dataSource.getRepository(OrderItemEntity);
  });

  afterAll(async () => {
    await TestDatabaseHelper.closeTestDatabase(dataSource);
  });

  beforeEach(async () => {
    // Clear database before each test
    await TestDatabaseHelper.clearDatabase(dataSource);
  });

  describe('execute', () => {
    it('should return order history for a user with orders', async () => {
      // Arrange
      const userId = uuidv4();
      const order1 = createTestOrder(userId);
      await orderRepository.save(order1);

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const order2 = createTestOrder(userId);
      await orderRepository.save(order2);

      const query = new GetOrderHistoryQuery(userId, 1, 10);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);

      // Verify orders are sorted by creation date descending (newest first)
      expect(new Date(result.data[0].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(result.data[1].createdAt).getTime(),
      );
    });

    it('should return empty array when user has no orders', async () => {
      // Arrange
      const userId = uuidv4();
      const query = new GetOrderHistoryQuery(userId, 1, 10);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(0);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });

    it('should handle pagination correctly', async () => {
      // Arrange
      const userId = uuidv4();

      // Create 10 orders
      for (let i = 0; i < 10; i++) {
        const order = createTestOrder(userId);
        await orderRepository.save(order);
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Test page 1 with limit 5
      const query1 = new GetOrderHistoryQuery(userId, 1, 5);
      const result1 = await handler.execute(query1);

      expect(result1.page).toBe(1);
      expect(result1.limit).toBe(5);
      expect(result1.total).toBe(10);
      expect(result1.data).toHaveLength(5);
      expect(result1.totalPages).toBe(2);
      expect(result1.hasNextPage).toBe(true);
      expect(result1.hasPreviousPage).toBe(false);

      // Test page 2 with limit 5
      const query2 = new GetOrderHistoryQuery(userId, 2, 5);
      const result2 = await handler.execute(query2);

      expect(result2.page).toBe(2);
      expect(result2.limit).toBe(5);
      expect(result2.total).toBe(10);
      expect(result2.data).toHaveLength(5);
      expect(result2.totalPages).toBe(2);
      expect(result2.hasNextPage).toBe(false);
      expect(result2.hasPreviousPage).toBe(true);

      // Verify no overlap between pages
      const page1Ids = result1.data.map(o => o.id);
      const page2Ids = result2.data.map(o => o.id);
      const overlap = page1Ids.filter(id => page2Ids.includes(id));
      expect(overlap).toHaveLength(0);
    });

    it('should only return orders for the specified user', async () => {
      // Arrange
      const userId1 = uuidv4();
      const userId2 = uuidv4();

      // Create orders for user 1
      const order1 = createTestOrder(userId1);
      await orderRepository.save(order1);

      const order2 = createTestOrder(userId1);
      await orderRepository.save(order2);

      // Create order for user 2
      const order3 = createTestOrder(userId2);
      await orderRepository.save(order3);

      // Query for user 1
      const query = new GetOrderHistoryQuery(userId1, 1, 10);
      const result = await handler.execute(query);

      // Assert
      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.data.every(order => order.userId === userId1)).toBe(true);
      expect(result.data.some(order => order.id === order3.id)).toBe(false);
    });

    it('should handle invalid pagination parameters', async () => {
      // Arrange
      const userId = uuidv4();
      const order = createTestOrder(userId);
      await orderRepository.save(order);

      // Test with invalid page (should default to 1)
      const query1 = new GetOrderHistoryQuery(userId, -1, 10);
      const result1 = await handler.execute(query1);
      expect(result1.page).toBe(1);

      // Test with invalid limit (should default to 10)
      const query2 = new GetOrderHistoryQuery(userId, 1, -5);
      const result2 = await handler.execute(query2);
      expect(result2.limit).toBe(10);

      // Test with limit exceeding max (should cap at 100)
      const query3 = new GetOrderHistoryQuery(userId, 1, 200);
      const result3 = await handler.execute(query3);
      expect(result3.limit).toBe(100);
    });

    it('should include receipt URLs when available', async () => {
      // Arrange
      const userId = uuidv4();
      const order = createTestOrder(userId);
      await orderRepository.save(order);

      // Set receipt URL on entity
      const entity = await orderEntityRepository.findOne({ where: { id: order.id } });
      if (entity) {
        entity.receiptUrl = 'https://example.com/receipts/receipt-123.pdf';
        await orderEntityRepository.save(entity);
      }

      const query = new GetOrderHistoryQuery(userId, 1, 10);
      const result = await handler.execute(query);

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].receiptUrl).toBe('https://example.com/receipts/receipt-123.pdf');
    });

    it('should sort orders by creation date descending (newest first)', async () => {
      // Arrange
      const userId = uuidv4();

      // Create orders with delays to ensure different timestamps
      const order1 = createTestOrder(userId);
      await orderRepository.save(order1);

      await new Promise(resolve => setTimeout(resolve, 50));

      const order2 = createTestOrder(userId);
      await orderRepository.save(order2);

      await new Promise(resolve => setTimeout(resolve, 50));

      const order3 = createTestOrder(userId);
      await orderRepository.save(order3);

      const query = new GetOrderHistoryQuery(userId, 1, 10);
      const result = await handler.execute(query);

      // Assert - orders should be sorted newest first
      expect(result.data).toHaveLength(3);
      expect(new Date(result.data[0].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(result.data[1].createdAt).getTime(),
      );
      expect(new Date(result.data[1].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(result.data[2].createdAt).getTime(),
      );
    });
  });
});
