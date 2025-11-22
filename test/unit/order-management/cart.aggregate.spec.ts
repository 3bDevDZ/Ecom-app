import { Cart } from '../../../src/modules/order-management/domain/aggregates/cart';
import { CartStatus } from '../../../src/modules/order-management/domain/value-objects/cart-status';
import { v4 as uuidv4 } from 'uuid';

describe('Cart Aggregate', () => {
  const userId = uuidv4();

  const sampleItem = {
    productId: uuidv4(),
    productName: 'Precision Gear Motor PGM-1000',
    sku: 'PGM-1000-STD',
    quantity: 5,
    unitPrice: 850.00,
    currency: 'USD',
  };

  describe('create', () => {
    it('should create empty cart with ACTIVE status', () => {
      const cart = Cart.create(userId);

      expect(cart.userId).toBe(userId);
      expect(cart.status).toEqual(CartStatus.ACTIVE);
      expect(cart.items).toHaveLength(0);
      expect(cart.totalAmount).toBe(0);
      expect(cart.itemCount).toBe(0);
    });

    it('should generate unique cart id', () => {
      const cart1 = Cart.create(userId);
      const cart2 = Cart.create(userId);

      expect(cart1.id).not.toBe(cart2.id);
    });
  });

  describe('addItem', () => {
    it('should add item to empty cart', () => {
      const cart = Cart.create(userId);

      cart.addItem(sampleItem);

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].productId).toBe(sampleItem.productId);
      expect(cart.items[0].quantity).toBe(sampleItem.quantity);
      expect(cart.itemCount).toBe(5);
    });

    it('should update quantity if same product already exists', () => {
      const cart = Cart.create(userId);
      cart.addItem({ ...sampleItem, quantity: 3 });

      cart.addItem({ ...sampleItem, quantity: 2 });

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(5);
    });

    it('should add separate items for different products', () => {
      const cart = Cart.create(userId);
      const item2 = { ...sampleItem, productId: uuidv4(), sku: 'DIFFERENT-SKU' };

      cart.addItem(sampleItem);
      cart.addItem(item2);

      expect(cart.items).toHaveLength(2);
    });

    it('should recalculate total after adding item', () => {
      const cart = Cart.create(userId);

      cart.addItem({ ...sampleItem, quantity: 10, unitPrice: 100 });

      expect(cart.totalAmount).toBe(1000);
    });

    it('should throw error if cart is not active', () => {
      const cart = Cart.create(userId);
      cart.addItem({ ...sampleItem, quantity: 1 }); // Add item first so cart can be converted
      cart.convert();

      expect(() => cart.addItem(sampleItem)).toThrow('Cannot modify cart that is not active');
    });

    it('should raise ItemAddedToCart domain event', () => {
      const cart = Cart.create(userId);

      cart.addItem(sampleItem);

      const events = cart.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('ItemAddedToCart');
    });
  });

  describe('updateItemQuantity', () => {
    it('should update quantity of existing item', () => {
      const cart = Cart.create(userId);
      cart.addItem(sampleItem);
      const itemId = cart.items[0].id;

      cart.updateItemQuantity(itemId, 10);

      expect(cart.items[0].quantity).toBe(10);
    });

    it('should recalculate total after updating quantity', () => {
      const cart = Cart.create(userId);
      cart.addItem({ ...sampleItem, quantity: 5, unitPrice: 100 });
      const itemId = cart.items[0].id;

      cart.updateItemQuantity(itemId, 10);

      expect(cart.totalAmount).toBe(1000);
    });

    it('should throw error if item not found', () => {
      const cart = Cart.create(userId);
      const nonExistentId = uuidv4();

      expect(() => cart.updateItemQuantity(nonExistentId, 10)).toThrow('Item not found in cart');
    });

    it('should throw error if cart is not active', () => {
      const cart = Cart.create(userId);
      cart.addItem(sampleItem);
      const itemId = cart.items[0].id;
      cart.convert(); // Cart must have items before converting

      expect(() => cart.updateItemQuantity(itemId, 10)).toThrow('Cannot modify cart that is not active');
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', () => {
      const cart = Cart.create(userId);
      cart.addItem(sampleItem);
      const itemId = cart.items[0].id;

      cart.removeItem(itemId);

      expect(cart.items).toHaveLength(0);
      expect(cart.itemCount).toBe(0);
    });

    it('should recalculate total after removing item', () => {
      const cart = Cart.create(userId);
      cart.addItem({ ...sampleItem, quantity: 10, unitPrice: 100 });
      const itemId = cart.items[0].id;

      cart.removeItem(itemId);

      expect(cart.totalAmount).toBe(0);
    });

    it('should throw error if item not found', () => {
      const cart = Cart.create(userId);
      const nonExistentId = uuidv4();

      expect(() => cart.removeItem(nonExistentId)).toThrow('Item not found in cart');
    });

    it('should throw error if cart is not active', () => {
      const cart = Cart.create(userId);
      cart.addItem(sampleItem);
      const itemId = cart.items[0].id;
      cart.convert(); // Cart must have items before converting

      expect(() => cart.removeItem(itemId)).toThrow('Cannot modify cart that is not active');
    });

    it('should raise ItemRemovedFromCart domain event', () => {
      const cart = Cart.create(userId);
      cart.addItem(sampleItem);
      const itemId = cart.items[0].id;
      cart.clearDomainEvents(); // Clear previous events

      cart.removeItem(itemId);

      const events = cart.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('ItemRemovedFromCart');
    });
  });

  describe('clear', () => {
    it('should remove all items from cart', () => {
      const cart = Cart.create(userId);
      cart.addItem(sampleItem);
      cart.addItem({ ...sampleItem, productId: uuidv4() });

      cart.clear();

      expect(cart.items).toHaveLength(0);
      expect(cart.totalAmount).toBe(0);
    });

    it('should raise CartCleared domain event', () => {
      const cart = Cart.create(userId);
      cart.addItem(sampleItem);
      cart.clearDomainEvents();

      cart.clear();

      const events = cart.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('CartCleared');
    });
  });

  describe('convert', () => {
    it('should change status to CONVERTED', () => {
      const cart = Cart.create(userId);
      cart.addItem(sampleItem);

      cart.convert();

      expect(cart.status).toEqual(CartStatus.CONVERTED);
    });

    it('should not allow conversion of empty cart', () => {
      const cart = Cart.create(userId);

      expect(() => cart.convert()).toThrow('Cannot convert empty cart');
    });
  });

  describe('abandon', () => {
    it('should change status to ABANDONED', () => {
      const cart = Cart.create(userId);

      cart.abandon();

      expect(cart.status).toEqual(CartStatus.ABANDONED);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty cart', () => {
      const cart = Cart.create(userId);

      expect(cart.isEmpty()).toBe(true);
    });

    it('should return false for cart with items', () => {
      const cart = Cart.create(userId);
      cart.addItem(sampleItem);

      expect(cart.isEmpty()).toBe(false);
    });
  });

  describe('totalAmount and itemCount', () => {
    it('should calculate total amount with multiple items', () => {
      const cart = Cart.create(userId);
      cart.addItem({ ...sampleItem, quantity: 5, unitPrice: 100 });
      cart.addItem({ ...sampleItem, productId: uuidv4(), quantity: 3, unitPrice: 200 });

      expect(cart.totalAmount).toBe(1100); // 500 + 600
      expect(cart.itemCount).toBe(8); // 5 + 3
    });
  });
});

