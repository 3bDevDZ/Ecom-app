import { Test, TestingModule } from '@nestjs/testing';
import { GetOrderHistoryQueryHandler } from '../../../src/modules/order-management/application/handlers/get-order-history.handler';
import { GetOrderHistoryQuery } from '../../../src/modules/order-management/application/queries/get-order-history.query';
import { IOrderRepository } from '../../../src/modules/order-management/domain/repositories/iorder-repository';
import { Order } from '../../../src/modules/order-management/domain/aggregates/order';
import { OrderNumber } from '../../../src/modules/order-management/domain/value-objects/order-number';
import { Address } from '../../../src/modules/order-management/domain/value-objects/address';
import { OrderStatus } from '../../../src/modules/order-management/domain/value-objects/order-status';

describe('GetOrderHistoryQueryHandler', () => {
  let handler: GetOrderHistoryQueryHandler;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;

  beforeEach(async () => {
    mockOrderRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByOrderNumber: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOrderHistoryQueryHandler,
        {
          provide: 'IOrderRepository',
          useValue: mockOrderRepository,
        },
      ],
    }).compile();

    handler = module.get<GetOrderHistoryQueryHandler>(GetOrderHistoryQueryHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return order history for a user', async () => {
      // Arrange
      const userId = 'user-123';
      const query = new GetOrderHistoryQuery(userId, 1, 10);

      const shippingAddress = Address.create(
        '123 Main St',
        'Apt 4',
        'New York',
        'NY',
        '10001',
        'USA',
      );

      const order1 = Order.create(
        'order-1',
        OrderNumber.generate(),
        userId,
        shippingAddress,
      );

      const order2 = Order.create(
        'order-2',
        OrderNumber.generate(),
        userId,
        shippingAddress,
      );

      mockOrderRepository.findByUserId.mockResolvedValue([order1, order2]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(mockOrderRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should return empty array when user has no orders', async () => {
      // Arrange
      const userId = 'user-with-no-orders';
      const query = new GetOrderHistoryQuery(userId, 1, 10);

      mockOrderRepository.findByUserId.mockResolvedValue([]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      // Arrange
      const userId = 'user-123';
      const query = new GetOrderHistoryQuery(userId, 2, 5);

      const shippingAddress = Address.create(
        '123 Main St',
        undefined,
        'New York',
        'NY',
        '10001',
        'USA',
      );

      const orders = Array.from({ length: 10 }, (_, i) =>
        Order.create(
          `order-${i}`,
          OrderNumber.generate(),
          userId,
          shippingAddress,
        ),
      );

      mockOrderRepository.findByUserId.mockResolvedValue(orders);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.total).toBe(10);
      // Should return items 5-9 (page 2, 5 items per page)
      expect(result.data.length).toBeLessThanOrEqual(5);
    });

    it('should sort orders by creation date descending (newest first)', async () => {
      // Arrange
      const userId = 'user-123';
      const query = new GetOrderHistoryQuery(userId, 1, 10);

      const shippingAddress = Address.create(
        '123 Main St',
        undefined,
        'New York',
        'NY',
        '10001',
        'USA',
      );

      const order1 = Order.create(
        'order-1',
        OrderNumber.generate(),
        userId,
        shippingAddress,
      );

      // Simulate different creation times
      await new Promise(resolve => setTimeout(resolve, 10));

      const order2 = Order.create(
        'order-2',
        OrderNumber.generate(),
        userId,
        shippingAddress,
      );

      mockOrderRepository.findByUserId.mockResolvedValue([order1, order2]);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.data[0].createdAt >= result.data[1].createdAt).toBe(true);
    });
  });
});

