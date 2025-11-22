import { OrderStatus } from '../../../src/modules/order-management/domain/value-objects/order-status';

describe('OrderStatus Value Object', () => {
  describe('create', () => {
    it('should create PENDING status', () => {
      const status = OrderStatus.PENDING;

      expect(status.value).toBe('pending');
      expect(status.isPending()).toBe(true);
    });

    it('should create PROCESSING status', () => {
      const status = OrderStatus.PROCESSING;

      expect(status.value).toBe('processing');
      expect(status.isProcessing()).toBe(true);
    });

    it('should create SHIPPED status', () => {
      const status = OrderStatus.SHIPPED;

      expect(status.value).toBe('shipped');
      expect(status.isShipped()).toBe(true);
    });

    it('should create DELIVERED status', () => {
      const status = OrderStatus.DELIVERED;

      expect(status.value).toBe('delivered');
      expect(status.isDelivered()).toBe(true);
    });

    it('should create CANCELLED status', () => {
      const status = OrderStatus.CANCELLED;

      expect(status.value).toBe('cancelled');
      expect(status.isCancelled()).toBe(true);
    });
  });

  describe('canTransitionTo', () => {
    it('should allow PENDING to PROCESSING', () => {
      const status = OrderStatus.PENDING;

      expect(status.canTransitionTo(OrderStatus.PROCESSING)).toBe(true);
    });

    it('should allow PENDING to CANCELLED', () => {
      const status = OrderStatus.PENDING;

      expect(status.canTransitionTo(OrderStatus.CANCELLED)).toBe(true);
    });

    it('should not allow PENDING to SHIPPED', () => {
      const status = OrderStatus.PENDING;

      expect(status.canTransitionTo(OrderStatus.SHIPPED)).toBe(false);
    });

    it('should allow PROCESSING to SHIPPED', () => {
      const status = OrderStatus.PROCESSING;

      expect(status.canTransitionTo(OrderStatus.SHIPPED)).toBe(true);
    });

    it('should allow PROCESSING to CANCELLED', () => {
      const status = OrderStatus.PROCESSING;

      expect(status.canTransitionTo(OrderStatus.CANCELLED)).toBe(true);
    });

    it('should not allow PROCESSING to PENDING', () => {
      const status = OrderStatus.PROCESSING;

      expect(status.canTransitionTo(OrderStatus.PENDING)).toBe(false);
    });

    it('should allow SHIPPED to DELIVERED', () => {
      const status = OrderStatus.SHIPPED;

      expect(status.canTransitionTo(OrderStatus.DELIVERED)).toBe(true);
    });

    it('should not allow SHIPPED to CANCELLED', () => {
      const status = OrderStatus.SHIPPED;

      expect(status.canTransitionTo(OrderStatus.CANCELLED)).toBe(false);
    });

    it('should not allow any transitions from DELIVERED', () => {
      const status = OrderStatus.DELIVERED;

      expect(status.canTransitionTo(OrderStatus.PENDING)).toBe(false);
      expect(status.canTransitionTo(OrderStatus.PROCESSING)).toBe(false);
      expect(status.canTransitionTo(OrderStatus.SHIPPED)).toBe(false);
      expect(status.canTransitionTo(OrderStatus.CANCELLED)).toBe(false);
    });

    it('should not allow any transitions from CANCELLED', () => {
      const status = OrderStatus.CANCELLED;

      expect(status.canTransitionTo(OrderStatus.PENDING)).toBe(false);
      expect(status.canTransitionTo(OrderStatus.PROCESSING)).toBe(false);
      expect(status.canTransitionTo(OrderStatus.SHIPPED)).toBe(false);
      expect(status.canTransitionTo(OrderStatus.DELIVERED)).toBe(false);
    });
  });

  describe('isTerminal', () => {
    it('should return true for DELIVERED', () => {
      expect(OrderStatus.DELIVERED.isTerminal()).toBe(true);
    });

    it('should return true for CANCELLED', () => {
      expect(OrderStatus.CANCELLED.isTerminal()).toBe(true);
    });

    it('should return false for PENDING', () => {
      expect(OrderStatus.PENDING.isTerminal()).toBe(false);
    });

    it('should return false for PROCESSING', () => {
      expect(OrderStatus.PROCESSING.isTerminal()).toBe(false);
    });

    it('should return false for SHIPPED', () => {
      expect(OrderStatus.SHIPPED.isTerminal()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same status', () => {
      const status1 = OrderStatus.PENDING;
      const status2 = OrderStatus.PENDING;

      expect(status1.equals(status2)).toBe(true);
    });

    it('should return false for different statuses', () => {
      const status1 = OrderStatus.PENDING;
      const status2 = OrderStatus.PROCESSING;

      expect(status1.equals(status2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return status value', () => {
      expect(OrderStatus.PENDING.toString()).toBe('pending');
      expect(OrderStatus.PROCESSING.toString()).toBe('processing');
      expect(OrderStatus.SHIPPED.toString()).toBe('shipped');
      expect(OrderStatus.DELIVERED.toString()).toBe('delivered');
      expect(OrderStatus.CANCELLED.toString()).toBe('cancelled');
    });
  });
});

