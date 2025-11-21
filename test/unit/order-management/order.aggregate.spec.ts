import { Order } from '../../../src/modules/order-management/domain/aggregates/order';
import { OrderNumber } from '../../../src/modules/order-management/domain/value-objects/order-number';
import { OrderStatus } from '../../../src/modules/order-management/domain/value-objects/order-status';
import { Address } from '../../../src/modules/order-management/domain/value-objects/address';
import { v4 as uuidv4 } from 'uuid';

describe('Order Aggregate', () => {
  const userId = uuidv4();
  const cartId = uuidv4();

  const validAddress = Address.create({
    street: '123 Main Street',
    city: 'Austin',
    state: 'TX',
    postalCode: '78701',
    country: 'US',
    contactName: 'John Doe',
    contactPhone: '+1-512-555-0123',
  });

  const sampleItems = [
    {
      productId: uuidv4(),
      productName: 'Precision Gear Motor PGM-1000',
      sku: 'PGM-1000-STD',
      quantity: 5,
      unitPrice: 850.00,
      currency: 'USD',
    },
    {
      productId: uuidv4(),
      productName: 'Industrial Valve IV-2000',
      sku: 'IV-2000-XL',
      quantity: 3,
      unitPrice: 1200.00,
      currency: 'USD',
    },
  ];

  describe('create', () => {
    it('should create order with PENDING status', () => {
      const order = Order.create({
        userId,
        cartId,
        items: sampleItems,
        shippingAddress: validAddress,
        billingAddress: validAddress,
      });

      expect(order.userId).toBe(userId);
      expect(order.status).toEqual(OrderStatus.PENDING);
      expect(order.items).toHaveLength(2);
      expect(order.shippingAddress).toEqual(validAddress);
      expect(order.billingAddress).toEqual(validAddress);
      expect(order.orderNumber).toBeDefined();
    });

    it('should generate unique order number', () => {
      const order1 = Order.create({
        userId,
        cartId,
        items: sampleItems,
        shippingAddress: validAddress,
        billingAddress: validAddress,
      });
      const order2 = Order.create({
        userId,
        cartId,
        items: sampleItems,
        shippingAddress: validAddress,
        billingAddress: validAddress,
      });

      expect(order1.orderNumber.value).not.toBe(order2.orderNumber.value);
    });

    it('should calculate total amount from items', () => {
      const order = Order.create({
        userId,
        cartId,
        items: sampleItems,
        shippingAddress: validAddress,
        billingAddress: validAddress,
      });

      const expectedTotal = (5 * 850.00) + (3 * 1200.00);
      expect(order.totalAmount).toBe(expectedTotal);
    });

    it('should throw error if no items provided', () => {
      expect(() => Order.create({
        userId,
        cartId,
        items: [],
        shippingAddress: validAddress,
        billingAddress: validAddress,
      })).toThrow('Order must have at least one item');
    });

    it('should raise OrderPlaced domain event', () => {
      const order = Order.create({
        userId,
        cartId,
        items: sampleItems,
        shippingAddress: validAddress,
        billingAddress: validAddress,
      });

      const events = order.getDomainEvents();
      expect(events).toHaveLength(2); // OrderPlaced + InventoryReservationRequested
      expect(events[0].eventType).toBe('OrderPlaced');
      expect(events[1].eventType).toBe('InventoryReservationRequested');
    });
  });

  describe('process', () => {
    it('should transition from PENDING to PROCESSING', () => {
      const order = Order.create({
        userId,
        cartId,
        items: sampleItems,
        shippingAddress: validAddress,
        billingAddress: validAddress,
      });

      order.process();

      expect(order.status).toEqual(OrderStatus.PROCESSING);
    });

    it('should throw error if current status cannot transition', () => {
      const order = Order.create({
        userId,
        cartId,
        items: sampleItems,
        shippingAddress: validAddress,
        billingAddress: validAddress,
      });
      order.process();
      order.ship();

      expect(() => order.process()).toThrow('Invalid status transition');
    });
  });

  describe('ship', () => {
    it('should transition from PROCESSING to SHIPPED', () => {
      const order = Order.create({
        userId,
        cartId,
        items: sampleItems,
        shippingAddress: validAddress,
        billingAddress: validAddress,
      });
      order.process();

      order.ship();

      expect(order.status).toEqual(OrderStatus.SHIPPED);
    });

    it('should throw error if order is not in PROCESSING status', () => {
      const order = Order.create({
        userId,
        cartId,
        items: sampleItems,
        shippingAddress: validAddress,
        billingAddress: validAddress,
      });

      expect(() => order.ship()).toThrow('Invalid status transition');
    });
  });

  describe('deliver', () => {
    it('should transition from SHIPPED to DELIVERED', () => {
      const order = Order.create({
        userId,
        cartId,
        items: sampleItems,
        shippingAddress: validAddress,
        billingAddress: validAddress,
      });
      order.process();
      order.ship();

      order.deliver();

      expect(order.status).toEqual(OrderStatus.DELIVERED);
    });

    it('should set deliveredAt timestamp', () => {
      const order = Order.create({
        userId,
        cartId,
        items: sampleItems,
        shippingAddress: validAddress,
        billingAddress: validAddress,
      });
      order.process();
      order.ship();

      order.deliver();

      expect(order.deliveredAt).toBeDefined();
      expect(order.deliveredAt).toBeInstanceOf(Date);
    });
  });

  describe('cancel', () => {
    it('should cancel order in PENDING status', () => {
      const order = Order.create({
        userId,
        cartId,
        items: sampleItems,
        shippingAddress: validAddress,
        billingAddress: validAddress,
      });

      order.cancel('Customer requested cancellation');

      expect(order.status).toEqual(OrderStatus.CANCELLED);
      expect(order.cancellationReason).toBe('Customer requested cancellation');
    });

    it('should cancel order in PROCESSING status', () => {
      const order = Order.create({
        userId,
        cartId,
        items: sampleItems,
        shippingAddress: validAddress,
        billingAddress: validAddress,
      });
      order.process();

      order.cancel('Out of stock');

      expect(order.status).toEqual(OrderStatus.CANCELLED);
    });

    it('should not allow cancellation of SHIPPED order', () => {
      const order = Order.create({
        userId,
        cartId,
        items: sampleItems,
        shippingAddress: validAddress,
        billingAddress: validAddress,
      });
      order.process();
      order.ship();

      expect(() => order.cancel('Too late')).toThrow('Invalid status transition');
    });

    it('should require cancellation reason', () => {
      const order = Order.create({
        userId,
        cartId,
        items: sampleItems,
        shippingAddress: validAddress,
        billingAddress: validAddress,
      });

      expect(() => order.cancel('')).toThrow('Cancellation reason is required');
    });

    it('should raise OrderCancelled domain event', () => {
      const order = Order.create({
        userId,
        cartId,
        items: sampleItems,
        shippingAddress: validAddress,
        billingAddress: validAddress,
      });
      order.clearDomainEvents();

      order.cancel('Customer requested');

      const events = order.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('OrderCancelled');
    });
  });

  describe('itemCount', () => {
    it('should return total quantity of all items', () => {
      const order = Order.create({
        userId,
        cartId,
        items: sampleItems,
        shippingAddress: validAddress,
        billingAddress: validAddress,
      });

      expect(order.itemCount).toBe(8); // 5 + 3
    });
  });

  describe('isModifiable', () => {
    it('should return true for PENDING orders', () => {
      const order = Order.create({
        userId,
        cartId,
        items: sampleItems,
        shippingAddress: validAddress,
        billingAddress: validAddress,
      });

      expect(order.isModifiable()).toBe(true);
    });

    it('should return false for SHIPPED orders', () => {
      const order = Order.create({
        userId,
        cartId,
        items: sampleItems,
        shippingAddress: validAddress,
        billingAddress: validAddress,
      });
      order.process();
      order.ship();

      expect(order.isModifiable()).toBe(false);
    });
  });
});

