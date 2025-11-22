import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetOrderByIdQueryHandler } from '../../../src/modules/order-management/application/handlers/get-order-by-id.handler';
import { GetOrderByIdQuery } from '../../../src/modules/order-management/application/queries/get-order-by-id.query';
import { IOrderRepository } from '../../../src/modules/order-management/domain/repositories/iorder-repository';
import { Order } from '../../../src/modules/order-management/domain/aggregates/order';
import { OrderNumber } from '../../../src/modules/order-management/domain/value-objects/order-number';
import { Address } from '../../../src/modules/order-management/domain/value-objects/address';
import { OrderItem } from '../../../src/modules/order-management/domain/entities/order-item';

describe('GetOrderByIdQueryHandler', () => {
  let handler: GetOrderByIdQueryHandler;
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
        GetOrderByIdQueryHandler,
        {
          provide: 'IOrderRepository',
          useValue: mockOrderRepository,
        },
      ],
    }).compile();

    handler = module.get<GetOrderByIdQueryHandler>(GetOrderByIdQueryHandler);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return order details by ID', async () => {
      // Arrange
      const orderId = 'order-123';
      const userId = 'user-123';
      const query = new GetOrderByIdQuery(orderId, userId);

      const shippingAddress = Address.create(
        '123 Main St',
        'Apt 4',
        'New York',
        'NY',
        '10001',
        'USA',
      );

      const order = Order.create(
        orderId,
        OrderNumber.generate(),
        userId,
        shippingAddress,
        'PO-12345',
        'Please deliver before 5 PM',
      );

      // Add items to order
      const orderItem = OrderItem.create(
        'item-1',
        'product-1',
        'Product Name',
        'SKU-123',
        2,
        99.99,
        'USD',
        undefined,
      );
      order.addItem(orderItem);

      mockOrderRepository.findById.mockResolvedValue(order);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(orderId);
      expect(result.userId).toBe(userId);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe('product-1');
      expect(result.shippingAddress).toBeDefined();
      expect(result.poNumber).toBe('PO-12345');
      expect(result.notes).toBe('Please deliver before 5 PM');
      expect(mockOrderRepository.findById).toHaveBeenCalledWith(orderId);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      // Arrange
      const orderId = 'non-existent-order';
      const userId = 'user-123';
      const query = new GetOrderByIdQuery(orderId, userId);

      mockOrderRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow(
        `Order with ID ${orderId} not found`,
      );
    });

    it('should throw NotFoundException when order belongs to different user', async () => {
      // Arrange
      const orderId = 'order-123';
      const userId = 'user-123';
      const differentUserId = 'user-456';
      const query = new GetOrderByIdQuery(orderId, userId);

      const shippingAddress = Address.create(
        '123 Main St',
        undefined,
        'New York',
        'NY',
        '10001',
        'USA',
      );

      const order = Order.create(
        orderId,
        OrderNumber.generate(),
        differentUserId, // Different user
        shippingAddress,
      );

      mockOrderRepository.findById.mockResolvedValue(order);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow(
        `Order with ID ${orderId} not found`,
      );
    });

    it('should include all order items with correct details', async () => {
      // Arrange
      const orderId = 'order-123';
      const userId = 'user-123';
      const query = new GetOrderByIdQuery(orderId, userId);

      const shippingAddress = Address.create(
        '123 Main St',
        undefined,
        'New York',
        'NY',
        '10001',
        'USA',
      );

      const order = Order.create(
        orderId,
        OrderNumber.generate(),
        userId,
        shippingAddress,
      );

      // Add multiple items
      const item1 = OrderItem.create(
        'item-1',
        'product-1',
        'Product 1',
        'SKU-001',
        2,
        49.99,
        'USD',
        'variant-1',
      );

      const item2 = OrderItem.create(
        'item-2',
        'product-2',
        'Product 2',
        'SKU-002',
        1,
        99.99,
        'USD',
      );

      order.addItem(item1);
      order.addItem(item2);

      mockOrderRepository.findById.mockResolvedValue(order);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.items).toHaveLength(2);
      expect(result.items[0].variantId).toBe('variant-1');
      expect(result.items[1].variantId).toBeUndefined();
      expect(result.subtotal).toBe(199.97); // (2 * 49.99) + (1 * 99.99)
    });
  });
});

