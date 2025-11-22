import { CartItem } from '../../../src/modules/order-management/domain/entities/cart-item';
import { v4 as uuidv4 } from 'uuid';

describe('CartItem Entity', () => {
  const validProps = {
    productId: uuidv4(),
    productName: 'Precision Gear Motor PGM-1000',
    sku: 'PGM-1000-STD',
    quantity: 5,
    unitPrice: 850.00,
    currency: 'USD',
  };

  describe('create', () => {
    it('should create cart item with valid properties', () => {
      const cartItem = CartItem.create(validProps);

      expect(cartItem.productId).toBe(validProps.productId);
      expect(cartItem.productName).toBe(validProps.productName);
      expect(cartItem.sku).toBe(validProps.sku);
      expect(cartItem.quantity).toBe(validProps.quantity);
      expect(cartItem.unitPrice).toBe(validProps.unitPrice);
      expect(cartItem.currency).toBe(validProps.currency);
      expect(cartItem.id).toBeDefined();
    });

    it('should throw error if quantity is zero', () => {
      const invalidProps = { ...validProps, quantity: 0 };

      expect(() => CartItem.create(invalidProps)).toThrow('Quantity must be at least 1');
    });

    it('should throw error if quantity is negative', () => {
      const invalidProps = { ...validProps, quantity: -5 };

      expect(() => CartItem.create(invalidProps)).toThrow('Quantity must be at least 1');
    });

    it('should throw error if unit price is negative', () => {
      const invalidProps = { ...validProps, unitPrice: -100 };

      expect(() => CartItem.create(invalidProps)).toThrow('Unit price must be non-negative');
    });

    it('should allow unit price of zero', () => {
      const propsWithZeroPrice = { ...validProps, unitPrice: 0 };
      const cartItem = CartItem.create(propsWithZeroPrice);

      expect(cartItem.unitPrice).toBe(0);
    });
  });

  describe('lineTotal', () => {
    it('should calculate line total correctly', () => {
      const cartItem = CartItem.create({ ...validProps, quantity: 10, unitPrice: 50 });

      expect(cartItem.lineTotal).toBe(500);
    });

    it('should handle decimal prices correctly', () => {
      const cartItem = CartItem.create({ ...validProps, quantity: 3, unitPrice: 99.99 });

      expect(cartItem.lineTotal).toBeCloseTo(299.97, 2);
    });
  });

  describe('updateQuantity', () => {
    it('should update quantity to valid value', () => {
      const cartItem = CartItem.create(validProps);

      cartItem.updateQuantity(10);

      expect(cartItem.quantity).toBe(10);
    });

    it('should throw error if new quantity is zero', () => {
      const cartItem = CartItem.create(validProps);

      expect(() => cartItem.updateQuantity(0)).toThrow('Quantity must be at least 1');
    });

    it('should throw error if new quantity is negative', () => {
      const cartItem = CartItem.create(validProps);

      expect(() => cartItem.updateQuantity(-5)).toThrow('Quantity must be at least 1');
    });

    it('should recalculate line total after quantity update', () => {
      const cartItem = CartItem.create({ ...validProps, quantity: 5, unitPrice: 100 });
      expect(cartItem.lineTotal).toBe(500);

      cartItem.updateQuantity(10);

      expect(cartItem.lineTotal).toBe(1000);
    });
  });

  describe('equals', () => {
    it('should return true for cart items with same id', () => {
      const cartItem1 = CartItem.create(validProps);
      const cartItem2 = CartItem.reconstitute({ ...validProps, id: cartItem1.id });

      expect(cartItem1.equals(cartItem2)).toBe(true);
    });

    it('should return false for cart items with different ids', () => {
      const cartItem1 = CartItem.create(validProps);
      const cartItem2 = CartItem.create(validProps);

      expect(cartItem1.equals(cartItem2)).toBe(false);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute cart item from existing data', () => {
      const id = uuidv4();
      const props = { ...validProps, id };

      const cartItem = CartItem.reconstitute(props);

      expect(cartItem.id).toBe(id);
      expect(cartItem.productId).toBe(validProps.productId);
      expect(cartItem.quantity).toBe(validProps.quantity);
    });
  });
});

