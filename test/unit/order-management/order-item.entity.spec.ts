import { OrderItem } from '../../../src/modules/order-management/domain/entities/order-item';
import { v4 as uuidv4 } from 'uuid';

describe('OrderItem Entity', () => {
  const validProps = {
    productId: uuidv4(),
    productName: 'Precision Gear Motor PGM-1000',
    sku: 'PGM-1000-STD',
    quantity: 5,
    unitPrice: 850.00,
    currency: 'USD',
  };

  describe('create', () => {
    it('should create order item with valid properties', () => {
      const orderItem = OrderItem.create(validProps);

      expect(orderItem.productId).toBe(validProps.productId);
      expect(orderItem.productName).toBe(validProps.productName);
      expect(orderItem.sku).toBe(validProps.sku);
      expect(orderItem.quantity).toBe(validProps.quantity);
      expect(orderItem.unitPrice).toBe(validProps.unitPrice);
      expect(orderItem.currency).toBe(validProps.currency);
      expect(orderItem.id).toBeDefined();
    });

    it('should throw error if quantity is zero', () => {
      const invalidProps = { ...validProps, quantity: 0 };

      expect(() => OrderItem.create(invalidProps)).toThrow('Quantity must be at least 1');
    });

    it('should throw error if quantity is negative', () => {
      const invalidProps = { ...validProps, quantity: -5 };

      expect(() => OrderItem.create(invalidProps)).toThrow('Quantity must be at least 1');
    });

    it('should throw error if unit price is negative', () => {
      const invalidProps = { ...validProps, unitPrice: -100 };

      expect(() => OrderItem.create(invalidProps)).toThrow('Unit price must be non-negative');
    });

    it('should allow unit price of zero', () => {
      const propsWithZeroPrice = { ...validProps, unitPrice: 0 };
      const orderItem = OrderItem.create(propsWithZeroPrice);

      expect(orderItem.unitPrice).toBe(0);
    });

    it('should not allow quantity changes after creation', () => {
      const orderItem = OrderItem.create(validProps);

      // Order items are immutable - quantity cannot be changed
      expect((orderItem as any).updateQuantity).toBeUndefined();
    });
  });

  describe('lineTotal', () => {
    it('should calculate line total correctly', () => {
      const orderItem = OrderItem.create({ ...validProps, quantity: 10, unitPrice: 50 });

      expect(orderItem.lineTotal).toBe(500);
    });

    it('should handle decimal prices correctly', () => {
      const orderItem = OrderItem.create({ ...validProps, quantity: 3, unitPrice: 99.99 });

      expect(orderItem.lineTotal).toBeCloseTo(299.97, 2);
    });
  });

  describe('equals', () => {
    it('should return true for order items with same id', () => {
      const orderItem1 = OrderItem.create(validProps);
      const orderItem2 = OrderItem.reconstitute({ ...validProps, id: orderItem1.id });

      expect(orderItem1.equals(orderItem2)).toBe(true);
    });

    it('should return false for order items with different ids', () => {
      const orderItem1 = OrderItem.create(validProps);
      const orderItem2 = OrderItem.create(validProps);

      expect(orderItem1.equals(orderItem2)).toBe(false);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute order item from existing data', () => {
      const id = uuidv4();
      const props = { ...validProps, id };

      const orderItem = OrderItem.reconstitute(props);

      expect(orderItem.id).toBe(id);
      expect(orderItem.productId).toBe(validProps.productId);
      expect(orderItem.quantity).toBe(validProps.quantity);
    });
  });
});

