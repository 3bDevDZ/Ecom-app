import { CartStatus } from '../../../src/modules/order-management/domain/value-objects/cart-status';

describe('CartStatus Value Object', () => {
  describe('create', () => {
    it('should create ACTIVE status', () => {
      const status = CartStatus.ACTIVE;

      expect(status.value).toBe('active');
      expect(status.isActive()).toBe(true);
    });

    it('should create ABANDONED status', () => {
      const status = CartStatus.ABANDONED;

      expect(status.value).toBe('abandoned');
      expect(status.isAbandoned()).toBe(true);
    });

    it('should create CONVERTED status', () => {
      const status = CartStatus.CONVERTED;

      expect(status.value).toBe('converted');
      expect(status.isConverted()).toBe(true);
    });
  });

  describe('canTransitionTo', () => {
    it('should allow ACTIVE to ABANDONED', () => {
      const status = CartStatus.ACTIVE;

      expect(status.canTransitionTo(CartStatus.ABANDONED)).toBe(true);
    });

    it('should allow ACTIVE to CONVERTED', () => {
      const status = CartStatus.ACTIVE;

      expect(status.canTransitionTo(CartStatus.CONVERTED)).toBe(true);
    });

    it('should not allow ACTIVE to ACTIVE', () => {
      const status = CartStatus.ACTIVE;

      expect(status.canTransitionTo(CartStatus.ACTIVE)).toBe(false);
    });

    it('should not allow transitions from ABANDONED', () => {
      const status = CartStatus.ABANDONED;

      expect(status.canTransitionTo(CartStatus.ACTIVE)).toBe(false);
      expect(status.canTransitionTo(CartStatus.CONVERTED)).toBe(false);
    });

    it('should not allow transitions from CONVERTED', () => {
      const status = CartStatus.CONVERTED;

      expect(status.canTransitionTo(CartStatus.ACTIVE)).toBe(false);
      expect(status.canTransitionTo(CartStatus.ABANDONED)).toBe(false);
    });
  });

  describe('isTerminal', () => {
    it('should return true for ABANDONED', () => {
      expect(CartStatus.ABANDONED.isTerminal()).toBe(true);
    });

    it('should return true for CONVERTED', () => {
      expect(CartStatus.CONVERTED.isTerminal()).toBe(true);
    });

    it('should return false for ACTIVE', () => {
      expect(CartStatus.ACTIVE.isTerminal()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same status', () => {
      const status1 = CartStatus.ACTIVE;
      const status2 = CartStatus.ACTIVE;

      expect(status1.equals(status2)).toBe(true);
    });

    it('should return false for different statuses', () => {
      const status1 = CartStatus.ACTIVE;
      const status2 = CartStatus.ABANDONED;

      expect(status1.equals(status2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return status value', () => {
      expect(CartStatus.ACTIVE.toString()).toBe('active');
      expect(CartStatus.ABANDONED.toString()).toBe('abandoned');
      expect(CartStatus.CONVERTED.toString()).toBe('converted');
    });
  });
});

